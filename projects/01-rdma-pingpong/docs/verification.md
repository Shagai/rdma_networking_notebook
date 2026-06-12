# Verification

Update the commands below once the starter implementation exists.

## Build

```sh
make -C projects/01-rdma-pingpong/starter
```

Expected result:

- The client and server binaries build successfully.

## Run Server

```sh
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-server --device <device> --port <port>
```

Expected result:

- The server prints that it is listening or waiting for client metadata.

## Run Client

```sh
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-client --device <device> --port <port> --server <addr>
```

Expected result:

- The client completes one request/response exchange.
- Both peers report successful send and receive completions.
- The client validates the response payload.

## Negative Check

Run with an invalid device or port.

Expected result:

- The command exits non-zero.
- The error identifies the invalid resource.
