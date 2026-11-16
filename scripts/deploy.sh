#!/usr/bin/env bash
# Đưa bản mới nhất của branch main (trên GitHub) lên VPS.
#   Dùng: scripts/deploy.sh <ssh-host> [thư-mục-trên-VPS]
#   ssh-host là tên trong ~/.ssh/config hoặc user@ip. Thư mục mặc định: huy-abo
# Có thể đặt sẵn DEPLOY_HOST / DEPLOY_DIR thay cho tham số.
set -euo pipefail

HOST="${1:-${DEPLOY_HOST:-}}"
DIR="${2:-${DEPLOY_DIR:-huy-abo}}"
if [ -z "$HOST" ]; then
  echo "Dùng: scripts/deploy.sh <ssh-host> [thư-mục-trên-VPS]" >&2
  exit 1
fi

# VPS kéo code từ GitHub, nên mọi thay đổi phải được push lên main trước
git fetch -q origin main
if [ -n "$(git status --porcelain)" ] || [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "Cảnh báo: máy này có thay đổi chưa push lên origin/main. VPS sẽ chỉ nhận bản đang có trên GitHub." >&2
fi

echo "Deploy $(git rev-parse --short origin/main) lên $HOST:$DIR ..."
ssh "$HOST" "set -e; cd '$DIR'; git pull --ff-only; docker compose up -d --build; sleep 5; docker compose ps"
