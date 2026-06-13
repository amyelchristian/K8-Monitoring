#!/usr/bin/env bash
# Auto-load environment from .env (no manual `export` needed).
__envdir="$(cd "$(dirname "$0")" && pwd)"; [ -f "$__envdir/.env" ] && { set -a; . "$__envdir/.env"; set +a; }
#
# start_dashboard.sh — launch the eBPF-Swarm dashboard (API + frontend).
#
# Reality vs. the original template:
#   * dashboard_api.py uses Python's stdlib http.server (no fastapi/uvicorn needed)
#     and serves on port 8000 with SSE at /api/events.
#   * The frontend is a Vite/React app; `npm run dev` serves it on 5173 and talks
#     to http://localhost:8000. (Port 5000 is taken by macOS AirPlay Receiver, so
#     we use 8000 — which also matches the requested API port — plus Vite's 5173.)

cd "$(dirname "$0")"
echo "🔥 Starting eBPF-Swarm Dashboard..."

# --- ensure the cluster + victim app are up (so the browser demo is self-contained) ---
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

# --- API backend (stdlib http.server, port 8000) ---
python3 dashboard_api.py &
API_PID=$!
echo "✓ API running at http://localhost:8000  (SSE: /api/events)"

# --- frontend (Vite dev server, port 5173) ---
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
echo "========================================"
echo "🔥 eBPF-Swarm Dashboard is LIVE!"
echo "Open: http://localhost:5173   (API: http://localhost:8000)"
echo "Trigger events: ./trigger_demo.sh   (or click 'Inject Chaos' in the UI)"
echo "Press Ctrl+C to stop"
echo "========================================"

wait
