#!/usr/bin/env bash

set -euo pipefail

RDMA_QEMU_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
RDMA_REPO_ROOT=$(cd "$RDMA_QEMU_DIR/../.." && pwd)

RDMA_STATE_DIR=${RDMA_QEMU_STATE_DIR:-"$RDMA_REPO_ROOT/.qemu-rxe-lab"}
RDMA_IMAGE_URL=${RDMA_QEMU_IMAGE_URL:-"https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img"}
RDMA_BASE_IMAGE=${RDMA_QEMU_BASE_IMAGE:-"$RDMA_STATE_DIR/images/base-ubuntu-noble.qcow2"}
RDMA_DISK_SIZE=${RDMA_QEMU_DISK_SIZE:-"20G"}
RDMA_VM_CPUS=${RDMA_QEMU_CPUS:-"2"}
RDMA_VM_MEMORY=${RDMA_QEMU_MEMORY:-"4096"}
RDMA_VM_USER=${RDMA_QEMU_USER:-"ubuntu"}
RDMA_GUEST_REPO_DIR=${RDMA_QEMU_GUEST_REPO_DIR:-"/home/$RDMA_VM_USER/rdma_network"}
RDMA_SSH_KEY=${RDMA_QEMU_SSH_KEY:-"$RDMA_STATE_DIR/id_ed25519"}
RDMA_KNOWN_HOSTS=${RDMA_QEMU_KNOWN_HOSTS:-"$RDMA_STATE_DIR/known_hosts"}
RDMA_LINK_PORT=${RDMA_QEMU_LINK_PORT:-"40100"}
RDMA_NODE_A_SSH_PORT=${RDMA_QEMU_NODE_A_SSH_PORT:-"2221"}
RDMA_NODE_B_SSH_PORT=${RDMA_QEMU_NODE_B_SSH_PORT:-"2222"}
RDMA_SSH_TIMEOUT=${RDMA_QEMU_SSH_TIMEOUT:-"240"}
RDMA_RPING_PORT=${RDMA_QEMU_RPING_PORT:-"7471"}
RDMA_PROJECT_TCP_PORT=${RDMA_QEMU_PROJECT_TCP_PORT:-"7472"}
RDMA_DEVICE=${RDMA_DEVICE:-"rxe0"}
RDMA_GID_INDEX=${RDMA_GID_INDEX:-"0"}
RDMA_NETDEV=${RDMA_NETDEV:-"rdmanet0"}

rdma_usage_nodes() {
  printf 'node-a or node-b\n'
}

rdma_validate_node() {
  case "${1:-}" in
    node-a|node-b) ;;
    *)
      printf 'error: expected %s' "$(rdma_usage_nodes)" >&2
      exit 2
      ;;
  esac
}

rdma_node_ip() {
  case "$1" in
    node-a) printf '192.168.100.11' ;;
    node-b) printf '192.168.100.12' ;;
    *) rdma_validate_node "$1" ;;
  esac
}

rdma_node_ssh_port() {
  case "$1" in
    node-a) printf '%s' "$RDMA_NODE_A_SSH_PORT" ;;
    node-b) printf '%s' "$RDMA_NODE_B_SSH_PORT" ;;
    *) rdma_validate_node "$1" ;;
  esac
}

rdma_node_mgmt_mac() {
  case "$1" in
    node-a) printf '52:54:00:10:00:11' ;;
    node-b) printf '52:54:00:10:00:12' ;;
    *) rdma_validate_node "$1" ;;
  esac
}

rdma_node_rdma_mac() {
  case "$1" in
    node-a) printf '52:54:00:20:00:11' ;;
    node-b) printf '52:54:00:20:00:12' ;;
    *) rdma_validate_node "$1" ;;
  esac
}

rdma_node_disk() {
  rdma_validate_node "$1"
  printf '%s/images/%s.qcow2' "$RDMA_STATE_DIR" "$1"
}

rdma_node_seed() {
  rdma_validate_node "$1"
  printf '%s/seeds/%s/seed.iso' "$RDMA_STATE_DIR" "$1"
}

rdma_node_pidfile() {
  rdma_validate_node "$1"
  printf '%s/run/%s.pid' "$RDMA_STATE_DIR" "$1"
}

rdma_node_serial_log() {
  rdma_validate_node "$1"
  printf '%s/logs/%s-serial.log' "$RDMA_STATE_DIR" "$1"
}

rdma_node_monitor() {
  rdma_validate_node "$1"
  printf '%s/run/%s-monitor.sock' "$RDMA_STATE_DIR" "$1"
}

rdma_forget_known_host() {
  local node=$1
  local host_key
  rdma_validate_node "$node"
  host_key="[127.0.0.1]:$(rdma_node_ssh_port "$node")"

  if [[ -f "$RDMA_KNOWN_HOSTS" ]] && command -v ssh-keygen >/dev/null 2>&1; then
    ssh-keygen -R "$host_key" -f "$RDMA_KNOWN_HOSTS" >/dev/null 2>&1 || true
    printf 'cleared cached SSH host key for %s (%s)\n' "$node" "$host_key"
  fi
}

rdma_require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'error: missing required command: %s\n' "$1" >&2
    return 1
  fi
}

rdma_ssh() {
  local node=$1
  shift
  rdma_validate_node "$node"
  ssh \
    -F /dev/null \
    -i "$RDMA_SSH_KEY" \
    -p "$(rdma_node_ssh_port "$node")" \
    -o BatchMode=yes \
    -o ConnectTimeout=5 \
    -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile="$RDMA_KNOWN_HOSTS" \
    "$RDMA_VM_USER@127.0.0.1" \
    "$@"
}

rdma_ssh_shell() {
  local node=$1
  local command
  shift
  command="$*"
  rdma_ssh "$node" "bash -lc $(printf '%q' "$command")"
}

rdma_wait_for_ssh() {
  local node=$1
  local timeout=${2:-180}
  local start
  local now
  local last_notice=0
  local ssh_error=""
  start=$(date +%s)

  while true; do
    if ssh_error=$(rdma_ssh "$node" true 2>&1); then
      return 0
    fi

    now=$(date +%s)
    if (( now - start >= timeout )); then
      printf 'error: timed out waiting for SSH on %s\n' "$node" >&2
      if [[ -n "$ssh_error" ]]; then
        printf 'last SSH error: %s\n' "$ssh_error" >&2
      fi
      return 1
    fi

    if (( now - last_notice >= 30 )); then
      printf 'still waiting for SSH on %s...\n' "$node" >&2
      if [[ -n "$ssh_error" ]]; then
        printf 'last SSH error: %s\n' "$ssh_error" >&2
      fi
      last_notice=$now
    fi

    sleep 3
  done
}

rdma_wait_for_tcp() {
  local host=$1
  local port=$2
  local timeout=${3:-30}
  local start
  start=$(date +%s)

  while true; do
    if timeout 1 bash -c ":</dev/tcp/$host/$port" >/dev/null 2>&1; then
      return 0
    fi

    if (( $(date +%s) - start >= timeout )); then
      printf 'error: timed out waiting for %s:%s\n' "$host" "$port" >&2
      return 1
    fi

    sleep 1
  done
}

rdma_wait_for_cloud_init() {
  local node=$1
  rdma_validate_node "$node"
  rdma_ssh_shell "$node" "if command -v cloud-init >/dev/null 2>&1; then sudo cloud-init status --wait >/dev/null || sudo cloud-init status --long || true; fi"
}

rdma_prepare_state_dirs() {
  mkdir -p \
    "$RDMA_STATE_DIR/images" \
    "$RDMA_STATE_DIR/logs" \
    "$RDMA_STATE_DIR/run" \
    "$RDMA_STATE_DIR/seeds"
}

rdma_print_node_access() {
  local node=$1
  rdma_validate_node "$node"
  printf '%s SSH: %s/ssh-node.sh %s\n' "$node" "$RDMA_QEMU_DIR" "$node"
}
