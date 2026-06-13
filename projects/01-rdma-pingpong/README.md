# RDMA Ping-Pong

## Goal

Build a minimal two-process RDMA application where one side sends a small
message and the other side receives it, validates it, and sends a response.

## Status

Implemented in `starter/` as a small reliable-connected verbs program:

- `rdma-pingpong-server` creates the server queue pair, waits for TCP metadata,
  posts a receive, validates `rdma-ping`, and sends `rdma-pong`.
- `rdma-pingpong-client` connects to the server control socket, exchanges queue
  pair metadata, sends `rdma-ping`, and validates `rdma-pong`.
- A parser and payload validation test can run on hosts without RDMA hardware.

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

1. Done: create server and client executables that parse their arguments.
2. Done: open the RDMA device and allocate the required resources.
3. Done: register memory for the send and receive buffers.
4. Done: exchange connection metadata over a TCP control channel.
5. Done: post receive work requests before sends.
6. Done: send one payload, poll completions, validate the response, and clean up.

## Verification

Follow `docs/verification.md` as the implementation grows. At minimum, the
project should prove that both peers complete one round trip and reject a
corrupted or unexpected payload.

Local verification without RDMA hardware:

```sh
make -C projects/01-rdma-pingpong/starter test
make -C projects/01-rdma-pingpong/starter
```

Hardware or RXE verification requires two peers with active verbs devices. See
`docs/verification.md` for the exact server/client commands.

The repository QEMU/RXE lab can provide those two peers on a machine without
physical RDMA devices:

```sh
scripts/qemu/launch-lab.sh --sync --smoke
scripts/qemu/labs/project-01-pingpong.sh
```

## Stretch Goals

- Send multiple messages in sequence.
- Print completion metadata in a readable debug mode.
- Add a timeout for stalled completions.
