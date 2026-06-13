#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/common.sh
source "$SCRIPT_DIR/../lib/common.sh"

SERVER_IP=$(rdma_node_ip node-a)

require_guest_command() {
  local node=$1
  local cmd=$2
  rdma_ssh_shell "$node" "command -v '$cmd' >/dev/null"
}

start_rping_server() {
  rdma_ssh_shell node-a "pkill -f '[r]ping -s' >/dev/null 2>&1 || true" >/dev/null 2>&1 || true
  rdma_ssh_shell node-a "
    set -euo pipefail
    rm -f /tmp/rping-server.log
    nohup rping -s -a '$SERVER_IP' -p '$RDMA_RPING_PORT' -v > /tmp/rping-server.log 2>&1 &
    echo \$! > /tmp/rping-server.pid
  "
}

cleanup_rping() {
  rdma_ssh_shell node-a "pkill -f '[r]ping -s' >/dev/null 2>&1 || true" >/dev/null 2>&1 || true
}

trap cleanup_rping EXIT

for node in node-a node-b; do
  printf '\n== %s: RXE device state ==\n' "$node"
  rdma_wait_for_ssh "$node" 120
  rdma_wait_for_cloud_init "$node"
  rdma_ssh_shell "$node" "
    set -euo pipefail
    sudo /usr/local/sbin/setup-rxe.sh
    ip -brief addr show '$RDMA_NETDEV'
    rdma link show
    ibv_devices
    ibv_devinfo -d '$RDMA_DEVICE' | sed -n '1,80p'
  "
done

printf '\n== private network ping ==\n'
rdma_ssh_shell node-a "ping -c 3 '$(rdma_node_ip node-b)'"
rdma_ssh_shell node-b "ping -c 3 '$SERVER_IP'"

printf '\n== RDMA CM rping ==\n'
require_guest_command node-a rping
require_guest_command node-b rping
start_rping_server
sleep 2
rdma_ssh_shell node-b "rping -c -a '$SERVER_IP' -p '$RDMA_RPING_PORT' -C 1 -v"

printf '\nRXE smoke test passed.\n'
