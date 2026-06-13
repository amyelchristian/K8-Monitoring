#!/usr/bin/env bash

cd "$(dirname "$0")"
REMOTE=/home/docker/ebpf_monitor.py

echo "Starting eBPF-Swarm Pipeline..."
echo "Phase 2 (Snitch) -> Phase 3 (Brain)"
echo "Trigger events with: curl <URL>/stress or curl <URL>/crash"
echo "Press Ctrl+C to stop"
minikube cp ./ebpf_monitor.py "${REMOTE}" 2>/dev/null
minikube ssh -- "sudo python3 ${REMOTE}" | python3 -u causal_engine.py
