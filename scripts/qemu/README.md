# QEMU RXE Lab

This directory contains a modest two-node QEMU lab for learning and testing
the RDMA projects without physical RDMA devices. Each guest gets a private
virtio Ethernet interface, and cloud-init creates an RXE device named `rxe0`
over that interface.

## Topology

```text
host
  node-a
    mgmt0: QEMU user-mode network, SSH on host 127.0.0.1:2221 as ubuntu
    rdmanet0: 192.168.100.11/24
    rxe0 over rdmanet0

  node-b
    mgmt0: QEMU user-mode network, SSH on host 127.0.0.1:2222 as ubuntu
    rdmanet0: 192.168.100.12/24
    rxe0 over rdmanet0
```

The private VM link uses QEMU's unprivileged socket network backend, so the
baseline does not require host bridge or tap setup.

## Host Prerequisites

Install QEMU, cloud image tooling, and SSH client tools on the host:

Arch Linux:

```sh
sudo pacman -S qemu-system-x86 qemu-img cloud-image-utils openssh
```

Debian or Ubuntu:

```sh
sudo apt-get install qemu-system-x86 qemu-utils cloud-image-utils openssh-client
```

`scripts/qemu/build-image.sh` downloads the Ubuntu Noble cloud image by
default. Override it with `RDMA_QEMU_IMAGE_URL` if you want another compatible
cloud image. Use `scripts/qemu/build-image.sh --refresh-base` when you
explicitly want to replace the cached base image.

## Start The Lab

```sh
scripts/qemu/launch-lab.sh --sync --smoke
```

The first run downloads the base image, creates per-node disks, generates an
SSH key under `.qemu-rxe-lab/`, starts both guests, copies the repo into both
guests, and runs the RXE smoke test.

Use `--rebuild` after changing cloud-init or when you want fresh guest disks:

```sh
scripts/qemu/launch-lab.sh --rebuild --sync --smoke
```

Rebuilding guest disks also clears the cached SSH host keys for the forwarded
ports in `.qemu-rxe-lab/known_hosts`.

Useful commands:

```sh
scripts/qemu/ssh-node.sh node-a
scripts/qemu/ssh-node.sh node-b
scripts/qemu/sync-repo.sh
scripts/qemu/stop-lab.sh
```

Runtime artifacts live under `.qemu-rxe-lab/` and are ignored by Git.

## Lab Checks

Run these from the host after `launch-lab.sh` succeeds:

```sh
scripts/qemu/labs/rxe-smoke.sh
scripts/qemu/labs/verbs-pingpong.sh
scripts/qemu/labs/perftest.sh
scripts/qemu/labs/project-01-pingpong.sh
```

What they prove:

- `rxe-smoke.sh` verifies the private network, RXE device, verbs enumeration,
  and `rping`.
- `verbs-pingpong.sh` runs the stock `ibv_rc_pingpong` utility across RXE.
- `perftest.sh` runs `ib_write_bw` as a functional test. Do not treat the
  software bandwidth numbers as NIC performance.
- `project-01-pingpong.sh` syncs this repo, builds
  `projects/01-rdma-pingpong/starter`, and runs the custom server/client
  across the two guests.

The UCX, libfabric, and SPDK scripts are present as planned entry points but
are intentionally not active in the modest baseline. They need extra packages
and, for SPDK, hugepage and target setup.

## Configuration

Common overrides:

```sh
RDMA_QEMU_STATE_DIR=/path/to/lab-state scripts/qemu/launch-lab.sh
RDMA_QEMU_MEMORY=8192 RDMA_QEMU_CPUS=4 scripts/qemu/launch-lab.sh
RDMA_QEMU_ACCEL=tcg scripts/qemu/launch-lab.sh
RDMA_QEMU_SSH_TIMEOUT=900 scripts/qemu/launch-lab.sh
RDMA_QEMU_NODE_A_SSH_PORT=2321 RDMA_QEMU_NODE_B_SSH_PORT=2322 scripts/qemu/launch-lab.sh
RDMA_DEVICE=rxe0 RDMA_GID_INDEX=0 scripts/qemu/labs/project-01-pingpong.sh
```

Use `RDMA_QEMU_ACCEL=tcg` when `/dev/kvm` is not available. It is slower but
keeps the lab usable on hosts without KVM access.

## Limits

RXE is useful for control-path learning and functional verbs testing. It is not
a substitute for real RoCE/InfiniBand hardware when studying NIC offloads,
fabric congestion, GPUDirect RDMA, NCCL behavior, DOCA, BlueField, or realistic
latency/bandwidth.
