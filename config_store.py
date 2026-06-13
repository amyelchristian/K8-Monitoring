#!/usr/bin/env python3
"""
Shared runtime configuration store for eBPF-Swarm (host-side).

The dashboard writes settings here via POST /api/settings; the host-side scripts
(`dashboard_api.py`, `swarm.py`) read them at runtime so changes apply WITHOUT a
restart. The in-node snitch (`ebpf_monitor.py`) has its own self-contained reader
because it runs inside the Minikube node where this module isn't present.

config.json holds percentages for thresholds (e.g. cpu_warning = 60), matching the
dashboard sliders. ebpf_monitor converts those to cgroup fractions (/100).
"""

import json
import os
from pathlib import Path

CONFIG_FILE = Path(os.environ.get("SWARM_CONFIG", "config.json"))

DEFAULTS = {
    "cpu_warning": 60,
    "cpu_critical": 85,
    "memory_warning": 60,
    "memory_critical": 85,
    "cooldown": 120,
    "llm_timeout": 20,
    "llm_model": "meta/llama-3.1-70b-instruct",
    "sound_notifications": False,
    "auto_scroll": True,
    "refresh_rate": 1,
}


def load_config():
    """Return the current config, falling back to DEFAULTS for any missing key."""
    cfg = dict(DEFAULTS)
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                data = json.load(f)
            if isinstance(data, dict):
                for k in DEFAULTS:
                    if k in data and data[k] is not None:
                        cfg[k] = data[k]
    except (json.JSONDecodeError, OSError):
        pass
    return cfg


def save_config(updates):
    """Merge `updates` (only known keys) into config.json. Written atomically so a
    concurrent reader never sees a half-written file. Returns the merged config."""
    cfg = load_config()
    for k, v in (updates or {}).items():
        if k in DEFAULTS and v is not None:
            cfg[k] = v
    tmp = CONFIG_FILE.with_name(CONFIG_FILE.name + ".tmp")
    with open(tmp, "w") as f:
        json.dump(cfg, f, indent=2)
    os.replace(tmp, CONFIG_FILE)  # atomic on POSIX
    return cfg
