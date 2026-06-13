#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/common.sh
source "$SCRIPT_DIR/../lib/common.sh"

SERVER_IP=$(rdma_node_ip node-a)
PROJECT_DIR="$RDMA_GUEST_REPO_DIR/projects/01-rdma-pingpong/starter"
SERVER_BIN="$PROJECT_DIR/bin/rdma-pingpong-server"
CLIENT_BIN="$PROJECT_DIR/bin/rdma-pingpong-client"
SERVER_LOG=/tmp/project-01-rdma-pingpong-server.log
do_sync=1

usage() {
  cat <<USAGE
Usage: $0 [--no-sync]

Build and run projects/01-rdma-pingpong across node-a and node-b using RXE.
USAGE
}

while (($#)); do
  case "$1" in
    --no-sync)
      do_sync=0
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

cleanup() {
  rdma_ssh_shell node-a "pkill -f '[r]dma-pingpong-server.*--device $RDMA_DEVICE' >/dev/null 2>&1 || true" >/dev/null 2>&1 || true
}

trap cleanup EXIT

for node in node-a node-b; do
  rdma_wait_for_ssh "$node" 120
  rdma_wait_for_cloud_init "$node"
  rdma_ssh_shell "$node" "sudo /usr/local/sbin/setup-rxe.sh"
done

if [[ "$do_sync" -eq 1 ]]; then
  "$RDMA_QEMU_DIR/sync-repo.sh" node-a node-b
fi

for node in node-a node-b; do
  printf 'building project 01 on %s\n' "$node"
  rdma_ssh_shell "$node" "make -C '$PROJECT_DIR'"
done

printf 'starting project server on node-a\n'
rdma_ssh_shell node-a "
  set -euo pipefail
  rm -f '$SERVER_LOG'
  nohup '$SERVER_BIN' \
    --device '$RDMA_DEVICE' \
    --ib-port 1 \
    --gid-index '$RDMA_GID_INDEX' \
    --tcp-port '$RDMA_PROJECT_TCP_PORT' \
    --debug \
    > '$SERVER_LOG' 2>&1 &
  echo \$! > /tmp/project-01-rdma-pingpong.pid
"

sleep 2

printf 'running project client on node-b\n'
rdma_ssh_shell node-b "
  '$CLIENT_BIN' \
    --server '$SERVER_IP' \
    --device '$RDMA_DEVICE' \
    --ib-port 1 \
    --gid-index '$RDMA_GID_INDEX' \
    --tcp-port '$RDMA_PROJECT_TCP_PORT' \
    --debug
"

printf '\nproject 01 ping-pong passed. Server log is on node-a:%s\n' "$SERVER_LOG"
