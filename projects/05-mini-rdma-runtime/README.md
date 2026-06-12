# Mini RDMA Runtime

## Goal

Extract the repeated setup, connection, memory, queue-pair, completion, and
cleanup logic from earlier projects into a small reusable runtime.

## Concepts Practiced

- API design around low-level resources.
- Resource ownership and cleanup.
- Error modeling.
- Reuse without hiding important RDMA concepts.

## Prerequisites

- Complete at least `01-rdma-pingpong`.
- Review the repeated code and design choices in the earlier projects.

## Milestones

1. Identify repeated resource-management patterns.
2. Design a small runtime API.
3. Move device, memory, queue-pair, and completion helpers behind the API.
4. Port one earlier project to the runtime.
5. Document what the runtime deliberately does not abstract.

## Verification

Follow `docs/verification.md`. The runtime should make a project easier to read
without changing its visible behavior.

## Stretch Goals

- Add tracing hooks.
- Add fake or simulated transport tests.
- Port more than one project to the runtime.
