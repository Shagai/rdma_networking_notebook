# Verification

## Build

```sh
make -C projects/03-rdma-key-value-store/starter
```

Expected result:

- Client and server binaries build successfully.

## Functional Run

```sh
./projects/03-rdma-key-value-store/starter/bin/rdma-kv-server
./projects/03-rdma-key-value-store/starter/bin/rdma-kv-client put hello world
./projects/03-rdma-key-value-store/starter/bin/rdma-kv-client get hello
```

Expected result:

- The `get` command returns `world`.

## Negative Checks

- Getting a missing key returns a clear not-found status.
- Sending an oversized value returns a clear capacity error.
