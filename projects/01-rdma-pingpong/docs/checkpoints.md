# Checkpoints

## 1. Command Skeleton

- Done: client and server commands compile.
- Done: both commands validate required arguments.
- Done: both commands print the selected device, port, and endpoint metadata in
  debug mode.

## 2. Resource Setup

- Done: each peer opens the selected device, or the first available device.
- Done: each peer allocates a protection domain.
- Done: each peer creates separate send and receive completion queues plus one
  RC queue pair.
- Done: cleanup is explicit and ordered in `pp_context_destroy`.

## 3. Memory Registration

- Done: send and receive buffers are allocated.
- Done: buffers are registered with local-write access.
- Done: registration keys are logged in debug mode.

## 4. Connection Bring-Up

- Done: peers exchange queue-pair metadata over a TCP control channel.
- Done: queue pairs transition through INIT, RTR, and RTS.
- Done: the server posts a receive and sends `READY` before the client sends
  data.

## 5. First Round Trip

- Done: server posts a receive before the client sends.
- Done: client sends a request payload.
- Done: server validates the request and sends a response.
- Done: client validates the response.

## 6. Robustness

- Done: completion polling has a timeout.
- Done: unexpected completion status is reported with `ibv_wc_status_str`.
- Done: payload mismatch causes a non-zero exit.
- Done: command-line parse errors return non-zero before RDMA resources are
  opened.
