#!/usr/bin/env bash

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE=/home/docker/ebpf_monitor.py
LOG="${SCRIPT_DIR}/ebpf_output.log"
APP=victim-app

CPU_RESULT=FAIL
CRASH_RESULT=FAIL

green(){ printf "\033[32m%s\033[0m\n" "$1"; }
red(){ printf "\033[31m%s\033[0m\n" "$1"; }
blue(){ printf "\033[34m%s\033[0m\n" "$1"; }

MON_PID=""
cleanup() {
  blue "==> Stopping monitor"
  [ -n "$MON_PID" ] && kill "$MON_PID" 2>/dev/null
  minikube ssh -- "sudo pkill -f ebpf_monitor.py" 2>/dev/null || true
}
trap cleanup EXIT

hit() {
  local path="$1" ip
  ip="$(kubectl get pod -l "app=${APP}" -o jsonpath='{.items[0].status.podIP}' 2>/dev/null)"
  [ -z "$ip" ] && { red "  could not get pod IP"; return 1; }
  echo "  -> curl http://${ip}:8000${path} (from node)"
  minikube ssh -- "curl -s --max-time 5 http://${ip}:8000${path}" 2>/dev/null
  echo
}
blue "==> Copying monitor into node and starting it (background)"
minikube cp "${SCRIPT_DIR}/ebpf_monitor.py" "${REMOTE}" || { red "minikube cp failed"; exit 1; }
: > "$LOG"
minikube ssh -- "sudo python3 ${REMOTE}" > "$LOG" 2>&1 &
MON_PID=$!
blue "==> Waiting 5s for monitor to initialize"
sleep 5
echo "  backend line: $(grep -m1 'backend =' "$LOG" || echo '(none yet)')"
blue "==> Test 1: trigger /stress, expect a CPU [ALERT]"
hit /stress
echo "  waiting 10s for detection..."
sleep 10
if grep -q "\[ALERT\] High CPU detected" "$LOG"; then
  CPU_RESULT=PASS; green "  CPU spike detected"
  grep -A5 "High CPU detected" "$LOG" | sed 's/^/    /' | head -6
else
  CPU_RESULT=FAIL; red "  no CPU alert found"
fi
blue "==> Test 2: trigger /crash, expect 'Process crash detected'"
hit /crash
echo "  waiting 10s for detection..."
sleep 10
if grep -q "Process crash detected" "$LOG"; then
  CRASH_RESULT=PASS; green "  crash detected"
  grep -A5 "Process crash detected" "$LOG" | sed 's/^/    /' | head -6
else
  CRASH_RESULT=FAIL; red "  no crash alert found"
fi
echo
blue "PHASE 2 TEST RESULTS"
printf "CPU Spike Detection:     %s\n" "$CPU_RESULT"
printf "Process Crash Detection: %s\n" "$CRASH_RESULT"

[ "$CPU_RESULT" = PASS ] && [ "$CRASH_RESULT" = PASS ]
