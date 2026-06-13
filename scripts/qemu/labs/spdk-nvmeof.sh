#!/usr/bin/env bash

set -euo pipefail

cat <<'INFO'
SPDK NVMe-oF is intentionally not part of the modest baseline yet.

The next layer should add hugepage setup, SPDK installation/build steps, one
target node, one initiator node, and cleanup for the target subsystem. This
placeholder exists so the lab tree already has the planned entry point.
INFO

exit 2
