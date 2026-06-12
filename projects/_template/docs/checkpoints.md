# Checkpoints

Use these checkpoints to keep the project buildable and understandable as it
grows.

## 1. Skeleton

- The project builds.
- The executable starts and prints a clear usage or status message.
- The README explains how to run the current state.

## 2. Connection Setup

- Resources are created in a deliberate order.
- Failures include enough context to debug the missing resource or bad state.
- Cleanup runs even when setup fails partway through.

## 3. First Transfer

- A small payload moves from one side to the other.
- Completion handling is explicit and observable.
- The receiver validates the payload contents.

## 4. Robustness

- Invalid arguments are rejected clearly.
- Timeouts or stalled completions are handled.
- Resource ownership is easy to follow in the code.

## 5. Learning Notes

- The implementation notes capture what was confusing.
- The verification document records the commands that proved the milestone.
- Any performance claims include the measurement command and environment.
