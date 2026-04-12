#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-local}"
if [[ "$MODE" == "--help" || "$MODE" == "-h" ]]; then
  cat <<'USAGE'
Micro Drills Linux launcher

Usage:
  ./run-linux.sh          # local mode, listen on 127.0.0.1:19081
  ./run-linux.sh --lan    # LAN mode, listen on 0.0.0.0:19081

Environment overrides:
  MICRO_DRILLS_HOST=0.0.0.0
  MICRO_DRILLS_PORT=19081
  MICRO_DRILLS_PYTHON=/path/to/python3
  MICRO_DRILLS_GCC=/path/to/gcc
  MICRO_DRILLS_GDB=/path/to/gdb
USAGE
  exit 0
fi

if [[ "$MODE" == "--lan" || "$MODE" == "lan" ]]; then
  export MICRO_DRILLS_HOST="${MICRO_DRILLS_HOST:-0.0.0.0}"
else
  export MICRO_DRILLS_HOST="${MICRO_DRILLS_HOST:-127.0.0.1}"
fi
export MICRO_DRILLS_PORT="${MICRO_DRILLS_PORT:-19081}"
export MICRO_DRILLS_NO_BROWSER=1

find_cmd() {
  local env_value="$1"
  shift
  if [[ -n "$env_value" && -x "$env_value" ]]; then
    printf '%s\n' "$env_value"
    return 0
  fi
  local candidate
  for candidate in "$@"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

if [[ -z "${MICRO_DRILLS_PYTHON:-}" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    export MICRO_DRILLS_PYTHON="$(command -v python3)"
  elif command -v python >/dev/null 2>&1; then
    export MICRO_DRILLS_PYTHON="$(command -v python)"
  elif [[ -x "./toolchain/python/bin/python3" ]]; then
    export MICRO_DRILLS_PYTHON="$(pwd)/toolchain/python/bin/python3"
  else
    echo "[Micro Drills] python3 not found. Linux judge/debug server cannot start." >&2
    echo "[Micro Drills] Install python3, or set MICRO_DRILLS_PYTHON=/path/to/python3." >&2
    exit 1
  fi
fi

if [[ -z "${MICRO_DRILLS_GCC:-}" ]]; then
  if command -v gcc >/dev/null 2>&1; then
    export MICRO_DRILLS_GCC="$(command -v gcc)"
  elif [[ -x "./toolchain/bin/gcc" ]]; then
    export MICRO_DRILLS_GCC="$(pwd)/toolchain/bin/gcc"
  fi
fi

if [[ -z "${MICRO_DRILLS_GDB:-}" ]]; then
  if command -v gdb >/dev/null 2>&1; then
    export MICRO_DRILLS_GDB="$(command -v gdb)"
  elif [[ -x "./toolchain/bin/gdb" ]]; then
    export MICRO_DRILLS_GDB="$(pwd)/toolchain/bin/gdb"
  fi
fi

echo "[Micro Drills] python: $MICRO_DRILLS_PYTHON"
if [[ -n "${MICRO_DRILLS_GCC:-}" ]]; then
  echo "[Micro Drills] gcc: $MICRO_DRILLS_GCC"
else
  echo "[Micro Drills] gcc not found. One-click judge will be unavailable."
fi
if [[ -n "${MICRO_DRILLS_GDB:-}" ]]; then
  echo "[Micro Drills] gdb: $MICRO_DRILLS_GDB"
else
  echo "[Micro Drills] gdb not found. Step debug will be unavailable."
fi

echo "[Micro Drills] listening: http://${MICRO_DRILLS_HOST}:${MICRO_DRILLS_PORT}/index.html?editor2"
if [[ "$MICRO_DRILLS_HOST" == "0.0.0.0" ]]; then
  echo "[Micro Drills] LAN mode. Open: http://<linux-server-ip>:${MICRO_DRILLS_PORT}/index.html?editor2"
  echo "[Micro Drills] Warning: this service compiles/runs C code. Use only on trusted intranet."
fi

exec "$MICRO_DRILLS_PYTHON" debug_server.py
