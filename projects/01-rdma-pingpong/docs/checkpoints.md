# Checkpoints

## 1. Command Skeleton

- Client and server commands compile.
- Both commands validate required arguments.
- Both commands print the selected device, port, and role.

## 2. Resource Setup

- Each peer opens the selected device.
- Each peer allocates a protection domain.
- Each peer creates completion queues and a queue pair.
- Cleanup is explicit and ordered.

## 3. Memory Registration

- Send and receive buffers are allocated.
- Buffers are registered with the correct access flags.
- Registration details are logged in debug mode.

## 4. Connection Bring-Up

- Peers exchange queue-pair metadata.
- Queue pairs transition through the required states.
- Both peers report a ready state before data movement begins.

## 5. First Round Trip

- Server posts a receive before the client sends.
- Client sends a request payload.
- Server validates the request and sends a response.
- Client validates the response.

## 6. Robustness

- Completion polling has a timeout.
- Unexpected completion status is reported clearly.
- Payload mismatch causes a non-zero exit.
