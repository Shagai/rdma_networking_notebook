# Throughput And Latency Benchmark

## Goal

Build a benchmark tool that measures RDMA message latency and throughput under
controlled workload settings.

## Concepts Practiced

- Benchmark design.
- Completion batching.
- Payload-size and queue-depth tradeoffs.
- Reporting results honestly.

## Prerequisites

- Complete `01-rdma-pingpong`.
- Understand the difference between correctness checks and measurements.

## Milestones

1. Build a benchmark command with explicit workload parameters.
2. Measure single-message round-trip latency.
3. Measure throughput for repeated transfers.
4. Add payload-size and queue-depth sweeps.
5. Export results in a simple machine-readable format.

## Verification

Follow `docs/verification.md`. The benchmark should report the workload
parameters with every result so measurements can be reproduced.

## Stretch Goals

- Add percentile latency reporting.
- Compare polling strategies.
- Plot results from exported data.
