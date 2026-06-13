#!/usr/bin/env bash
__envdir="$(cd "$(dirname "$0")" && pwd)"; [ -f "$__envdir/.env" ] && { set -a; . "$__envdir/.env"; set +a; }

cd "$(dirname "$0")"

echo "PROACTIVE HEALING DEMO"
echo "Triggering CPU stress..."
echo "Watch the pod get restarted BEFORE it crashes!"
echo "CPU threshold: 60% = auto-restart"
POD_IP=$(kubectl get pod -l app=victim-app -o jsonpath='{.items[0].status.podIP}')
minikube ssh -- "curl -s http://${POD_IP}:8000/stress"
echo
echo "Stress triggered! Watch Terminal 1 for fast-path healing..."
