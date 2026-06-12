# Design

## Problem Statement

Move file contents between two peers using RDMA while keeping buffer ownership,
chunking, and correctness checks explicit.

## Architecture

- Sender: opens the source file, prepares registered transfer buffers, and sends
  chunks.
- Receiver: prepares receive buffers, writes completed chunks to the target
  file, and validates the final result.
- Transfer protocol: communicates file metadata, chunk order, and completion
  status.

## Data Flow

1. Sender sends file metadata.
2. Receiver prepares output state.
3. Sender transfers file chunks through registered buffers.
4. Receiver writes chunks in order.
5. Both peers compare size and checksum.

## Failure Modes

- Source file cannot be opened.
- Destination path cannot be written.
- Chunk metadata is inconsistent.
- Transfer stalls or completion polling times out.
- Final checksum does not match.

## Open Questions

- Should the first version require in-order chunks?
- Which checksum should be used for validation?
