# RDMA Key-Value Store

## Goal

Build a tiny key-value store that uses RDMA data movement behind a simple client
API.

## Concepts Practiced

- Mapping application operations onto RDMA transfers.
- Request and response protocol design.
- Memory layout for shared data structures.
- Correctness checks under repeated operations.

## Prerequisites

- Complete `01-rdma-pingpong`.
- Complete or review `02-zero-copy-file-transfer`.

## Milestones

1. Define a small text or binary protocol for `put`, `get`, and `delete`.
2. Implement an in-memory single-server store.
3. Move request and response payloads over RDMA.
4. Add client-side verification for repeated operations.
5. Measure latency for simple workloads.

## Verification

Follow `docs/verification.md`. The project should prove that values written by
one operation are returned correctly by later reads.

## Stretch Goals

- Add concurrent clients.
- Add fixed-size value slabs.
- Compare send/receive with RDMA read or write for selected operations.
