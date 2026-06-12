# Design

## Problem Statement

This project builds the smallest useful RDMA round trip: a client sends a
message to a server, the server validates the request, and the server sends a
response back.

## Architecture

- Client: creates local RDMA resources, connects to the server, sends the first
  payload, waits for the response, and validates it.
- Server: creates local RDMA resources, waits for the client metadata, posts a
  receive, handles the request, and sends the response.
- Connection exchange: shares the queue-pair and memory details needed to move
  both peers into a usable state.
- Completion loop: polls send and receive completions until the expected work
  requests finish or a timeout occurs.

## Data Flow

1. Both peers allocate resources and register memory.
2. The peers exchange connection metadata over a simple control channel.
3. The server posts a receive buffer.
4. The client posts a send work request.
5. The server polls the receive completion and validates the payload.
6. The server posts a response send.
7. The client polls the receive completion and validates the response.

## Failure Modes

- RDMA device or port is unavailable.
- Memory registration fails.
- Queue-pair state transition fails.
- Metadata exchange is incomplete or malformed.
- Completion polling times out.
- Received payload does not match the expected message.

## Open Questions

- Which control channel should the repository standardize on for metadata
  exchange?
- Should the first version use blocking polling, event notifications, or both?
