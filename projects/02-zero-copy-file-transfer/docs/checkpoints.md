# Checkpoints

## 1. Command Skeleton

- Sender and receiver parse file paths and connection arguments.
- Invalid paths fail before RDMA setup begins.

## 2. Fixed Buffer Transfer

- One in-memory payload transfers correctly.
- Receiver validates the payload before file I/O is introduced.

## 3. File Chunking

- Sender splits the file into explicit chunks.
- Chunk metadata includes offset and length.
- Receiver writes chunks to the expected offsets.

## 4. Validation

- Sender and receiver agree on total bytes.
- Sender and receiver compare checksums.
- Mismatches produce a clear error.

## 5. Measurements

- Record throughput for at least two chunk sizes.
- Record CPU usage or another useful host-side observation.
