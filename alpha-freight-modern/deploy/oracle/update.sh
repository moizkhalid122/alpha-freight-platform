#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

git pull origin main || true
docker compose up -d --build

echo "==> Waiting for services..."
sleep 15
docker exec alpha-ollama ollama pull llama3.1 || true

PUBLIC_IP="$(curl -fsS ifconfig.me || true)"
echo "Updated. Health: http://${PUBLIC_IP:-YOUR_VM_IP}:3003/api/health"
