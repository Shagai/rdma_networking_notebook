#include "common.h"

#include <stdio.h>
#include <string.h>
#include <unistd.h>

struct client_options {
    struct pp_options common;
    bool has_server;
    char server[256];
    char request[PP_MAX_PAYLOAD];
    char expected_response[PP_MAX_PAYLOAD];
};

static void usage(const char *program)
{
    printf("Usage: %s --server <host-or-ip> [options]\n\n", program);
    printf("Client options:\n");
    printf("  --server <host-or-ip>       Server TCP control address.\n");
    printf("  --request <text>            Request payload to send. Default: %s.\n", PP_DEFAULT_REQUEST);
    printf("  --expected-response <text>  Response payload to validate. Default: %s.\n", PP_DEFAULT_RESPONSE);
    printf("  --help                      Show this help.\n\n");
    pp_print_common_usage();
}

static int parse_args(int argc, char **argv, struct client_options *opts)
{
    memset(opts, 0, sizeof(*opts));
    pp_options_init(&opts->common);
    snprintf(opts->request, sizeof(opts->request), "%s", PP_DEFAULT_REQUEST);
    snprintf(opts->expected_response, sizeof(opts->expected_response), "%s", PP_DEFAULT_RESPONSE);

    for (int i = 1; i < argc; ++i) {
        int common = pp_parse_common_arg(&opts->common, &i, argc, argv);
        if (common < 0) {
            return -1;
        }
        if (common > 0) {
            continue;
        }

        if (strcmp(argv[i], "--server") == 0) {
            if (i + 1 >= argc) {
                fprintf(stderr, "--server requires a value\n");
                return -1;
            }
            if (pp_set_text(opts->server, sizeof(opts->server), argv[++i], "--server") != 0) {
                return -1;
            }
            opts->has_server = true;
        } else if (strcmp(argv[i], "--request") == 0) {
            if (i + 1 >= argc) {
                fprintf(stderr, "--request requires a value\n");
                return -1;
            }
            if (pp_set_text(opts->request, sizeof(opts->request), argv[++i], "--request") != 0) {
                return -1;
            }
        } else if (strcmp(argv[i], "--expected-response") == 0) {
            if (i + 1 >= argc) {
                fprintf(stderr, "--expected-response requires a value\n");
                return -1;
            }
            if (pp_set_text(opts->expected_response, sizeof(opts->expected_response), argv[++i], "--expected-response") != 0) {
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

    if (!opts->has_server) {
        fprintf(stderr, "--server is required\n");
        usage(argv[0]);
        return -1;
    }

    return 0;
}

static int exchange_endpoints(int control_fd, const struct pp_endpoint *local, struct pp_endpoint *remote)
{
    char line[PP_CONTROL_LINE_MAX];

    /* The client sends its endpoint first, then learns the server endpoint. */
    if (pp_format_endpoint_line(local, line, sizeof(line)) != 0) {
        fprintf(stderr, "could not format local endpoint metadata\n");
        return -1;
    }
    if (pp_send_line(control_fd, line) != 0) {
        return -1;
    }

    if (pp_recv_line(control_fd, line, sizeof(line)) != 0) {
        return -1;
    }
    if (pp_parse_endpoint_line(line, remote) != 0) {
        fprintf(stderr, "server sent malformed endpoint metadata: %s", line);
        return -1;
    }

    return 0;
}

int main(int argc, char **argv)
{
    struct client_options opts;
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

    control_fd = pp_client_connect(opts.server, opts.common.tcp_port);
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

    /*
     * The client posts the response receive before sending the request. This
     * keeps both peers out of RNR and makes the ping-pong ordering explicit.
     */
    if (pp_post_recv(&ctx) != 0) {
        goto out;
    }

    /* READY means the server QP is RTS and its request receive is posted. */
    char line[PP_CONTROL_LINE_MAX];
    if (pp_recv_line(control_fd, line, sizeof(line)) != 0) {
        goto out;
    }
    if (strcmp(line, "READY\n") != 0) {
        fprintf(stderr, "server did not report READY, got: %s", line);
        goto out;
    }

    if (pp_post_send(&ctx, opts.request) != 0) {
        goto out;
    }
    if (pp_wait_completion(ctx.send_cq, PP_WR_SEND, opts.common.timeout_ms, "client send", NULL) != 0) {
        goto out;
    }

    size_t received_len = 0;
    if (pp_wait_completion(ctx.recv_cq, PP_WR_RECV, opts.common.timeout_ms, "client receive", &received_len) != 0) {
        goto out;
    }
    /* Completions describe bytes transferred; make the fixed buffer printable. */
    if (received_len >= PP_MAX_PAYLOAD) {
        ctx.recv_buf[PP_MAX_PAYLOAD - 1] = '\0';
    } else {
        ctx.recv_buf[received_len] = '\0';
    }

    char error[PP_CONTROL_LINE_MAX];
    if (pp_payload_matches(ctx.recv_buf, opts.expected_response, error, sizeof(error)) != 0) {
        fprintf(stderr, "%s\n", error);
        goto out;
    }

    printf("client sent request: '%s'\n", opts.request);
    printf("client received expected response: '%s'\n", ctx.recv_buf);
    exit_code = 0;

out:
    if (control_fd >= 0) {
        close(control_fd);
    }
    pp_context_destroy(&ctx);
    return exit_code;
}
