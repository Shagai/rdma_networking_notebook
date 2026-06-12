#include "common.h"

#include <stdio.h>
#include <string.h>
#include <unistd.h>

struct server_options {
    struct pp_options common;
    char expect_request[PP_MAX_PAYLOAD];
    char response[PP_MAX_PAYLOAD];
};

static void usage(const char *program)
{
    printf("Usage: %s [options]\n\n", program);
    printf("Server options:\n");
    printf("  --expect-request <text>  Request payload to validate. Default: %s.\n", PP_DEFAULT_REQUEST);
    printf("  --response <text>        Response payload to send. Default: %s.\n", PP_DEFAULT_RESPONSE);
    printf("  --help                   Show this help.\n\n");
    pp_print_common_usage();
}

static int parse_args(int argc, char **argv, struct server_options *opts)
{
    pp_options_init(&opts->common);
    snprintf(opts->expect_request, sizeof(opts->expect_request), "%s", PP_DEFAULT_REQUEST);
    snprintf(opts->response, sizeof(opts->response), "%s", PP_DEFAULT_RESPONSE);

    for (int i = 1; i < argc; ++i) {
        int common = pp_parse_common_arg(&opts->common, &i, argc, argv);
        if (common < 0) {
            return -1;
        }
        if (common > 0) {
            continue;
        }

        if (strcmp(argv[i], "--expect-request") == 0) {
            if (i + 1 >= argc) {
                fprintf(stderr, "--expect-request requires a value\n");
                return -1;
            }
            if (pp_set_text(opts->expect_request, sizeof(opts->expect_request), argv[++i], "--expect-request") != 0) {
                return -1;
            }
        } else if (strcmp(argv[i], "--response") == 0) {
            if (i + 1 >= argc) {
                fprintf(stderr, "--response requires a value\n");
                return -1;
            }
            if (pp_set_text(opts->response, sizeof(opts->response), argv[++i], "--response") != 0) {
                return -1;
            }
        } else if (strcmp(argv[i], "--help") == 0) {
            usage(argv[0]);
            return 1;
        } else {
            fprintf(stderr, "unknown option: %s\n", argv[i]);
            usage(argv[0]);
            return -1;
        }
    }

    return 0;
}

static int exchange_endpoints(int control_fd, const struct pp_endpoint *local, struct pp_endpoint *remote)
{
    char line[PP_CONTROL_LINE_MAX];

    /* The server receives first so the client can initiate the metadata handshake. */
    if (pp_recv_line(control_fd, line, sizeof(line)) != 0) {
        return -1;
    }
    if (pp_parse_endpoint_line(line, remote) != 0) {
        fprintf(stderr, "client sent malformed endpoint metadata: %s", line);
        return -1;
    }

    if (pp_format_endpoint_line(local, line, sizeof(line)) != 0) {
        fprintf(stderr, "could not format local endpoint metadata\n");
        return -1;
    }
    return pp_send_line(control_fd, line);
}

int main(int argc, char **argv)
{
    struct server_options opts;
    int parsed = parse_args(argc, argv, &opts);
    if (parsed != 0) {
        return parsed > 0 ? 0 : 2;
    }

    struct pp_context ctx;
    int control_fd = -1;
    int exit_code = 1;

    if (pp_context_init(&ctx, &opts.common) != 0) {
        return 1;
    }

    /*
     * The server owns the passive TCP side. RDMA resources are created before
     * accept so the endpoint line can be returned immediately after connection.
     */
    control_fd = pp_server_accept(opts.common.tcp_port);
    if (control_fd < 0) {
        goto out;
    }

    struct pp_endpoint remote;
    if (exchange_endpoints(control_fd, &ctx.local, &remote) != 0) {
        goto out;
    }

    if (pp_connect_qp(&ctx, &remote) != 0) {
        goto out;
    }

    /* Post receive before READY so the client's first SEND has a destination. */
    if (pp_post_recv(&ctx) != 0) {
        goto out;
    }

    if (pp_send_line(control_fd, "READY\n") != 0) {
        goto out;
    }

    size_t received_len = 0;
    if (pp_wait_completion(ctx.recv_cq, PP_WR_RECV, opts.common.timeout_ms, "server receive", &received_len) != 0) {
        goto out;
    }
    /* Completions report byte length, not string termination. */
    if (received_len >= PP_MAX_PAYLOAD) {
        ctx.recv_buf[PP_MAX_PAYLOAD - 1] = '\0';
    } else {
        ctx.recv_buf[received_len] = '\0';
    }

    char error[PP_CONTROL_LINE_MAX];
    if (pp_payload_matches(ctx.recv_buf, opts.expect_request, error, sizeof(error)) != 0) {
        fprintf(stderr, "%s\n", error);
        goto out;
    }
    printf("server received expected request: '%s'\n", ctx.recv_buf);

    /* The response is another SEND into the receive the client posted earlier. */
    if (pp_post_send(&ctx, opts.response) != 0) {
        goto out;
    }
    if (pp_wait_completion(ctx.send_cq, PP_WR_SEND, opts.common.timeout_ms, "server send", NULL) != 0) {
        goto out;
    }

    printf("server sent response: '%s'\n", opts.response);
    exit_code = 0;

out:
    if (control_fd >= 0) {
        close(control_fd);
    }
    pp_context_destroy(&ctx);
    return exit_code;
}
