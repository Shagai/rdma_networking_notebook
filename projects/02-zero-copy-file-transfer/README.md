# Zero-Copy File Transfer

## Goal

Build a file-transfer tool that uses RDMA to move file contents from one host to
another while minimizing unnecessary copies in the application.

## Concepts Practiced

- Buffer ownership and memory registration strategy.
- Chunking large payloads.
- Flow control between sender and receiver.
- Correctness checks for transferred data.

## Prerequisites

- Complete `01-rdma-pingpong`.
- Understand how queue pairs, memory regions, and completions interact.

## Milestones

1. Build command skeletons for sender and receiver.
2. Transfer one fixed-size in-memory buffer.
3. Read a file into registered buffers and transfer it in chunks.
4. Reconstruct the file on the receiver.
5. Validate file size and checksum.

## Verification

Follow `docs/verification.md`. The project should prove that the received file
matches the source file byte-for-byte.

## Stretch Goals

- Add progress reporting.
- Compare different chunk sizes.
- Add resume support for interrupted transfers.
