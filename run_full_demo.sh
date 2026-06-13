#!/usr/bin/env bash
__envdir="$(cd "$(dirname "$0")" && pwd)"; [ -f "$__envdir/.env" ] && { set -a; . "$__envdir/.env"; set +a; }

cd "$(dirname "$0")"
REMOTE=/home/docker/ebpf_monitor.py

if [ -f ./start_dashboard.sh ]; then
  echo "Starting dashboard (UI http://localhost:5173, API http://localhost:8000)"
  ./start_dashboard.sh &
  sleep 3
  echo "Open http://localhost:5173 in your browser!"
fi

echo "🔥 eBPF-Swarm PROACTIVE Full Demo Starting..."
echo "Phase 2 (Snitch) → Phase 3 (Brain) → Phase 4 (Swarm)"
echo "Known patterns (cpu_spike/memory_leak) take the ⚡ FAST PATH (no LLM)."
echo "Open 3 terminals:"
echo "  Window 1: kubectl get pods -w"
echo "  Window 2: this script"
echo "  Window 3: ./trigger_demo.sh   (fires /stress to show proactive healing)"

if [ -z "${NVIDIA_API_KEY:-}" ]; then
  echo "NOTE: NVIDIA_API_KEY not set — LLM path disabled; proactive fast path still works."
fi

minikube cp ./ebpf_monitor.py "${REMOTE}" 2>/dev/null
( minikube ssh -- "sudo python3 ${REMOTE}" | python3 -u causal_engine.py ) &
PIPE_PID=$!
trap 'kill "$PIPE_PID" 2>/dev/null; minikube ssh -- "sudo pkill -f ebpf_monitor.py" 2>/dev/null' EXIT
python3 swarm.py
