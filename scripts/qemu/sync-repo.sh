#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<USAGE
Usage: $0 [node-a] [node-b]

Copy the current repository contents into the selected guests. Runtime build
artifacts and VM images are excluded.
USAGE
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

nodes=("$@")
if [[ ${#nodes[@]} -eq 0 ]]; then
  nodes=(node-a node-b)
fi

for node in "${nodes[@]}"; do
  rdma_validate_node "$node"
  rdma_wait_for_ssh "$node" 60
  printf 'syncing repository to %s:%s\n' "$node" "$RDMA_GUEST_REPO_DIR"

  case "$RDMA_GUEST_REPO_DIR" in
    /home/"$RDMA_VM_USER"/*) ;;
    *)
      printf 'error: refusing to sync to unexpected guest path: %s\n' "$RDMA_GUEST_REPO_DIR" >&2
      exit 1
      ;;
  esac

  rdma_ssh_shell "$node" "rm -rf '$RDMA_GUEST_REPO_DIR' && mkdir -p '$RDMA_GUEST_REPO_DIR'"
  (
    cd "$RDMA_REPO_ROOT"
    tar \
      --exclude=.git \
      --exclude=node_modules \
      --exclude=dist \
      --exclude=.qemu-rxe-lab \
      -czf - .
  ) | rdma_ssh "$node" tar -xzf - -C "$RDMA_GUEST_REPO_DIR"
done
