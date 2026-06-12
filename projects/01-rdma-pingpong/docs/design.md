# Design

## Problem Statement

This project builds the smallest useful RDMA round trip: a client sends a
message to a server, the server validates the request, and the server sends a
response back.

The implementation intentionally keeps verbs objects visible. It is not a
general runtime wrapper; it is a teaching example for the object lifetime that
later projects can factor into `05-mini-rdma-runtime`.

## Architecture

- Client: creates local RDMA resources, connects to the server, sends the first
  payload, waits for the response, and validates it.
- Server: creates local RDMA resources, waits for the client metadata, posts a
  receive, handles the request, and sends the response.
- Connection exchange: shares the queue-pair and memory details needed to move
  both peers into a usable state.
- Completion loop: polls send and receive completions until the expected work
  requests finish or a timeout occurs.

## Implemented Components

- `include/rdma_pingpong.h`: shared constants, endpoint metadata, work request
  identifiers, and protocol helpers.
- `src/protocol.c`: endpoint serialization, endpoint parsing, common argument
  parsing, and payload validation.
- `src/common.c`: verbs resource setup, queue-pair transitions, TCP control
  channel helpers, SEND/RECV posting, completion polling, and cleanup.
- `src/server.c`: one-shot responder that validates the request payload and
  sends the configured response.
- `src/client.c`: one-shot initiator that validates the server response.
- `tests/test_protocol.c`: hardware-independent checks for endpoint parsing and
  payload mismatch handling.

## Control Plane

The TCP socket is deliberately narrow. It exchanges one line of endpoint
metadata per peer:

```text
LID=0023 QPN=003456 PSN=abcdef GID_INDEX=3 GID=000102030405060708090a0b0c0d0e0f
```

After both queue pairs reach RTS, the server posts its receive and sends
`READY\n`. The client posts its receive before waiting for `READY`, then posts
the SEND work request. This keeps the receive-before-send invariant visible.

## Data Flow

1. Both peers allocate resources and register memory.
2. The peers exchange connection metadata over a simple control channel.
3. Both queue pairs transition through INIT, RTR, and RTS.
4. The server posts a receive buffer.
5. The server announces `READY` over the TCP control channel.
6. The client posts a receive buffer and then posts a send work request.
7. The server polls the receive completion and validates the payload.
8. The server posts a response send.
9. The client polls the receive completion and validates the response.

## Resource Lifetime

The code cleans up in the reverse order learners should memorize:

1. Queue pair.
2. Memory regions.
3. Completion queues.
4. Protection domain.
5. Device context.
6. Heap buffers and TCP socket.

## Failure Modes

- RDMA device or port is unavailable.
- Memory registration fails.
- Queue-pair state transition fails.
- Metadata exchange is incomplete or malformed.
- Completion polling times out.
- Received payload does not match the expected message.

## Open Questions

- Should the next iteration add a multi-message loop before moving on to the
  file-transfer project?
- Should completion polling grow an event-channel variant, or should that wait
  until the benchmark project?
- Which RXE setup should become the repository-standard reproducible lab?
