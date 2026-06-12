# Checkpoints

## 1. Protocol

- Request and response formats are documented.
- Invalid messages are rejected by parser tests.

## 2. Local Store

- `put`, `get`, and `delete` work without RDMA.
- Store capacity limits are tested.

## 3. RDMA Transport

- Client sends one request to the server.
- Server sends one response to the client.
- Completion handling reports operation context.

## 4. Workload Verification

- A script or test runs repeated `put` and `get` operations.
- Missing keys and deleted keys return the expected status.

## 5. Measurements

- Record latency for a small fixed workload.
- Explain the bottleneck observed in the first version.
