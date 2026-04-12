#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/portable"
exec bash ./run-linux.sh "$@"
