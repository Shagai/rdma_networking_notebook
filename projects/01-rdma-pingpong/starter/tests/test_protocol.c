#include "rdma_pingpong.h"

#include <stdio.h>
#include <string.h>

static int expect_true(int condition, const char *message)
{
    if (!condition) {
        fprintf(stderr, "FAIL: %s\n", message);
        return -1;
    }
    return 0;
}

static int test_endpoint_round_trip(void)
{
    /*
     * This test covers the TCP control-plane metadata without requiring an RDMA
     * device, which keeps CI useful even on non-RDMA hosts.
     */
    struct pp_endpoint endpoint;
    memset(&endpoint, 0, sizeof(endpoint));
    endpoint.lid = 0x23;
    endpoint.qpn = 0x3456;
    endpoint.psn = 0xabcdef;
    endpoint.gid_index = 3;
    for (size_t i = 0; i < sizeof(endpoint.gid); ++i) {
        endpoint.gid[i] = (uint8_t)i;
    }

    char line[PP_ENDPOINT_LINE_MAX];
    if (expect_true(pp_format_endpoint_line(&endpoint, line, sizeof(line)) == 0, "format endpoint") != 0) {
        return -1;
    }

    struct pp_endpoint parsed;
    if (expect_true(pp_parse_endpoint_line(line, &parsed) == 0, "parse endpoint") != 0) {
        return -1;
    }

    return expect_true(parsed.lid == endpoint.lid, "parsed lid") ||
           expect_true(parsed.qpn == endpoint.qpn, "parsed qpn") ||
           expect_true(parsed.psn == endpoint.psn, "parsed psn") ||
           expect_true(parsed.gid_index == endpoint.gid_index, "parsed gid index") ||
           expect_true(memcmp(parsed.gid, endpoint.gid, sizeof(endpoint.gid)) == 0, "parsed gid");
}

static int test_rejects_bad_endpoint(void)
{
    struct pp_endpoint endpoint;
    return expect_true(
        pp_parse_endpoint_line("LID=zzzz QPN=000001 PSN=000002 GID_INDEX=0 GID=00000000000000000000000000000000\n", &endpoint) != 0,
        "reject malformed LID") ||
           expect_true(
               pp_parse_endpoint_line("LID=0001 QPN=1000000 PSN=000002 GID_INDEX=0 GID=00000000000000000000000000000000\n", &endpoint) != 0,
               "reject out-of-range QPN") ||
           expect_true(
               pp_parse_endpoint_line("LID=0001 QPN=000001 PSN=000002 GID_INDEX=0 GID=short\n", &endpoint) != 0,
               "reject short GID");
}

static int test_payload_validation(void)
{
    char error[128];
    return expect_true(pp_payload_matches("rdma-pong", "rdma-pong", error, sizeof(error)) == 0, "matching payload") ||
           expect_true(pp_payload_matches("bad", "rdma-pong", error, sizeof(error)) != 0, "mismatched payload") ||
           expect_true(strstr(error, "payload mismatch") != NULL, "mismatch error text");
}

int main(void)
{
    if (test_endpoint_round_trip() != 0 ||
        test_rejects_bad_endpoint() != 0 ||
        test_payload_validation() != 0) {
        return 1;
    }

    puts("protocol tests passed");
    return 0;
}
