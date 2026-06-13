#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<USAGE
Usage: $0 <node-a|node-b> [ssh-args...]

Open an SSH session to a lab node through the host port forward.
USAGE
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

node=${1:-}
if [[ -z "$node" ]]; then
  usage >&2
  exit 2
fi
shift

rdma_validate_node "$node"
rdma_ssh "$node" "$@"
