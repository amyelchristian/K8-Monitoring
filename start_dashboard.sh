#!/usr/bin/env bash
__envdir="$(cd "$(dirname "$0")" && pwd)"; [ -f "$__envdir/.env" ] && { set -a; . "$__envdir/.env"; set +a; }

cd "$(dirname "$0")"
echo "🔥 Starting eBPF-Swarm Dashboard..."

if command -v minikube >/dev/null 2>&1; then
  if ! minikube status --format '{{.Host}}' 2>/dev/null | grep -q Running; then
    echo "→ starting minikube…"; minikube start --driver=docker || echo "! minikube start failed (continuing)"
  fi
  if ! kubectl get deployment victim-app >/dev/null 2>&1; then
    echo "→ deploying victim-app…"
    eval "$(minikube docker-env)" 2>/dev/null
    docker build -t victim-app:latest . >/dev/null 2>&1 || echo "! docker build failed (continuing)"
    kubectl apply -f deployment.yaml || echo "! kubectl apply failed (continuing)"
  fi
else
  echo "! minikube not found — dashboard will run, but cluster actions are disabled."
fi

python3 dashboard_api.py &
API_PID=$!
echo "✓ API running at http://localhost:8000  (SSE: /api/events)"

DASH_PID=""
if [ -d "dashboard" ] && [ -f "dashboard/package.json" ]; then
  ( cd dashboard && npm install --silent && npm run dev ) &
  DASH_PID=$!
  echo "✓ Dashboard (Vite) starting at http://localhost:5173"
else
  echo "! dashboard/ not found — API only."
fi

cleanup() {
  echo
  echo "Stopping dashboard..."
  [ -n "$DASH_PID" ] && kill "$DASH_PID" 2>/dev/null
  kill "$API_PID" 2>/dev/null
  pkill -f "dashboard_api.py" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "🔥 eBPF-Swarm Dashboard is LIVE!"
echo "Open: http://localhost:5173   (API: http://localhost:8000)"
echo "Trigger events: ./trigger_demo.sh   (or click 'Inject Chaos' in the UI)"
echo "Press Ctrl+C to stop"

wait
