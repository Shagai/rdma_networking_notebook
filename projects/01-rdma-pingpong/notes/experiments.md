# Experiments

## Environment

- Host: local Codex workspace
- Kernel: not recorded
- RDMA device: unavailable in this environment
- Driver: unavailable in this environment
- Command used: `make -C projects/01-rdma-pingpong/starter test`

## Observations

- Observation: protocol tests pass without RDMA hardware.
- Explanation: endpoint serialization, malformed metadata rejection, and payload
  mismatch behavior are pure C checks.
- Follow-up: repeat the run on an RXE or physical RDMA setup to validate QP
  bring-up and the actual SEND/RECV round trip.

## Implementation Notes

- The TCP socket is only a metadata and readiness channel. Payload movement uses
  `IBV_WR_SEND` and posted receive buffers.
- The server sends `READY` only after the QP is RTS and the receive work request
  has been posted.
- The client posts its receive before sending the request, so both sides make
  the receive-before-send rule explicit.
- Separate send and receive completion queues make the first version easier to
  inspect because each wait is tied to one expected work request ID.

## Measurements

| Date | Command | Result | Notes |
| --- | --- | --- | --- |
| 2026-06-12 | `make -C projects/01-rdma-pingpong/starter test` | pass | Protocol/parser tests only. |
| 2026-06-12 | `make -C projects/01-rdma-pingpong/starter` | pass | Client and server compile against libibverbs. |
| 2026-06-12 | `ibv_devices` | fail | Local environment reports `Function not implemented`; hardware/RXE run still needed. |
