#include "common.h"

#include <arpa/inet.h>
#include <errno.h>
#include <inttypes.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <time.h>
#include <unistd.h>

static uint64_t monotonic_ms(void)
{
    struct timespec now;
    clock_gettime(CLOCK_MONOTONIC, &now);
    return (uint64_t)now.tv_sec * 1000u + (uint64_t)now.tv_nsec / 1000000u;
}

static uint32_t make_psn(void)
{
    /*
     * RC QPs need a packet sequence number on both sides. A random-looking PSN
     * avoids reusing zero in repeated local experiments.
     */
    struct timespec now;
    clock_gettime(CLOCK_MONOTONIC, &now);
    unsigned int seed = (unsigned int)(now.tv_nsec ^ (now.tv_sec << 12) ^ getpid());
    uint32_t psn = (uint32_t)rand_r(&seed) & 0xffffffu;
    return psn == 0 ? 1u : psn;
}

static const char *link_layer_name(uint8_t link_layer)
{
    switch (link_layer) {
    case IBV_LINK_LAYER_INFINIBAND:
        return "InfiniBand";
    case IBV_LINK_LAYER_ETHERNET:
        return "Ethernet/RoCE";
    default:
        return "unspecified";
    }
}

void pp_print_common_usage(void)
{
    printf("Common options:\n");
    printf("  --device <name>       RDMA device name. Defaults to the first verbs device.\n");
    printf("  --ib-port <n>         RDMA port number. --port is accepted as an alias. Default: %d.\n", PP_DEFAULT_IB_PORT);
    printf("  --gid-index <n>       GID index for RoCE. Default: -1, or 0 on Ethernet/RoCE ports.\n");
    printf("  --tcp-port <port>     TCP control-plane port. Default: %s.\n", PP_DEFAULT_TCP_PORT);
    printf("  --timeout-ms <ms>     Completion timeout. Default: %d.\n", PP_DEFAULT_TIMEOUT_MS);
    printf("  --debug               Print endpoint metadata and completion progress.\n");
}

void pp_print_endpoint(const char *label, const struct pp_endpoint *endpoint)
{
    char line[PP_ENDPOINT_LINE_MAX];
    if (pp_format_endpoint_line(endpoint, line, sizeof(line)) == 0) {
        line[strcspn(line, "\n")] = '\0';
        printf("%s endpoint: %s\n", label, line);
    }
}

static int choose_device(struct pp_context *ctx)
{
    /*
     * If --device is omitted, use the first verbs device. That keeps the first
     * lab command short while still allowing exact device selection on multi-HCA hosts.
     */
    int device_count = 0;
    struct ibv_device **devices = ibv_get_device_list(&device_count);
    if (devices == NULL) {
        fprintf(stderr, "ibv_get_device_list failed: %s\n", strerror(errno));
        return -1;
    }
    if (device_count == 0) {
        fprintf(stderr, "no RDMA devices found; try configuring RXE or running on an RDMA-capable host\n");
        ibv_free_device_list(devices);
        return -1;
    }

    struct ibv_device *selected = NULL;
    for (int i = 0; i < device_count; ++i) {
        const char *name = ibv_get_device_name(devices[i]);
        if (!ctx->opts.has_device || strcmp(name, ctx->opts.device_name) == 0) {
            selected = devices[i];
            snprintf(ctx->opened_device_name, sizeof(ctx->opened_device_name), "%s", name);
            break;
        }
    }

    if (selected == NULL) {
        fprintf(stderr, "RDMA device '%s' was not found. Available devices:", ctx->opts.device_name);
        for (int i = 0; i < device_count; ++i) {
            fprintf(stderr, " %s", ibv_get_device_name(devices[i]));
        }
        fprintf(stderr, "\n");
        ibv_free_device_list(devices);
        return -1;
    }

    ctx->verbs = ibv_open_device(selected);
    if (ctx->verbs == NULL) {
        fprintf(stderr, "ibv_open_device(%s) failed: %s\n", ctx->opened_device_name, strerror(errno));
        ibv_free_device_list(devices);
        return -1;
    }

    ibv_free_device_list(devices);
    return 0;
}

static int query_port_and_gid(struct pp_context *ctx)
{
    /*
     * The local endpoint needs link-layer metadata before QP connection.
     * InfiniBand uses LID routing; RoCE usually needs a GID index as well.
     */
    if (ibv_query_port(ctx->verbs, (uint8_t)ctx->opts.ib_port, &ctx->port_attr) != 0) {
        fprintf(stderr, "ibv_query_port(%d) failed: %s\n", ctx->opts.ib_port, strerror(errno));
        return -1;
    }

    if (ctx->port_attr.state != IBV_PORT_ACTIVE) {
        fprintf(stderr, "RDMA port %d is not active; state is %d\n", ctx->opts.ib_port, ctx->port_attr.state);
        return -1;
    }

    ctx->local.lid = ctx->port_attr.lid;
    ctx->local.gid_index = ctx->opts.gid_index;

    if (ctx->port_attr.link_layer == IBV_LINK_LAYER_ETHERNET && ctx->local.gid_index < 0) {
        ctx->local.gid_index = 0;
    }

    if (ctx->local.gid_index >= 0) {
        union ibv_gid gid;
        if (ibv_query_gid(ctx->verbs, (uint8_t)ctx->opts.ib_port, ctx->local.gid_index, &gid) != 0) {
            fprintf(stderr, "ibv_query_gid(port=%d, index=%d) failed: %s\n", ctx->opts.ib_port, ctx->local.gid_index, strerror(errno));
            return -1;
        }
        memcpy(ctx->local.gid, &gid, sizeof(ctx->local.gid));
    }

    return 0;
}

static int create_qp(struct pp_context *ctx)
{
    /*
     * Keep send and receive CQs separate in this first project. It makes each
     * completion wait map to exactly one expected operation in the code below.
     */
    ctx->pd = ibv_alloc_pd(ctx->verbs);
    if (ctx->pd == NULL) {
        fprintf(stderr, "ibv_alloc_pd failed: %s\n", strerror(errno));
        return -1;
    }

    ctx->send_cq = ibv_create_cq(ctx->verbs, 4, NULL, NULL, 0);
    if (ctx->send_cq == NULL) {
        fprintf(stderr, "ibv_create_cq(send) failed: %s\n", strerror(errno));
        return -1;
    }

    ctx->recv_cq = ibv_create_cq(ctx->verbs, 4, NULL, NULL, 0);
    if (ctx->recv_cq == NULL) {
        fprintf(stderr, "ibv_create_cq(recv) failed: %s\n", strerror(errno));
        return -1;
    }

    struct ibv_qp_init_attr qp_init;
    memset(&qp_init, 0, sizeof(qp_init));
    qp_init.send_cq = ctx->send_cq;
    qp_init.recv_cq = ctx->recv_cq;
    qp_init.qp_type = IBV_QPT_RC;
    qp_init.cap.max_send_wr = 4;
    qp_init.cap.max_recv_wr = 4;
    qp_init.cap.max_send_sge = 1;
    qp_init.cap.max_recv_sge = 1;

    ctx->qp = ibv_create_qp(ctx->pd, &qp_init);
    if (ctx->qp == NULL) {
        fprintf(stderr, "ibv_create_qp failed: %s\n", strerror(errno));
        return -1;
    }

    struct ibv_qp_attr init_attr;
    memset(&init_attr, 0, sizeof(init_attr));
    init_attr.qp_state = IBV_QPS_INIT;
    init_attr.pkey_index = 0;
    init_attr.port_num = (uint8_t)ctx->opts.ib_port;
    /* SEND/RECV does not require remote read/write/atomic permissions. */
    init_attr.qp_access_flags = 0;

    int flags = IBV_QP_STATE | IBV_QP_PKEY_INDEX | IBV_QP_PORT | IBV_QP_ACCESS_FLAGS;
    if (ibv_modify_qp(ctx->qp, &init_attr, flags) != 0) {
        fprintf(stderr, "QP transition RESET->INIT failed: %s\n", strerror(errno));
        return -1;
    }

    ctx->local.qpn = ctx->qp->qp_num;
    ctx->local.psn = make_psn();
    return 0;
}

static int register_buffers(struct pp_context *ctx)
{
    /*
     * Even SEND/RECV buffers must be registered. The NIC uses the lkey to check
     * that each posted SGE points at memory owned by this protection domain.
     */
    ctx->send_buf = calloc(1, PP_MAX_PAYLOAD);
    ctx->recv_buf = calloc(1, PP_MAX_PAYLOAD);
    if (ctx->send_buf == NULL || ctx->recv_buf == NULL) {
        fprintf(stderr, "buffer allocation failed\n");
        return -1;
    }

    ctx->send_mr = ibv_reg_mr(ctx->pd, ctx->send_buf, PP_MAX_PAYLOAD, IBV_ACCESS_LOCAL_WRITE);
    if (ctx->send_mr == NULL) {
        fprintf(stderr, "ibv_reg_mr(send) failed: %s\n", strerror(errno));
        return -1;
    }

    ctx->recv_mr = ibv_reg_mr(ctx->pd, ctx->recv_buf, PP_MAX_PAYLOAD, IBV_ACCESS_LOCAL_WRITE);
    if (ctx->recv_mr == NULL) {
        fprintf(stderr, "ibv_reg_mr(recv) failed: %s\n", strerror(errno));
        return -1;
    }

    return 0;
}

int pp_context_init(struct pp_context *ctx, const struct pp_options *opts)
{
    memset(ctx, 0, sizeof(*ctx));
    ctx->opts = *opts;

    /*
     * Each step owns resources needed by the next one. On failure, destroy the
     * partially initialized context instead of duplicating cleanup paths.
     */
    if (choose_device(ctx) != 0 || query_port_and_gid(ctx) != 0 || create_qp(ctx) != 0 || register_buffers(ctx) != 0) {
        pp_context_destroy(ctx);
        return -1;
    }

    printf(
        "opened %s port %d (%s), LID 0x%04x, QPN 0x%06x\n",
        ctx->opened_device_name,
        ctx->opts.ib_port,
        link_layer_name(ctx->port_attr.link_layer),
        ctx->local.lid,
        ctx->local.qpn);

    if (ctx->opts.debug) {
        pp_print_endpoint("local", &ctx->local);
        printf("send lkey=0x%08x recv lkey=0x%08x\n", ctx->send_mr->lkey, ctx->recv_mr->lkey);
    }

    return 0;
}

void pp_context_destroy(struct pp_context *ctx)
{
    /*
     * Reverse construction order matters: destroy the QP before deregistering
     * memory and destroy CQs before deallocating the PD/device context.
     */
    if (ctx->qp != NULL) {
        ibv_destroy_qp(ctx->qp);
    }
    if (ctx->send_mr != NULL) {
        ibv_dereg_mr(ctx->send_mr);
    }
    if (ctx->recv_mr != NULL) {
        ibv_dereg_mr(ctx->recv_mr);
    }
    if (ctx->send_cq != NULL) {
        ibv_destroy_cq(ctx->send_cq);
    }
    if (ctx->recv_cq != NULL) {
        ibv_destroy_cq(ctx->recv_cq);
    }
    if (ctx->pd != NULL) {
        ibv_dealloc_pd(ctx->pd);
    }
    if (ctx->verbs != NULL) {
        ibv_close_device(ctx->verbs);
    }
    free(ctx->send_buf);
    free(ctx->recv_buf);
    memset(ctx, 0, sizeof(*ctx));
}

int pp_connect_qp(struct pp_context *ctx, const struct pp_endpoint *remote)
{
    /*
     * RTR binds this local QP to the remote QPN and path. The receive PSN must
     * match the peer's send PSN or RC packet ordering will fail immediately.
     */
    struct ibv_qp_attr rtr;
    memset(&rtr, 0, sizeof(rtr));
    rtr.qp_state = IBV_QPS_RTR;
    rtr.path_mtu = ctx->port_attr.active_mtu;
    rtr.dest_qp_num = remote->qpn;
    rtr.rq_psn = remote->psn;
    rtr.max_dest_rd_atomic = 1;
    rtr.min_rnr_timer = 12;
    rtr.ah_attr.dlid = remote->lid;
    rtr.ah_attr.sl = 0;
    rtr.ah_attr.src_path_bits = 0;
    rtr.ah_attr.port_num = (uint8_t)ctx->opts.ib_port;

    if (!pp_gid_is_zero(remote->gid) || ctx->port_attr.link_layer == IBV_LINK_LAYER_ETHERNET) {
        /* RoCE routes through a GRH; InfiniBand LID-only paths can skip it. */
        rtr.ah_attr.is_global = 1;
        memcpy(&rtr.ah_attr.grh.dgid, remote->gid, sizeof(remote->gid));
        rtr.ah_attr.grh.sgid_index = ctx->local.gid_index >= 0 ? (uint8_t)ctx->local.gid_index : 0;
        rtr.ah_attr.grh.hop_limit = 1;
    }

    int rtr_flags = IBV_QP_STATE |
                    IBV_QP_AV |
                    IBV_QP_PATH_MTU |
                    IBV_QP_DEST_QPN |
                    IBV_QP_RQ_PSN |
                    IBV_QP_MAX_DEST_RD_ATOMIC |
                    IBV_QP_MIN_RNR_TIMER;
    if (ibv_modify_qp(ctx->qp, &rtr, rtr_flags) != 0) {
        fprintf(stderr, "QP transition INIT->RTR failed: %s\n", strerror(errno));
        return -1;
    }

    struct ibv_qp_attr rts;
    memset(&rts, 0, sizeof(rts));
    rts.qp_state = IBV_QPS_RTS;
    /*
     * RTS enables sending. The retry values are forgiving for a lab program so
     * transient RNR conditions surface as timeouts less often.
     */
    rts.timeout = 14;
    rts.retry_cnt = 7;
    rts.rnr_retry = 7;
    rts.sq_psn = ctx->local.psn;
    rts.max_rd_atomic = 1;

    int rts_flags = IBV_QP_STATE |
                    IBV_QP_TIMEOUT |
                    IBV_QP_RETRY_CNT |
                    IBV_QP_RNR_RETRY |
                    IBV_QP_SQ_PSN |
                    IBV_QP_MAX_QP_RD_ATOMIC;
    if (ibv_modify_qp(ctx->qp, &rts, rts_flags) != 0) {
        fprintf(stderr, "QP transition RTR->RTS failed: %s\n", strerror(errno));
        return -1;
    }

    if (ctx->opts.debug) {
        pp_print_endpoint("remote", remote);
        printf("QP is RTS\n");
    }

    return 0;
}

int pp_post_recv(struct pp_context *ctx)
{
    /*
     * The receive SGE advertises writable memory to the NIC. Peers must post
     * receives before the remote SEND arrives or RC may report RNR.
     */
    struct ibv_sge sge;
    memset(&sge, 0, sizeof(sge));
    sge.addr = (uintptr_t)ctx->recv_buf;
    sge.length = PP_MAX_PAYLOAD;
    sge.lkey = ctx->recv_mr->lkey;

    struct ibv_recv_wr wr;
    memset(&wr, 0, sizeof(wr));
    wr.wr_id = PP_WR_RECV;
    wr.sg_list = &sge;
    wr.num_sge = 1;

    struct ibv_recv_wr *bad_wr = NULL;
    if (ibv_post_recv(ctx->qp, &wr, &bad_wr) != 0) {
        fprintf(stderr, "ibv_post_recv failed: %s\n", strerror(errno));
        return -1;
    }

    if (ctx->opts.debug) {
        printf("posted receive buffer\n");
    }
    return 0;
}

int pp_post_send(struct pp_context *ctx, const char *payload)
{
    size_t payload_len = strlen(payload);
    if (payload_len >= PP_MAX_PAYLOAD) {
        fprintf(stderr, "payload is too large; max is %d bytes\n", PP_MAX_PAYLOAD - 1);
        return -1;
    }

    memset(ctx->send_buf, 0, PP_MAX_PAYLOAD);
    memcpy(ctx->send_buf, payload, payload_len + 1);

    /*
     * IBV_WR_SEND copies bytes from the local SGE into a receive buffer already
     * posted on the remote QP. No remote address or rkey is needed for SEND.
     */
    struct ibv_sge sge;
    memset(&sge, 0, sizeof(sge));
    sge.addr = (uintptr_t)ctx->send_buf;
    sge.length = (uint32_t)(payload_len + 1);
    sge.lkey = ctx->send_mr->lkey;

    struct ibv_send_wr wr;
    memset(&wr, 0, sizeof(wr));
    wr.wr_id = PP_WR_SEND;
    wr.opcode = IBV_WR_SEND;
    wr.sg_list = &sge;
    wr.num_sge = 1;
    wr.send_flags = IBV_SEND_SIGNALED;

    struct ibv_send_wr *bad_wr = NULL;
    if (ibv_post_send(ctx->qp, &wr, &bad_wr) != 0) {
        fprintf(stderr, "ibv_post_send failed: %s\n", strerror(errno));
        return -1;
    }

    if (ctx->opts.debug) {
        printf("posted send payload '%s'\n", payload);
    }
    return 0;
}

int pp_wait_completion(
    struct ibv_cq *cq,
    uint64_t expected_wr_id,
    int timeout_ms,
    const char *label,
    size_t *byte_len)
{
    uint64_t start = monotonic_ms();

    /*
     * Busy polling is deliberate for the first example: fewer moving parts than
     * completion channels, and it makes timeout handling easy to see.
     */
    for (;;) {
        struct ibv_wc wc;
        memset(&wc, 0, sizeof(wc));
        int polled = ibv_poll_cq(cq, 1, &wc);
        if (polled < 0) {
            fprintf(stderr, "ibv_poll_cq(%s) failed\n", label);
            return -1;
        }

        if (polled == 0) {
            if (monotonic_ms() - start > (uint64_t)timeout_ms) {
                fprintf(stderr, "timed out waiting for %s completion after %d ms\n", label, timeout_ms);
                return -1;
            }
            usleep(1000);
            continue;
        }

        if (wc.status != IBV_WC_SUCCESS) {
            fprintf(stderr, "%s completion failed: %s (%d)\n", label, ibv_wc_status_str(wc.status), wc.status);
            return -1;
        }

        if (wc.wr_id != expected_wr_id) {
            fprintf(stderr, "%s completion had unexpected wr_id=%" PRIu64 "\n", label, wc.wr_id);
            return -1;
        }

        if (byte_len != NULL) {
            *byte_len = wc.byte_len;
        }
        return 0;
    }
}

static int create_bound_socket(const char *tcp_port)
{
    /* TCP is only the control plane for metadata exchange, not the data path. */
    struct addrinfo hints;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE;

    struct addrinfo *result = NULL;
    int rc = getaddrinfo(NULL, tcp_port, &hints, &result);
    if (rc != 0) {
        fprintf(stderr, "getaddrinfo(listen:%s) failed: %s\n", tcp_port, gai_strerror(rc));
        return -1;
    }

    int listen_fd = -1;
    for (struct addrinfo *ai = result; ai != NULL; ai = ai->ai_next) {
        listen_fd = socket(ai->ai_family, ai->ai_socktype, ai->ai_protocol);
        if (listen_fd < 0) {
            continue;
        }

        int one = 1;
        setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one));

        if (bind(listen_fd, ai->ai_addr, ai->ai_addrlen) == 0 && listen(listen_fd, 1) == 0) {
            break;
        }

        close(listen_fd);
        listen_fd = -1;
    }

    freeaddrinfo(result);

    if (listen_fd < 0) {
        fprintf(stderr, "could not bind TCP control port %s: %s\n", tcp_port, strerror(errno));
        return -1;
    }

    return listen_fd;
}

int pp_server_accept(const char *tcp_port)
{
    int listen_fd = create_bound_socket(tcp_port);
    if (listen_fd < 0) {
        return -1;
    }

    printf("waiting for TCP control connection on port %s\n", tcp_port);
    int fd = accept(listen_fd, NULL, NULL);
    if (fd < 0) {
        fprintf(stderr, "accept failed: %s\n", strerror(errno));
    }

    close(listen_fd);
    return fd;
}

int pp_client_connect(const char *host, const char *tcp_port)
{
    struct addrinfo hints;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    struct addrinfo *result = NULL;
    int rc = getaddrinfo(host, tcp_port, &hints, &result);
    if (rc != 0) {
        fprintf(stderr, "getaddrinfo(%s:%s) failed: %s\n", host, tcp_port, gai_strerror(rc));
        return -1;
    }

    int fd = -1;
    for (struct addrinfo *ai = result; ai != NULL; ai = ai->ai_next) {
        fd = socket(ai->ai_family, ai->ai_socktype, ai->ai_protocol);
        if (fd < 0) {
            continue;
        }

        if (connect(fd, ai->ai_addr, ai->ai_addrlen) == 0) {
            break;
        }

        close(fd);
        fd = -1;
    }

    freeaddrinfo(result);

    if (fd < 0) {
        fprintf(stderr, "could not connect to %s:%s: %s\n", host, tcp_port, strerror(errno));
        return -1;
    }

    printf("connected TCP control channel to %s:%s\n", host, tcp_port);
    return fd;
}

int pp_send_line(int fd, const char *line)
{
    size_t total = 0;
    size_t len = strlen(line);

    /* send(2) may write only part of a line, so loop until the whole record is sent. */
    while (total < len) {
        ssize_t written = send(fd, line + total, len - total, 0);
        if (written < 0) {
            if (errno == EINTR) {
                continue;
            }
            fprintf(stderr, "send(control) failed: %s\n", strerror(errno));
            return -1;
        }
        if (written == 0) {
            fprintf(stderr, "send(control) wrote zero bytes\n");
            return -1;
        }
        total += (size_t)written;
    }

    return 0;
}

int pp_recv_line(int fd, char *line, size_t line_len)
{
    if (line_len == 0) {
        return -1;
    }

    size_t used = 0;
    /* Read one control record at a time to keep endpoint parsing simple. */
    while (used + 1 < line_len) {
        char ch = '\0';
        ssize_t received = recv(fd, &ch, 1, 0);
        if (received < 0) {
            if (errno == EINTR) {
                continue;
            }
            fprintf(stderr, "recv(control) failed: %s\n", strerror(errno));
            return -1;
        }
        if (received == 0) {
            fprintf(stderr, "control channel closed before a full line arrived\n");
            return -1;
        }

        line[used++] = ch;
        if (ch == '\n') {
            line[used] = '\0';
            return 0;
        }
    }

    line[line_len - 1] = '\0';
    fprintf(stderr, "control line exceeded %zu bytes\n", line_len - 1);
    return -1;
}
