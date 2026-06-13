#!/usr/bin/env bash

set -uo pipefail
cd "$(dirname "$0")"
REMOTE=/home/docker/ebpf_monitor.py
APP=victim-app
PHASE3_LOG=phase3_output.log
DIAG=diagnoses.log

CPU_RESULT=FAIL
CRASH_RESULT=FAIL
JSON_RESULT=FAIL

green(){ printf "\033[32m%s\033[0m\n" "$1"; }
red(){ printf "\033[31m%s\033[0m\n" "$1"; }
blue(){ printf "\033[34m%s\033[0m\n" "$1"; }

PIPE_PID=""
cleanup() {
  blue "==> Stopping pipeline"
  [ -n "$PIPE_PID" ] && kill "$PIPE_PID" 2>/dev/null
  pkill -f "causal_engine.py" 2>/dev/null || true
  minikube ssh -- "sudo pkill -f ebpf_monitor.py" 2>/dev/null || true
}
trap cleanup EXIT

hit() {
  local path="$1" ip
  ip="$(kubectl get pod -l "app=${APP}" -o jsonpath='{.items[0].status.podIP}' 2>/dev/null)"
  [ -z "$ip" ] && { red "  could not get pod IP"; return 1; }
  echo "  -> curl http://${ip}:8000${path} (from node)"
  minikube ssh -- "curl -s --max-time 5 http://${ip}:8000${path}" 2>/dev/null; echo
}
: > "$PHASE3_LOG"
: > "$DIAG"
blue "==> Copying monitor into node and starting Snitch -> Brain pipeline"
minikube cp ./ebpf_monitor.py "${REMOTE}" || { red "minikube cp failed"; exit 1; }
( minikube ssh -- "sudo python3 ${REMOTE}" | python3 -u causal_engine.py ) > "$PHASE3_LOG" 2>&1 &
PIPE_PID=$!
blue "==> Waiting 5s for pipeline to initialize"
sleep 5
blue "==> Test 1: trigger /stress, expect a cpu_spike diagnosis"
hit /stress
echo "  waiting 15s for detection + diagnosis..."
sleep 15
if grep -q '"root_cause"' "$DIAG" && grep -q '"metric"' "$DIAG"; then
  green "  PASS - JSON diagnosis generated"
fi
if grep -q '"cpu_spike"' "$DIAG"; then
  CPU_RESULT=PASS; green "  PASS - cpu_spike diagnosis present"
else
  red "  FAIL - no cpu_spike diagnosis"
fi
blue "==> Test 2: trigger /crash, expect a process_crash diagnosis"
hit /crash
echo "  waiting 15s for detection + diagnosis..."
sleep 15
if grep -q '"process_crash"' "$DIAG"; then
  CRASH_RESULT=PASS; green "  PASS - process_crash diagnosis present"
else
  red "  FAIL - no process_crash diagnosis"
fi
if [ -s "$DIAG" ] && python3 -c "
import json,sys
n=0
for ln in open('$DIAG'):
    ln=ln.strip()
    if not ln: continue
    json.loads(ln); n+=1
sys.exit(0 if n>0 else 1)
" 2>/dev/null; then
  JSON_RESULT=PASS
fi
echo
blue "LAST DIAGNOSES"
tail -2 "$DIAG" | while IFS= read -r ln; do
  [ -n "$ln" ] && echo "$ln" | python3 -m json.tool
done
echo
blue "PHASE 3 TEST RESULTS"
printf "CPU Spike Diagnosis:   %s\n" "$CPU_RESULT"
printf "Crash Diagnosis:       %s\n" "$CRASH_RESULT"
printf "JSON Format Valid:     %s\n" "$JSON_RESULT"

[ "$CPU_RESULT" = PASS ] && [ "$CRASH_RESULT" = PASS ] && [ "$JSON_RESULT" = PASS ]
