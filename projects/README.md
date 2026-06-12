# Projects

These projects turn the RDMA learning path into practical builds. They are
ordered so each project reuses the concepts and debugging habits from the
previous one.

## Recommended Order

1. `01-rdma-pingpong` - build the first full send/receive application.
2. `02-zero-copy-file-transfer` - move real payloads between hosts.
3. `03-rdma-key-value-store` - use RDMA operations behind an application API.
4. `04-throughput-latency-benchmark` - measure behavior and explain tradeoffs.
5. `05-mini-rdma-runtime` - package reusable connection, memory, and queue-pair
   logic.

## How To Work On A Project

Each project has the same shape:

- `README.md` explains the goal, prerequisites, milestones, and stretch goals.
- `starter/` is the place to implement the project.
- `docs/design.md` captures the intended architecture before implementation.
- `docs/checkpoints.md` breaks the work into reviewable learning steps.
- `docs/verification.md` defines the commands and observations that prove the
  project works.
- `notes/experiments.md` records measurements, debugging notes, and follow-up
  questions.

Start from `starter/`, complete the checkpoints in order, and keep the
verification notes updated as the implementation becomes more complete.

## Project Template

Use `_template/` when adding another project. Copy it into a numbered folder,
rename the project, and fill in the goal, milestones, and verification path
before writing code.
