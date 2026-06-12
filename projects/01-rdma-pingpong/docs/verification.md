# Verification

The starter has two verification layers:

- Local checks that compile code and run protocol tests without RDMA hardware.
- Hardware or RXE checks that complete the actual RDMA SEND/RECV round trip.

## Build

```sh
make -C projects/01-rdma-pingpong/starter
```

Expected result:

- The client and server binaries build successfully.

## Protocol Tests

```sh
make -C projects/01-rdma-pingpong/starter test
```

Expected result:

- Endpoint metadata serializes and parses round-trip.
- Malformed endpoint metadata is rejected.
- Payload mismatch handling returns a non-zero validation result.

## Run Server

```sh
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-server \
  --device <device> \
  --ib-port 1 \
  --tcp-port 7471 \
  --gid-index <gid-index-if-needed> \
  --debug
```

Expected result:

- The server opens the device, prints local endpoint metadata, listens on the
  TCP control port, posts a receive, validates `rdma-ping`, and sends
  `rdma-pong`.

## Run Client

```sh
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-client \
  --server <server-ip-or-hostname> \
  --device <device> \
  --ib-port 1 \
  --tcp-port 7471 \
  --gid-index <gid-index-if-needed> \
  --debug
```

Expected result:

- The client completes one request/response exchange.
- Both peers report successful send and receive completions.
- The client validates the response payload.

## Payload Negative Check

Start the server with a different expected request:

```sh
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-server \
  --device <device> \
  --ib-port 1 \
  --expect-request wrong-payload
```

Then run the default client. Expected result:

- The server exits non-zero after reporting a payload mismatch.
- The client eventually exits non-zero because no valid response arrives.

## Argument Negative Check

These checks do not need RDMA hardware:

```sh
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-client
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-server --timeout-ms not-a-number
```

Expected result:

- The commands exit non-zero.
- The diagnostics identify the missing `--server` or invalid timeout value.

## Device Negative Check

Run with an invalid device or port.

Expected result:

- The command exits non-zero.
- The error identifies the invalid resource.

## Local Run Notes

The current local environment can compile the verbs binaries and run the parser
tests, but it does not expose usable RDMA devices:

```text
ibv_devices
Failed to get IB devices list: Function not implemented
```

Use an RDMA-capable host or a configured RXE interface to complete the
end-to-end data movement check.
