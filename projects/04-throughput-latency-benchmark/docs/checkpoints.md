# Checkpoints

## 1. Command Skeleton

- Workload parameters are explicit.
- The command prints the final configuration before running.

## 2. Latency Mode

- One round-trip path is measured.
- Warm-up iterations are separated from measured iterations.
- Average latency is reported.

## 3. Throughput Mode

- Repeated transfer mode runs for a fixed duration or operation count.
- Total operations and bytes are reported.

## 4. Parameter Sweeps

- Payload size can vary.
- Queue depth can vary.
- Each result records its parameters.

## 5. Export

- Results can be written as CSV or JSON.
- Exported records include enough environment context to compare runs.
