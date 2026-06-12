# Verification

## Build

```sh
make -C projects/04-throughput-latency-benchmark/starter
```

Expected result:

- The benchmark binary builds successfully.

## Latency Run

```sh
./projects/04-throughput-latency-benchmark/starter/bin/rdma-bench latency --size 64 --iterations 1000
```

Expected result:

- Output includes payload size, iterations, average latency, and environment
  context.

## Throughput Run

```sh
./projects/04-throughput-latency-benchmark/starter/bin/rdma-bench throughput --size 4096 --seconds 10
```

Expected result:

- Output includes total bytes, operations, duration, and throughput.
