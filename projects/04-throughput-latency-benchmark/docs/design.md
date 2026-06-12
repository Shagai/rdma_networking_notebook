# Design

## Problem Statement

Measure RDMA latency and throughput in a way that records enough context for
the result to be useful later.

## Architecture

- Driver: parses workload settings and coordinates benchmark phases.
- Transport: owns RDMA setup and data movement.
- Recorder: captures timing samples and aggregate counters.
- Reporter: prints human-readable output and optional structured output.

## Data Flow

1. Parse benchmark parameters.
2. Warm up the RDMA connection.
3. Run the selected workload.
4. Collect timing and completion data.
5. Print or export the result with environment details.

## Failure Modes

- Unsupported workload parameters.
- Timer resolution is too coarse for the selected workload.
- Completion polling times out.
- Results are reported without enough context.

## Open Questions

- Which clock source should be used?
- What default payload sizes and queue depths are useful for the learning path?
