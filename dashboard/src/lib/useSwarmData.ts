import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API, hhmmss, parseHealSeconds } from './format';
import type {
  AgentState, AiConfig, Heal, PipelineStage, PodMetrics, Series, SwarmEvent, Toast,
} from './types';

const MAX_POINTS = 150;       // ~5 min at 2s poll
const MEM_LIMIT_MI = 256;

export interface SwarmData {
  connected: boolean;
  aiConfig: AiConfig | null;
  metrics: PodMetrics;
  events: SwarmEvent[];
  cpuHistory: Series[];
  memHistory: Series[];
  heals: Heal[];
  stats: {
    incidentsPrevented: number;
    avgHealTime: number;
    uptime: number;
    alertsToday: number;
    podsMonitored: number;
    llmDecisions: number;
  };
  pipeline: PipelineStage;
  agents: AgentState;
  simulating: boolean;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  trigger: (type: 'cpu' | 'memory' | 'network') => Promise<void>;
}

const STAGE_BY_TYPE: Record<string, PipelineStage> = {
  incident: 'snitch',
  agent_start: 'brain', thinking: 'brain', reasoning: 'brain', decision: 'brain',
  tool_call: 'brain', tool_result: 'brain', evaluation: 'brain',
  executing: 'swarm', command_output: 'swarm', verifying: 'swarm', verified: 'swarm',
  healed: 'healed',
};

export function useSwarmData(): SwarmData {
  const [connected, setConnected] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const [metrics, setMetrics] = useState<PodMetrics>({
    cpu: 1.8, memory: 50, restarts: 0, pod_name: 'victim-app', tcpRetransmits: 0.1,
  });
  const [cpuHistory, setCpuHistory] = useState<Series[]>([]);
  const [memHistory, setMemHistory] = useState<Series[]>([]);
  const [heals, setHeals] = useState<Heal[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const esRef = useRef<EventSource | null>(null);
  const seenHeal = useRef<Set<number>>(new Set());
  const seenEvt = useRef<Set<number>>(new Set());
  const toastId = useRef(1);

  const pushToast = useCallback((kind: Toast['kind'], icon: string, text: string) => {
    const id = toastId.current++;
    setToasts((p) => [...p.slice(-2), { id, kind, icon, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const ingestEvents = useCallback((incoming: SwarmEvent[]) => {
    for (const e of incoming) {
      if (seenEvt.current.has(e.id)) continue;
      seenEvt.current.add(e.id);
      if (e.type === 'incident') { setSimulating(true); pushToast('crit', '🔴', `${e.metric || 'incident'} detected — ${(e.pod || '').slice(0, 22)}`); }
      else if (e.type === 'agent_start' && /fast-path/i.test(e.content)) pushToast('fast', '⚡', 'Fast path activated — healing…');
      else if (e.type === 'healed') {
        setSimulating(false);
        if (!seenHeal.current.has(e.id)) {
          seenHeal.current.add(e.id);
          const secs = parseHealSeconds(e.total_heal_time);
          pushToast('ok', '✅', `Pod healed in ${secs}s`);
          setHeals((p) => [
            ...p,
            { id: e.id, time: hhmmss(e.timestamp), seconds: secs, pod: e.pod || '', metric: '', fast: true },
          ].slice(-10));
        }
      } else if (e.type === 'error' || e.type === 'failed') pushToast('warn', '⚠️', e.content.slice(0, 40));
    }
  }, [pushToast]);
  useEffect(() => {
    const f = async () => {
      try {
        const r = await fetch(`${API}/api/config`);
        if (r.ok) { setAiConfig(await r.json()); setConnected(true); }
      } catch { setConnected(false); }
    };
    f(); const i = setInterval(f, 10000); return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const f = async () => {
      try {
        const r = await fetch(`${API}/api/status`);
        if (!r.ok) return;
        const d = await r.json();
        setConnected(true);
        if (d.metrics) {
          setMetrics(d.metrics);
          const now = Date.now();
          setCpuHistory((p) => [...p, { t: now, v: d.metrics.cpu || 0 }].slice(-MAX_POINTS));
          setMemHistory((p) => [...p, { t: now, v: ((d.metrics.memory || 0) / MEM_LIMIT_MI) * 100 }].slice(-MAX_POINTS));
        }
        if (Array.isArray(d.events) && d.events.length) {
          setEvents((prev) => (d.events.length >= prev.length ? d.events : prev));
          ingestEvents(d.events);
        }
      } catch { setConnected(false); }
    };
    f(); const i = setInterval(f, 2000); return () => clearInterval(i);
  }, [ingestEvents]);
  useEffect(() => {
    const connect = () => {
      esRef.current?.close();
      try {
        const es = new EventSource(`${API}/api/events`);
        esRef.current = es;
        es.onmessage = (m) => {
          try {
            const evt: SwarmEvent = JSON.parse(m.data);
            if (evt.type === 'connected') return;
            setEvents((prev) => (prev.some((p) => p.id === evt.id) ? prev : [...prev, evt]));
            ingestEvents([evt]);
          } catch { /* ignore */ }
        };
        es.onerror = () => { es.close(); setTimeout(connect, 3000); };
      } catch { /* offline */ }
    };
    connect();
    return () => esRef.current?.close();
  }, [ingestEvents]);

  const trigger = useCallback(async (type: 'cpu' | 'memory' | 'network') => {
    setSimulating(true);
    seenEvt.current.clear();
    setEvents([]);
    try {
      await fetch(`${API}/api/chaos?type=${type}`, { method: 'POST' });
    } catch {
      setSimulating(false);
      pushToast('warn', '⚠️', 'API offline — start dashboard_api.py');
    }
  }, [pushToast]);
  const pipeline: PipelineStage = useMemo(() => {
    if (!events.length) return 'idle';
    const last = events[events.length - 1];
    if (last.type === 'healed') return 'healed';
    return STAGE_BY_TYPE[last.type] || 'idle';
  }, [events]);
  const agents: AgentState = useMemo(() => {
    const a: AgentState = {
      planner: 'idle', evaluator: 'idle', executor: 'idle',
      lastDecision: '—', lastReason: '—', lastCommand: '—',
      riskLevel: '—', fastPath: false,
      plannerCount: heals.length, llmCount: 0,
    };
    for (const e of events) {
      if (e.type === 'agent_start' && e.agent === 'planner') { a.planner = 'thinking'; if (/fast-path/i.test(e.content)) a.fastPath = true; }
      if (e.type === 'decision') { a.planner = 'decided'; a.lastDecision = `${e.action || 'restart_pod'} on ${e.target || e.pod || ''}`; a.lastReason = e.reason || a.lastReason; }
      if (e.type === 'evaluation') { a.evaluator = e.approved ? 'approved' : 'blocked'; a.riskLevel = e.risk_level || 'low'; a.lastReason = e.content || a.lastReason; }
      if (e.type === 'executing') { a.executor = 'firing'; a.lastCommand = e.command || e.content; }
      if (e.type === 'verified' || e.type === 'healed') a.executor = 'complete';
      if (!a.fastPath && (e.type === 'thinking' || e.type === 'reasoning' || e.type === 'tool_call')) a.llmCount = 1;
    }
    return a;
  }, [events, heals.length]);

  const stats = useMemo(() => {
    const total = heals.length;
    const avg = total ? heals.reduce((s, h) => s + h.seconds, 0) / total : 0;
    const llm = agents.fastPath ? 0 : (total ? 1 : 0);
    return {
      incidentsPrevented: total,
      avgHealTime: avg,
      uptime: 99.9,
      alertsToday: total + (simulating ? 1 : 0),
      podsMonitored: metrics.pod_name && metrics.pod_name !== 'unknown' ? 1 : 0,
      llmDecisions: llm,
    };
  }, [heals, agents.fastPath, simulating, metrics.pod_name]);

  return {
    connected, aiConfig, metrics, events, cpuHistory, memHistory, heals,
    stats, pipeline, agents, simulating, toasts, dismissToast, trigger,
  };
}
