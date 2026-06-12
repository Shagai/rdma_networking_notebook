# Verification

## Build

```sh
make -C projects/05-mini-rdma-runtime/starter
```

Expected result:

- The runtime and its example build successfully.

## Runtime Example

```sh
./projects/05-mini-rdma-runtime/starter/bin/runtime-example
```

Expected result:

- The example runs the same visible workflow as the project it was extracted
  from.

## Ported Project Check

Run the verification path for the project that was ported to the runtime.

Expected result:

- The original project behavior is unchanged.
- The code has less repeated setup and cleanup logic.
