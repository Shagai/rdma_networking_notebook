#include "rdma_pingpong.h"

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int hex_value(char ch)
{
    if (ch >= '0' && ch <= '9') {
        return ch - '0';
    }
    if (ch >= 'a' && ch <= 'f') {
        return ch - 'a' + 10;
    }
    if (ch >= 'A' && ch <= 'F') {
        return ch - 'A' + 10;
    }
    return -1;
}

static int parse_gid_hex(const char *text, uint8_t gid[16])
{
    /* GIDs are printed as 16 raw bytes, two hex digits per byte. */
    if (strlen(text) != 32) {
        return -1;
    }

    for (size_t i = 0; i < 16; ++i) {
        int high = hex_value(text[i * 2]);
        int low = hex_value(text[i * 2 + 1]);
        if (high < 0 || low < 0) {
            return -1;
        }
        gid[i] = (uint8_t)((high << 4) | low);
    }

    return 0;
}

static void format_gid_hex(const uint8_t gid[16], char text[33])
{
    static const char digits[] = "0123456789abcdef";

    for (size_t i = 0; i < 16; ++i) {
        text[i * 2] = digits[(gid[i] >> 4) & 0xf];
        text[i * 2 + 1] = digits[gid[i] & 0xf];
    }
    text[32] = '\0';
}

void pp_options_init(struct pp_options *opts)
{
    memset(opts, 0, sizeof(*opts));
    opts->ib_port = PP_DEFAULT_IB_PORT;
    /* -1 means "not specified"; Ethernet/RoCE ports later default to index 0. */
    opts->gid_index = -1;
    opts->timeout_ms = PP_DEFAULT_TIMEOUT_MS;
    snprintf(opts->tcp_port, sizeof(opts->tcp_port), "%s", PP_DEFAULT_TCP_PORT);
}

int pp_parse_int_value(const char *value, int min, int max, const char *name, int *out)
{
    char *end = NULL;
    errno = 0;
    long parsed = strtol(value, &end, 10);
    if (errno != 0 || end == value || *end != '\0' || parsed < min || parsed > max) {
        fprintf(stderr, "%s must be an integer in [%d, %d], got '%s'\n", name, min, max, value);
        return -1;
    }

    *out = (int)parsed;
    return 0;
}

int pp_set_text(char *dst, size_t dst_len, const char *value, const char *name)
{
    size_t len = strlen(value);
    if (len == 0 || len >= dst_len) {
        fprintf(stderr, "%s must be between 1 and %zu bytes\n", name, dst_len - 1);
        return -1;
    }

    memcpy(dst, value, len + 1);
    return 0;
}

int pp_parse_common_arg(struct pp_options *opts, int *index, int argc, char **argv)
{
    const char *arg = argv[*index];

    /*
     * Return value convention:
     *   1  handled a common option
     *   0  option belongs to the caller
     *  -1  parse error
     */
    if (strcmp(arg, "--device") == 0) {
        if (*index + 1 >= argc) {
            fprintf(stderr, "--device requires a value\n");
            return -1;
        }
        if (pp_set_text(opts->device_name, sizeof(opts->device_name), argv[++(*index)], "--device") != 0) {
            return -1;
        }
        opts->has_device = true;
        return 1;
    }

    if (strcmp(arg, "--ib-port") == 0 || strcmp(arg, "--port") == 0) {
        if (*index + 1 >= argc) {
            fprintf(stderr, "%s requires a value\n", arg);
            return -1;
        }
        return pp_parse_int_value(argv[++(*index)], 1, 255, arg, &opts->ib_port) == 0 ? 1 : -1;
    }

    if (strcmp(arg, "--gid-index") == 0) {
        if (*index + 1 >= argc) {
            fprintf(stderr, "--gid-index requires a value\n");
            return -1;
        }
        return pp_parse_int_value(argv[++(*index)], -1, 255, "--gid-index", &opts->gid_index) == 0 ? 1 : -1;
    }

    if (strcmp(arg, "--tcp-port") == 0) {
        if (*index + 1 >= argc) {
            fprintf(stderr, "--tcp-port requires a value\n");
            return -1;
        }
        return pp_set_text(opts->tcp_port, sizeof(opts->tcp_port), argv[++(*index)], "--tcp-port") == 0 ? 1 : -1;
    }

    if (strcmp(arg, "--timeout-ms") == 0) {
        if (*index + 1 >= argc) {
            fprintf(stderr, "--timeout-ms requires a value\n");
            return -1;
        }
        return pp_parse_int_value(argv[++(*index)], 1, 600000, "--timeout-ms", &opts->timeout_ms) == 0 ? 1 : -1;
    }

    if (strcmp(arg, "--debug") == 0) {
        opts->debug = true;
        return 1;
    }

    return 0;
}

int pp_format_endpoint_line(const struct pp_endpoint *endpoint, char *line, size_t line_len)
{
    char gid_hex[33];
    format_gid_hex(endpoint->gid, gid_hex);

    /*
     * Keep the metadata line explicit and greppable. This is intentionally not
     * a packed binary protocol because this project is a teaching artifact.
     */
    int written = snprintf(
        line,
        line_len,
        "LID=%04x QPN=%06x PSN=%06x GID_INDEX=%d GID=%s\n",
        endpoint->lid,
        endpoint->qpn,
        endpoint->psn,
        endpoint->gid_index,
        gid_hex);

    if (written < 0 || (size_t)written >= line_len) {
        return -1;
    }

    return 0;
}

int pp_parse_endpoint_line(const char *line, struct pp_endpoint *endpoint)
{
    unsigned int lid = 0;
    unsigned int qpn = 0;
    unsigned int psn = 0;
    int gid_index = -1;
    char gid_hex[33] = {0};
    char extra[2] = {0};

    /*
     * The trailing extra token catches malformed lines that otherwise share a
     * valid prefix. QPN and PSN are restricted to their 24-bit wire values.
     */
    int matched = sscanf(
        line,
        "LID=%x QPN=%x PSN=%x GID_INDEX=%d GID=%32s %1s",
        &lid,
        &qpn,
        &psn,
        &gid_index,
        gid_hex,
        extra);

    if (matched != 5 || lid > 0xffffu || qpn > 0xffffffu || psn > 0xffffffu) {
        return -1;
    }

    memset(endpoint, 0, sizeof(*endpoint));
    endpoint->lid = (uint16_t)lid;
    endpoint->qpn = qpn;
    endpoint->psn = psn;
    endpoint->gid_index = gid_index;

    return parse_gid_hex(gid_hex, endpoint->gid);
}

bool pp_gid_is_zero(const uint8_t gid[16])
{
    /* InfiniBand-only examples often have no global route, so a zero GID is valid. */
    for (size_t i = 0; i < 16; ++i) {
        if (gid[i] != 0) {
            return false;
        }
    }
    return true;
}

int pp_payload_matches(const char *actual, const char *expected, char *error, size_t error_len)
{
    /* Buffers are fixed-size and zero-filled; bound the comparison to that size. */
    if (strncmp(actual, expected, PP_MAX_PAYLOAD) == 0) {
        return 0;
    }

    if (error != NULL && error_len > 0) {
        snprintf(error, error_len, "payload mismatch: expected '%s', received '%s'", expected, actual);
    }
    return -1;
}
