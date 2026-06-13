#!/usr/bin/env bash

set -euo pipefail

cat <<'INFO'
UCX is intentionally not part of the modest baseline yet.

The two-node QEMU/RXE harness is ready for it, but the base image currently
installs only the core verbs/RDMA CM/perftest packages needed for the first
lab pass. Add ucx-utils in cloud-init, then use this file as the UCX smoke-test
entry point.
INFO

exit 2
