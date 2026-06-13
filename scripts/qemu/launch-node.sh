#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<USAGE
Usage: $0 <node-a|node-b>

Start one QEMU guest. Start node-a before node-b so the private socket network
has a listener.
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

if [[ $# -gt 1 ]]; then
  printf 'error: too many arguments\n' >&2
  usage >&2
  exit 2
fi

rdma_validate_node "$node"
rdma_require qemu-system-x86_64

disk=$(rdma_node_disk "$node")
seed=$(rdma_node_seed "$node")
pidfile=$(rdma_node_pidfile "$node")
serial_log=$(rdma_node_serial_log "$node")
monitor=$(rdma_node_monitor "$node")

if [[ ! -f "$disk" || ! -f "$seed" ]]; then
  printf 'error: missing disk or seed for %s; run scripts/qemu/build-image.sh first\n' "$node" >&2
  exit 1
fi

if [[ -f "$pidfile" ]] && kill -0 "$(<"$pidfile")" >/dev/null 2>&1; then
  printf '%s is already running with pid %s\n' "$node" "$(<"$pidfile")"
  exit 0
fi

mkdir -p "$(dirname "$pidfile")" "$(dirname "$serial_log")"
rm -f "$monitor"

accel_args=()
cpu_model=host
case "${RDMA_QEMU_ACCEL:-auto}" in
  auto)
    if [[ -r /dev/kvm && -w /dev/kvm ]]; then
      accel_args=(-enable-kvm)
    else
      accel_args=(-accel tcg)
      cpu_model=max
    fi
    ;;
  kvm)
    accel_args=(-enable-kvm)
    ;;
  tcg)
    accel_args=(-accel tcg)
    cpu_model=max
    ;;
  *)
    printf 'error: RDMA_QEMU_ACCEL must be auto, kvm, or tcg\n' >&2
    exit 2
    ;;
esac

if [[ "$node" == "node-a" ]]; then
  rdma_netdev=(socket,id=rdma,listen=127.0.0.1:"$RDMA_LINK_PORT")
else
  rdma_netdev=(socket,id=rdma,connect=127.0.0.1:"$RDMA_LINK_PORT")
fi

qemu-system-x86_64 \
  "${accel_args[@]}" \
  -name "rdma-$node" \
  -machine q35 \
  -cpu "$cpu_model" \
  -smp "$RDMA_VM_CPUS" \
  -m "$RDMA_VM_MEMORY" \
  -drive "if=virtio,file=$disk,format=qcow2" \
  -drive "if=virtio,media=cdrom,file=$seed,format=raw,readonly=on" \
  -netdev "user,id=mgmt,hostfwd=tcp:127.0.0.1:$(rdma_node_ssh_port "$node")-:22" \
  -device "virtio-net-pci,netdev=mgmt,mac=$(rdma_node_mgmt_mac "$node")" \
  -netdev "${rdma_netdev[*]}" \
  -device "virtio-net-pci,netdev=rdma,mac=$(rdma_node_rdma_mac "$node")" \
  -display none \
  -serial "file:$serial_log" \
  -monitor "unix:$monitor,server,nowait" \
  -pidfile "$pidfile" \
  -daemonize

printf 'started %s with pid %s\n' "$node" "$(<"$pidfile")"
rdma_print_node_access "$node"
