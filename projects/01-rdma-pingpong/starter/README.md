# Starter

This directory contains a minimal reliable-connected (RC) send/receive
ping-pong implemented with `libibverbs`. The TCP socket is only a control plane:
it exchanges queue-pair metadata and a `READY` marker. The data payload moves
through RDMA SEND/RECV work requests.

Layout:

```text
starter/
  README.md
  src/                  client, server, verbs setup, TCP control channel
  include/              shared protocol definitions
  tests/                protocol/parser tests that do not require RDMA hardware
  Makefile
```

Build the binaries:

```sh
make -C projects/01-rdma-pingpong/starter
```

Run the parser/payload tests:

```sh
make -C projects/01-rdma-pingpong/starter test
```

Run one exchange on two RDMA-capable hosts or two RXE peers:

```sh
# Server
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-server --device <device> --ib-port 1 --tcp-port 7471 --debug

# Client
./projects/01-rdma-pingpong/starter/bin/rdma-pingpong-client --server <server-ip> --device <device> --ib-port 1 --tcp-port 7471 --debug
```

For RoCE, pass the correct `--gid-index`. If the selected port reports
Ethernet/RoCE and no GID index is provided, the program defaults to GID index
`0`.
