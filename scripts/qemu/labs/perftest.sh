#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/common.sh
source "$SCRIPT_DIR/../lib/common.sh"

SERVER_IP=$(rdma_node_ip node-a)
SERVER_LOG=/tmp/ib-write-bw-server.log

cleanup() {
  rdma_ssh_shell node-a "pkill -f '[i]b_write_bw.*-d $RDMA_DEVICE' >/dev/null 2>&1 || true" >/dev/null 2>&1 || true
}

trap cleanup EXIT

for node in node-a node-b; do
  rdma_wait_for_ssh "$node" 120
  rdma_wait_for_cloud_init "$node"
  rdma_ssh_shell "$node" "
    set -euo pipefail
    command -v ib_write_bw >/dev/null
    sudo /usr/local/sbin/setup-rxe.sh
  "
done

printf 'starting ib_write_bw server on node-a\n'
rdma_ssh_shell node-a "
  set -euo pipefail
  rm -f '$SERVER_LOG'
  nohup ib_write_bw -d '$RDMA_DEVICE' -x '$RDMA_GID_INDEX' -F > '$SERVER_LOG' 2>&1 &
  echo \$! > /tmp/ib-write-bw.pid
"

sleep 2

printf 'running ib_write_bw client on node-b\n'
rdma_ssh_shell node-b "ib_write_bw -d '$RDMA_DEVICE' -x '$RDMA_GID_INDEX' -F '$SERVER_IP'"

printf '\nib_write_bw passed. Treat numbers as software-path smoke data only.\n'
