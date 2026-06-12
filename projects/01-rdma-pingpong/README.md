# RDMA Ping-Pong

## Goal

Build a minimal two-process RDMA application where one side sends a small
message and the other side receives it, validates it, and sends a response.

## Concepts Practiced

- Device and protection-domain setup.
- Memory registration.
- Queue pair creation and state transitions.
- Send, receive, completion queue polling, and cleanup.

## Prerequisites

- Basic RDMA vocabulary from the learning path.
- A working RDMA-capable environment or simulator.
- Familiarity with compiling and running small command-line programs.

## Milestones

1. Create a server and client executable that parse their arguments.
2. Open the RDMA device and allocate the required resources.
3. Register memory for the send and receive buffers.
4. Exchange connection metadata between the client and server.
5. Post receive work requests before sends.
6. Send one payload, poll completions, validate the response, and clean up.

## Verification

Follow `docs/verification.md` as the implementation grows. At minimum, the
project should prove that both peers complete one round trip and reject a
corrupted or unexpected payload.

## Stretch Goals

- Send multiple messages in sequence.
- Print completion metadata in a readable debug mode.
- Add a timeout for stalled completions.
