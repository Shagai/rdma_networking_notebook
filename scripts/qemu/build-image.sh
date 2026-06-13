#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

force=0
refresh_base=0

usage() {
  cat <<USAGE
Usage: $0 [--force] [--refresh-base]

Download the base cloud image, create node disks, and generate cloud-init seed
ISOs for the two-node RXE lab.

Environment overrides:
  RDMA_QEMU_IMAGE_URL      Base cloud image URL.
  RDMA_QEMU_STATE_DIR      Runtime artifact directory. Default: .qemu-rxe-lab
  RDMA_QEMU_DISK_SIZE      Per-node disk size. Default: 20G
USAGE
}

while (($#)); do
  case "$1" in
    --force)
      force=1
      shift
      ;;
    --refresh-base)
      refresh_base=1
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

download_base_image() {
  if [[ -f "$RDMA_BASE_IMAGE" && "$refresh_base" -eq 0 ]]; then
    printf 'base image exists: %s\n' "$RDMA_BASE_IMAGE"
    return
  fi

  rdma_require qemu-img
  mkdir -p "$(dirname "$RDMA_BASE_IMAGE")"
  local tmp="$RDMA_BASE_IMAGE.tmp"

  printf 'downloading %s\n' "$RDMA_IMAGE_URL"
  if command -v curl >/dev/null 2>&1; then
    curl -fL "$RDMA_IMAGE_URL" -o "$tmp"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$tmp" "$RDMA_IMAGE_URL"
  else
    printf 'error: install curl or wget to download the cloud image\n' >&2
    exit 1
  fi

  mv "$tmp" "$RDMA_BASE_IMAGE"
}

ensure_ssh_key() {
  if [[ -f "$RDMA_SSH_KEY" ]]; then
    return
  fi

  rdma_require ssh-keygen
  mkdir -p "$(dirname "$RDMA_SSH_KEY")"
  ssh-keygen -t ed25519 -N "" -C "rdma-qemu-lab" -f "$RDMA_SSH_KEY"
}

create_seed_iso() {
  local node=$1
  local seed_dir="$RDMA_STATE_DIR/seeds/$node"
  local user_data="$seed_dir/user-data"
  local meta_data="$seed_dir/meta-data"
  local network_config="$seed_dir/network-config"
  local seed_iso
  local pubkey

  seed_iso=$(rdma_node_seed "$node")
  pubkey=$(<"$RDMA_SSH_KEY.pub")

  mkdir -p "$seed_dir"

  sed \
    -e "s|__SSH_AUTHORIZED_KEY__|$pubkey|g" \
    "$RDMA_QEMU_DIR/cloud-init/common.yaml" > "$user_data"

  cat > "$meta_data" <<EOF
instance-id: rdma-rxe-lab-$node
local-hostname: $node
EOF

  sed \
    -e "s|__MGMT_MAC__|$(rdma_node_mgmt_mac "$node")|g" \
    -e "s|__RDMA_MAC__|$(rdma_node_rdma_mac "$node")|g" \
    -e "s|__LAB_IP__|$(rdma_node_ip "$node")|g" \
    "$RDMA_QEMU_DIR/cloud-init/network-config.yaml.tmpl" > "$network_config"

  rm -f "$seed_iso"
  if command -v cloud-localds >/dev/null 2>&1; then
    cloud-localds -N "$network_config" "$seed_iso" "$user_data" "$meta_data"
  elif command -v genisoimage >/dev/null 2>&1; then
    genisoimage -quiet -output "$seed_iso" -volid cidata -joliet -rock \
      "$user_data" "$meta_data" "$network_config"
  elif command -v mkisofs >/dev/null 2>&1; then
    mkisofs -quiet -output "$seed_iso" -volid cidata -joliet -rock \
      "$user_data" "$meta_data" "$network_config"
  else
    printf 'error: install cloud-image-utils, genisoimage, or mkisofs to build seed ISOs\n' >&2
    exit 1
  fi

  printf 'generated seed ISO: %s\n' "$seed_iso"
}

create_node_disk() {
  local node=$1
  local disk
  disk=$(rdma_node_disk "$node")

  if [[ -f "$disk" && "$force" -eq 0 ]]; then
    printf '%s disk exists: %s\n' "$node" "$disk"
    return
  fi

  rm -f "$disk"
  qemu-img create -f qcow2 -F qcow2 -b "$RDMA_BASE_IMAGE" "$disk" "$RDMA_DISK_SIZE"
  printf 'created %s disk: %s\n' "$node" "$disk"
  rdma_forget_known_host "$node"
}

main() {
  rdma_prepare_state_dirs
  rdma_require qemu-img
  download_base_image
  ensure_ssh_key

  for node in node-a node-b; do
    create_node_disk "$node"
    create_seed_iso "$node"
  done

  printf '\nArtifacts are ready under %s\n' "$RDMA_STATE_DIR"
}

main "$@"
