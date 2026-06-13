#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/common.sh
source "$SCRIPT_DIR/../lib/common.sh"

SERVER_IP=$(rdma_node_ip node-a)
SERVER_LOG=/tmp/ibv-rc-pingpong-server.log

cleanup() {
  rdma_ssh_shell node-a "pkill -f '[i]bv_rc_pingpong.*-d $RDMA_DEVICE' >/dev/null 2>&1 || true" >/dev/null 2>&1 || true
}

trap cleanup EXIT

for node in node-a node-b; do
  rdma_wait_for_ssh "$node" 120
  rdma_wait_for_cloud_init "$node"
  rdma_ssh_shell "$node" "
    set -euo pipefail
    command -v ibv_rc_pingpong >/dev/null
    sudo /usr/local/sbin/setup-rxe.sh
  "
done

printf 'starting ibv_rc_pingpong server on node-a\n'
rdma_ssh_shell node-a "
  set -euo pipefail
  rm -f '$SERVER_LOG'
  nohup ibv_rc_pingpong -d '$RDMA_DEVICE' -g '$RDMA_GID_INDEX' > '$SERVER_LOG' 2>&1 &
  echo \$! > /tmp/ibv-rc-pingpong.pid
"

sleep 2

printf 'running ibv_rc_pingpong client on node-b\n'
rdma_ssh_shell node-b "ibv_rc_pingpong -d '$RDMA_DEVICE' -g '$RDMA_GID_INDEX' '$SERVER_IP'"

printf '\nibv_rc_pingpong passed. Server log is on node-a:%s\n' "$SERVER_LOG"
