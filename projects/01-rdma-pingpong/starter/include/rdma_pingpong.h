#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define PP_DEFAULT_TCP_PORT "7471"
#define PP_DEFAULT_IB_PORT 1
#define PP_DEFAULT_TIMEOUT_MS 5000
#define PP_DEFAULT_REQUEST "rdma-ping"
#define PP_DEFAULT_RESPONSE "rdma-pong"
#define PP_MAX_PAYLOAD 256
#define PP_ENDPOINT_LINE_MAX 192
#define PP_CONTROL_LINE_MAX 192

enum pp_wr_id {
    /* Work request IDs let completion polling distinguish sends from receives. */
    PP_WR_SEND = 0x51,
    PP_WR_RECV = 0x52,
};

struct pp_endpoint {
    /*
     * Minimal metadata needed to connect an RC QP without RDMA CM. The TCP
     * socket exchanges this structure; data still moves through verbs.
     */
    uint16_t lid;
    uint32_t qpn;
    uint32_t psn;
    int gid_index;
    uint8_t gid[16];
};

struct pp_options {
    /* Shared command-line options used by both peers. */
    bool has_device;
    char device_name[64];
    int ib_port;
    int gid_index;
    char tcp_port[16];
    int timeout_ms;
    bool debug;
};

void pp_options_init(struct pp_options *opts);
int pp_parse_common_arg(struct pp_options *opts, int *index, int argc, char **argv);
int pp_parse_int_value(const char *value, int min, int max, const char *name, int *out);
int pp_set_text(char *dst, size_t dst_len, const char *value, const char *name);

int pp_format_endpoint_line(const struct pp_endpoint *endpoint, char *line, size_t line_len);
int pp_parse_endpoint_line(const char *line, struct pp_endpoint *endpoint);
bool pp_gid_is_zero(const uint8_t gid[16]);
int pp_payload_matches(const char *actual, const char *expected, char *error, size_t error_len);
