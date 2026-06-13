#!/usr/bin/env bash
# run_pipeline_only.sh — the live eBPF snitch → causal brain → swarm pipeline,
# WITHOUT relaunching the dashboard (unlike run_full_demo.sh). Started/stopped from
# the browser via POST /api/pipeline/start and /api/pipeline/stop.
#
# Auto-load environment from .env (no manual `export` needed).
__envdir="$(cd "$(dirname "$0")" && pwd)"; [ -f "$__envdir/.env" ] && { set -a; . "$__envdir/.env"; set +a; }

cd "$(dirname "$0")"
REMOTE=/home/docker/ebpf_monitor.py

echo "[pipeline] copying snitch + config into the node…"
minikube cp ./ebpf_monitor.py "${REMOTE}" 2>/dev/null
minikube cp ./config.json /home/docker/config.json 2>/dev/null

echo "[pipeline] starting snitch → brain → swarm…"
( minikube ssh -- "sudo python3 ${REMOTE}" | python3 -u causal_engine.py ) &
PIPE_PID=$!
trap 'kill "$PIPE_PID" 2>/dev/null; minikube ssh -- "sudo pkill -f ebpf_monitor.py" 2>/dev/null' EXIT TERM INT

python3 swarm.py
