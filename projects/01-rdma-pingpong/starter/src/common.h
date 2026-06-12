#pragma once

#include "rdma_pingpong.h"

#include <infiniband/verbs.h>
#include <stddef.h>

struct pp_context {
    /*
     * Single-owner container for verbs objects. Cleanup in common.c walks this
     * in reverse dependency order so partially initialized contexts are safe.
     */
    struct pp_options opts;
    char opened_device_name[64];
    struct ibv_context *verbs;
    struct ibv_pd *pd;
    struct ibv_cq *send_cq;
    struct ibv_cq *recv_cq;
    struct ibv_qp *qp;
    struct ibv_mr *send_mr;
    struct ibv_mr *recv_mr;
    char *send_buf;
    char *recv_buf;
    struct ibv_port_attr port_attr;
    struct pp_endpoint local;
};

void pp_print_common_usage(void);
int pp_context_init(struct pp_context *ctx, const struct pp_options *opts);
void pp_context_destroy(struct pp_context *ctx);
int pp_connect_qp(struct pp_context *ctx, const struct pp_endpoint *remote);
void pp_print_endpoint(const char *label, const struct pp_endpoint *endpoint);

int pp_post_recv(struct pp_context *ctx);
int pp_post_send(struct pp_context *ctx, const char *payload);
int pp_wait_completion(
    struct ibv_cq *cq,
    uint64_t expected_wr_id,
    int timeout_ms,
    const char *label,
    size_t *byte_len);

int pp_server_accept(const char *tcp_port);
int pp_client_connect(const char *host, const char *tcp_port);
int pp_send_line(int fd, const char *line);
int pp_recv_line(int fd, char *line, size_t line_len);
