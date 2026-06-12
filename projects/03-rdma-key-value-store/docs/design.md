# Design

## Problem Statement

Expose a small key-value API and use RDMA to move requests and responses between
clients and a server.

## Architecture

- Client: encodes operations, sends them to the server, and validates responses.
- Server: receives operations, updates the in-memory store, and sends results.
- Store: owns key and value memory separately from transport details.
- Protocol: defines operation type, key, value length, status, and errors.

## Data Flow

1. Client encodes a request.
2. Client sends the request through the RDMA transport.
3. Server decodes and applies the operation.
4. Server sends a response.
5. Client validates status and payload.

## Failure Modes

- Unknown operation.
- Key or value is too large.
- Store capacity is exhausted.
- Request payload is malformed.
- Completion polling times out.

## Open Questions

- What maximum key and value sizes should the first version support?
- Should the protocol be text for readability or binary for layout control?
