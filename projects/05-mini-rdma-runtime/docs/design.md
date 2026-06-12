# Design

## Problem Statement

Create a small reusable layer for the repetitive RDMA setup and teardown work
while keeping the underlying concepts visible to learners.

## Architecture

- Context: owns device, port, and protection-domain setup.
- RegisteredBuffer: owns memory allocation and registration.
- QueuePair: owns queue-pair creation and state transitions.
- CompletionPoller: owns completion polling and timeout behavior.
- Connection: coordinates metadata exchange and ready-state validation.

## Data Flow

1. Application creates a runtime context.
2. Application allocates registered buffers.
3. Application creates and connects queue pairs.
4. Application posts operations through explicit runtime calls.
5. Application polls completions and handles results.

## Failure Modes

- Runtime API hides too much and makes learning harder.
- Resource cleanup order is unclear.
- Error messages lose the original low-level context.
- Ported projects change behavior unexpectedly.

## Open Questions

- Which abstractions make the previous projects easier to understand?
- Which details should remain explicit in project code?
