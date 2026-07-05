#!/usr/bin/env bash
set -euo pipefail

echo "==> Alpha Freight Oracle VM setup"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash setup-vm.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing packages"
apt-get update
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker"
  curl -fsSL https://get.docker.io | sh
  systemctl enable docker
  systemctl start docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin missing — install Docker CE with compose plugin."
  exit 1
fi

echo "==> Firewall (allow SSH + AI backend port 3003)"
ufw allow OpenSSH || true
ufw allow 3003/tcp || true
ufw --force enable || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit .env and add Supabase + Tavily keys:"
  echo "  nano ${SCRIPT_DIR}/.env"
  echo ""
fi

echo "==> Building and starting containers (first run can take 10+ minutes)"
docker compose pull ollama
docker compose up -d --build

echo "==> Waiting for Ollama..."
sleep 20

echo "==> Pulling Ollama model (llama3.1) — this may take several minutes"
docker exec alpha-ollama ollama pull llama3.1

echo ""
echo "==> Done!"
PUBLIC_IP="$(curl -fsS ifconfig.me || true)"
echo "Health check: http://${PUBLIC_IP:-YOUR_VM_IP}:3003/api/health"
echo "Next: open Oracle ingress rule for TCP 3003 if health check fails from phone."
