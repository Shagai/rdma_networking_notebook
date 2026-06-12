# Verification

## Build

```sh
make -C projects/02-zero-copy-file-transfer/starter
```

Expected result:

- Sender and receiver binaries build successfully.

## Transfer

```sh
./projects/02-zero-copy-file-transfer/starter/bin/rdma-file-recv --output /tmp/received.bin
./projects/02-zero-copy-file-transfer/starter/bin/rdma-file-send --input ./sample.bin --server <addr>
```

Expected result:

- The receiver writes the complete file.
- Sender and receiver report matching byte counts.

## Compare

```sh
cmp ./sample.bin /tmp/received.bin
```

Expected result:

- `cmp` exits successfully with no differences.
