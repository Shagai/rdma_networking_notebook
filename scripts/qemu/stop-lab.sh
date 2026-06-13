#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<USAGE
Usage: $0

Stop both QEMU lab guests by using their pidfiles.
USAGE
  exit 0
fi

stop_node() {
  local node=$1
  local pidfile
  pidfile=$(rdma_node_pidfile "$node")

  if [[ ! -f "$pidfile" ]]; then
    printf '%s is not running: no pidfile\n' "$node"
    return
  fi

  local pid
  pid=$(<"$pidfile")
  if ! kill -0 "$pid" >/dev/null 2>&1; then
    printf '%s is not running: stale pid %s\n' "$node" "$pid"
    rm -f "$pidfile"
    return
  fi

  printf 'stopping %s pid %s\n' "$node" "$pid"
  kill "$pid"

  for _ in $(seq 1 30); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      rm -f "$pidfile"
      printf '%s stopped\n' "$node"
      return
    fi
    sleep 1
  done

  printf 'warning: %s did not exit after SIGTERM; pid %s is still running\n' "$node" "$pid" >&2
}

stop_node node-b
stop_node node-a
