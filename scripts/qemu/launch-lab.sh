#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

do_build=1
do_rebuild=0
do_wait=1
do_sync=0
do_smoke=0

usage() {
  cat <<USAGE
Usage: $0 [--no-build] [--rebuild] [--no-wait] [--sync] [--smoke]

Start node-a and node-b with a private virtual Ethernet link. By default this
also builds missing images and waits for SSH.

Options:
  --no-build   Do not run build-image.sh before launch.
  --rebuild    Recreate node disks and cloud-init seed ISOs before launch.
  --no-wait    Do not wait for SSH readiness.
  --sync       Copy the current repo into both guests after SSH is ready.
  --smoke      Run labs/rxe-smoke.sh after SSH is ready.
USAGE
}

while (($#)); do
  case "$1" in
    --no-build)
      do_build=0
      shift
      ;;
    --rebuild)
      do_rebuild=1
      shift
      ;;
    --no-wait)
      do_wait=0
      shift
      ;;
    --sync)
      do_sync=1
      shift
      ;;
    --smoke)
      do_smoke=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'error: unknown option: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$do_build" -eq 1 ]]; then
  build_args=()
  if [[ "$do_rebuild" -eq 1 ]]; then
    build_args=(--force)
  fi
  "$SCRIPT_DIR/build-image.sh" "${build_args[@]}"
fi

"$SCRIPT_DIR/launch-node.sh" node-a
# Avoid probing the private socket backend: a TCP probe can consume the single
# connection that node-b needs. Give node-a a moment to open its listener.
sleep "${RDMA_QEMU_LINK_START_DELAY:-2}"
"$SCRIPT_DIR/launch-node.sh" node-b

if [[ "$do_wait" -eq 1 ]]; then
  printf 'waiting for SSH on both nodes...\n'
  rdma_wait_for_ssh node-a "$RDMA_SSH_TIMEOUT"
  rdma_wait_for_ssh node-b "$RDMA_SSH_TIMEOUT"
  printf 'both nodes accept SSH\n'
fi

if [[ "$do_sync" -eq 1 ]]; then
  "$SCRIPT_DIR/sync-repo.sh" node-a node-b
fi

if [[ "$do_smoke" -eq 1 ]]; then
  "$SCRIPT_DIR/labs/rxe-smoke.sh"
fi

printf '\nLab is running.\n'
rdma_print_node_access node-a
rdma_print_node_access node-b
