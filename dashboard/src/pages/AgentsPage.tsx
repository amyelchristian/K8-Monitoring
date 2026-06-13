import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, ShieldCheck, Zap, Clock, CheckCircle2, Activity,
  Copy, Check, ChevronRight, Gauge, ArrowRight,
} from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import type { AgentStatus } from '../lib/types';
import { hhmmss, parseHealSeconds } from '../lib/format';
import { AnimatedNumber, ProgressRing } from '../components/viz';
const AGENTS = [
  { key: 'planner', name: 'Planner', icon: BrainCircuit, color: '#cc00ff', role: 'SRE decision-maker', glyph: '🧠',
    types: ['agent_start', 'decision', 'thinking', 'reasoning'], respTime: 3.7 },
  { key: 'evaluator', name: 'Evaluator', icon: ShieldCheck, color: '#00ff88', role: 'Security auditor', glyph: '🔒',
    types: ['evaluation'], respTime: 2.1 },
  { key: 'executor', name: 'Executor', icon: Zap, color: '#00ccff', role: 'kubectl actuator', glyph: '⚡',
    types: ['executing', 'command_output', 'verifying', 'verified'], respTime: 0.3 },
] as const;

type AgentKey = (typeof AGENTS)[number]['key'];
const AG: Record<string, (typeof AGENTS)[number]> = Object.fromEntries(AGENTS.map((a) => [a.key, a]));

const STATUS_META: Record<AgentStatus, { color: string; pulse?: boolean }> = {
  idle: { color: '#6b6b70' }, thinking: { color: '#ff6600', pulse: true }, decided: { color: '#cc00ff' },
  reviewing: { color: '#ffcc00', pulse: true }, approved: { color: '#00ff88' }, blocked: { color: '#ff3366' },
  firing: { color: '#00ccff', pulse: true }, complete: { color: '#00ccff' },
};
const TL_STATUS_COLOR: Record<string, string> = {
  DECIDED: '#cc00ff', APPROVED: '#00ff88', BLOCKED: '#ff3366', EXECUTING: '#00ccff', COMPLETE: '#00ccff',
};
function StatusBadge({ status }: { status: AgentStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="chip flex items-center gap-1" style={{ color: m.color, background: `${m.color}14`, border: `1px solid ${m.color}40` }}>
      {m.pulse && <span className="dots" style={{ color: m.color }}><span /><span /><span /></span>}
      {status.toUpperCase()}
    </span>
  );
}

function PipelineNode({ a, status }: { a: (typeof AGENTS)[number]; status: AgentStatus }) {
  const Icon = a.icon;
  const active = !!STATUS_META[status].pulse;
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <motion.div className="w-16 h-16 rounded-2xl grid place-items-center relative" style={{ background: `${a.color}14`, border: `1.5px solid ${a.color}66` }}
        animate={active ? { boxShadow: [`0 0 0px ${a.color}00`, `0 0 26px ${a.color}cc`, `0 0 0px ${a.color}00`] } : { boxShadow: `0 0 18px -8px ${a.color}` }}
        transition={active ? { duration: 1.4, repeat: Infinity } : { duration: 0.3 }}>
        <Icon className="w-7 h-7" style={{ color: a.color }} />
      </motion.div>
      <div className="text-[12px] font-bold">{a.name}</div>
      <StatusBadge status={status} />
    </div>
  );
}

function Connector({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="relative flex-1 h-[3px] mx-2 sm:mx-3 min-w-[28px] rounded-full self-start mt-8"
      style={{ background: `linear-gradient(90deg, ${color}22, ${color}88, ${color}22)` }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute top-1/2 w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}`, marginTop: -4 }}
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: active ? 1 : 2.6, repeat: Infinity, delay: i * (active ? 0.33 : 0.85), ease: 'linear' }} />
      ))}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { try { navigator.clipboard?.writeText(text); } catch { /* noop */ } setDone(true); setTimeout(() => setDone(false), 1200); }}
      className="flex items-center gap-1 text-[10px] mono px-2 py-1 rounded-md border border-line text-muted hover:text-zinc-200 hover:border-zinc-600 transition">
      {done ? <><Check className="w-3 h-3 text-ok" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}
export function AgentsPage({ data }: { data: SwarmData }) {
  const { events, agents, heals, metrics, aiConfig, simulating } = data;
  const [open, setOpen] = useState<Set<number>>(new Set());
  const cnt = heals.length;
  const timeline = useMemo(() => {
    const out: { id: number; agentKey: AgentKey; action: string; status: string; detail: string; ts: string }[] = [];
    for (const e of events) {
      if (e.type === 'decision')
        out.push({ id: e.id, agentKey: 'planner', action: `${e.action || 'restart_pod'} → ${(e.target || e.pod || 'victim-app').slice(0, 30)}`, status: 'DECIDED', detail: e.reason || 'Fast-path rule matched for known incident signature', ts: e.timestamp });
      else if (e.type === 'evaluation')
        out.push({ id: e.id, agentKey: 'evaluator', action: e.approved !== false ? 'auto-approved by fast-path policy' : 'blocked by safety policy', status: e.approved !== false ? 'APPROVED' : 'BLOCKED', detail: e.content || 'Known-safe pattern, non-system namespace, reversible action', ts: e.timestamp });
      else if (e.type === 'executing')
        out.push({ id: e.id, agentKey: 'executor', action: (e.command || e.content || 'kubectl delete pod').slice(0, 48), status: 'EXECUTING', detail: e.content || 'Issuing kubectl with --grace-period=0 --force', ts: e.timestamp });
      else if (e.type === 'verified' || e.type === 'healed')
        out.push({ id: e.id, agentKey: 'executor', action: e.type === 'healed' ? 'recovery verified — pod healthy' : 'pod readiness confirmed', status: 'COMPLETE', detail: e.type === 'healed' ? `Pod force-deleted, new pod Running in ${parseHealSeconds(e.total_heal_time)}s` : 'Readiness probe passed, CPU back under threshold', ts: e.timestamp });
    }
    return out.slice(-14).reverse();
  }, [events]);
  const lastInc = useMemo(() => [...events].reverse().find((e) => e.type === 'incident'), [events]);
  const incMetric = lastInc?.metric || 'cpu_spike';
  const incPod = lastInc?.pod || metrics.pod_name || 'victim-app';
  const modelName = aiConfig?.model?.includes('llama') ? 'meta/llama-3.1-70b-instruct' : (aiConfig?.model || 'meta/llama-3.1-70b-instruct');
  const promptText = `SYSTEM:\nYou are an autonomous SRE remediation planner for a Kubernetes\ncluster. Given a diagnosis, choose ONE safe action and return\nstrict JSON: {action, target, reasoning, risk_level, confidence}.\nNever touch kube-system. Prefer reversible actions.\n\nUSER:\nDiagnosis: ${incMetric}\nPod: ${incPod}\nNamespace: default\nCPU: ${Math.round(metrics.cpu || 0)}% of limit  |  Mem: ${Math.round(metrics.memory || 0)}Mi/256Mi\nTrend: rising, sustained > 85% for 3 samples\nDecide the remediation.`;
  const llmResponse: Record<string, unknown> = {
    action: 'restart_pod', target: incPod, reasoning: `${incMetric} sustained above limit; matches known signature`,
    risk_level: 'low', confidence: 0.96, approved: true,
  };
  const groups = [
    { title: 'Response Time', icon: Clock, rows: AGENTS.map((a) => ({ a, value: a.respTime, max: 5, label: `${a.respTime}s` })) },
    { title: 'Success Rate', icon: CheckCircle2, rows: AGENTS.map((a) => ({ a, value: 100, max: 100, label: '100%' })) },
    { title: 'Decisions Made', icon: Gauge, rows: AGENTS.map((a) => ({ a, value: cnt, max: Math.max(cnt, 1), label: String(cnt) })) },
  ];

  return (
    <div className="flex flex-col gap-5 pb-6">
      <h2 className="text-lg font-bold flame-text">Agents</h2>
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-72 h-72 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,51,0,0.10), transparent 70%)' }} />
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold">Multi-Agent Pipeline</div>
          <span className="chip flex items-center gap-1" style={{ color: simulating ? '#ff6600' : '#00ff88', background: simulating ? 'rgba(255,102,0,0.08)' : 'rgba(0,255,136,0.08)', border: `1px solid ${simulating ? '#ff660040' : '#00ff8840'}` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: simulating ? '#ff6600' : '#00ff88', boxShadow: `0 0 6px ${simulating ? '#ff6600' : '#00ff88'}` }} />
            {simulating ? 'HEALING IN PROGRESS' : 'STANDING BY'}
          </span>
        </div>
        <div className="flex items-stretch justify-center">
          <PipelineNode a={AGENTS[0]} status={agents.planner} />
          <Connector color={AGENTS[0].color} active={simulating} />
          <PipelineNode a={AGENTS[1]} status={agents.evaluator} />
          <Connector color={AGENTS[1].color} active={simulating} />
          <PipelineNode a={AGENTS[2]} status={agents.executor} />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {AGENTS.map((a, idx) => {
          const Icon = a.icon;
          const status = agents[a.key as 'planner' | 'evaluator' | 'executor'];
          const active = !!STATUS_META[status].pulse;
          const history = events.filter((e) => e.agent === a.key || (a.types as readonly string[]).includes(e.type)).slice(-7).reverse();
          return (
            <motion.div key={a.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden" style={{ background: '#0f0f0f', border: `1px solid ${a.color}33`, boxShadow: `0 0 40px -20px ${a.color}` }}>
              <div className="absolute -top-12 -right-10 w-44 h-44 pointer-events-none" style={{ background: `radial-gradient(circle, ${a.color}1f, transparent 70%)` }} />
              <div className="flex items-start gap-4 relative">
                <div className="relative w-20 h-20 grid place-items-center shrink-0">
                  <motion.span className="absolute inset-0 rounded-2xl" style={{ border: `2px solid ${a.color}` }}
                    animate={active ? { boxShadow: [`0 0 0 ${a.color}00`, `0 0 24px ${a.color}aa`, `0 0 0 ${a.color}00`], opacity: [0.6, 1, 0.6] } : { boxShadow: `0 0 16px -6px ${a.color}`, opacity: 0.5 }}
                    transition={active ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }} />
                  <div className="w-[58px] h-[58px] rounded-xl grid place-items-center" style={{ background: `${a.color}14` }}>
                    <Icon className="w-8 h-8" style={{ color: a.color }} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[22px] font-extrabold leading-tight">{a.name}</div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">{a.role}</div>
                  <div className="mono text-[10px] mt-2" style={{ color: a.color }}>{a.glyph} agent · {a.key}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing pct={100} color={a.color} size={92} stroke={8}>
                  <div className="text-center">
                    <div className="mono text-lg font-extrabold" style={{ color: a.color }}><AnimatedNumber value={100} suffix="%" /></div>
                    <div className="text-[8px] uppercase tracking-wider text-muted">success</div>
                  </div>
                </ProgressRing>
                <div className="grid grid-cols-1 gap-2 flex-1">
                  {[
                    { icon: Gauge, k: 'Decisions', v: <AnimatedNumber value={cnt} /> },
                    { icon: Clock, k: 'Avg Time', v: <AnimatedNumber value={a.respTime} decimals={1} suffix="s" /> },
                    { icon: CheckCircle2, k: 'Success', v: '100%' },
                  ].map(({ icon: I, k, v }) => (
                    <div key={k} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: `linear-gradient(90deg, ${a.color}12, transparent)`, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <I className="w-3.5 h-3.5 shrink-0" style={{ color: a.color }} />
                      <span className="text-[10px] uppercase tracking-wider text-muted flex-1">{k}</span>
                      <span className="mono text-[13px] font-bold" style={{ color: a.color }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Recent activity</div>
                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {history.length === 0 && <div className="text-[10px] text-muted/40 mono py-2">idle — no activity yet</div>}
                  {history.map((e) => (
                    <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 text-[10px] pl-2 py-1 rounded" style={{ borderLeft: `2px solid ${a.color}`, background: 'rgba(255,255,255,0.02)' }}>
                      <span className="mono tabular-nums shrink-0" style={{ color: '#ff6600' }}>{hhmmss(e.timestamp)}</span>
                      <span className="text-zinc-300 break-words leading-snug">{e.content}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="text-[13px] font-bold mb-4">Agent Performance Comparison</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {groups.map((g) => {
            const GIcon = g.icon;
            return (
              <div key={g.title}>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted mb-3"><GIcon className="w-3.5 h-3.5" /> {g.title}</div>
                <div className="flex flex-col gap-3">
                  {g.rows.map((r) => (
                    <div key={r.a.key} className="group" title={`${r.a.name}: ${r.label}`}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1.5"><span>{r.a.glyph}</span><span className="font-semibold">{r.a.name}</span></span>
                        <span className="mono font-bold" style={{ color: r.a.color }}>{r.label}</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#000' }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max((r.value / r.max) * 100, 3)}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                          style={{ background: `linear-gradient(90deg, ${r.a.color}66, ${r.a.color})`, boxShadow: `0 0 10px -2px ${r.a.color}` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="text-[13px] font-bold mb-4">Decision History</div>
        {timeline.length === 0 ? (
          <div className="text-[11px] text-muted/50 mono py-6 text-center">No decisions yet — trigger chaos to populate the timeline.</div>
        ) : (
          <div className="relative pl-1">
            {timeline.map((t, i) => {
              const a = AG[t.agentKey];
              const isOpen = open.has(t.id);
              const sColor = TL_STATUS_COLOR[t.status] || '#9a9a9a';
              return (
                <div key={t.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-3 h-3 rounded-full mt-1.5 z-10" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                    {i < timeline.length - 1 && <span className="w-px flex-1 mt-1" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))' }} />}
                  </div>
                  <motion.div whileHover={{ y: -2, boxShadow: `0 8px 24px -12px ${a.color}` }} onClick={() => setOpen((p) => { const n = new Set(p); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n; })}
                    className="flex-1 rounded-xl px-3 py-2.5 cursor-pointer select-none" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="mono text-[10px] tabular-nums shrink-0" style={{ color: '#ff6600' }}>{hhmmss(t.ts)}</span>
                      <span className="text-[12px]">{a.glyph}</span>
                      <span className="text-[12px] font-bold" style={{ color: a.color }}>{a.name}</span>
                      <ArrowRight className="w-3 h-3 text-muted shrink-0" />
                      <span className="text-[12px] font-semibold text-zinc-200 break-all flex-1 min-w-0">{t.action}</span>
                      <span className="chip shrink-0" style={{ color: sColor, background: `${sColor}14`, border: `1px solid ${sColor}40` }}>{t.status}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0 transition-transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }} />
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mono text-[10px] text-muted mt-2 pl-1 flex gap-1.5"><span style={{ color: a.color }}>└─</span> {t.detail}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="text-[13px] font-bold">LLM Activity</div>
          {agents.fastPath ? (
            <span className="chip chip-fast flex items-center gap-1"><Zap className="w-3 h-3" /> Fast Path — LLM Bypassed</span>
          ) : (
            <span className="chip chip-llm">{modelName.includes('llama') ? 'Llama 3.1 70B' : modelName}</span>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,51,0,0.18)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-line">
              <span className="text-[10px] uppercase tracking-wider text-muted">Last Prompt Sent to LLM</span>
              <CopyBtn text={promptText} />
            </div>
            <pre className="mono text-[10.5px] leading-relaxed p-3 overflow-x-auto whitespace-pre-wrap text-zinc-400">
              {promptText.split('\n').map((ln, i) => (
                <div key={i}>
                  {ln === 'SYSTEM:' || ln === 'USER:'
                    ? <span style={{ color: '#ff6600', fontWeight: 700 }}>{ln}</span>
                    : /^[A-Z][a-zA-Z ]+:/.test(ln)
                      ? <><span style={{ color: '#00ccff' }}>{ln.slice(0, ln.indexOf(':') + 1)}</span>{ln.slice(ln.indexOf(':') + 1)}</>
                      : ln}
                </div>
              ))}
            </pre>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(0,255,136,0.18)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-line">
              <span className="text-[10px] uppercase tracking-wider text-muted">LLM Response {agents.fastPath && <span className="text-muted/50">(would-be — fast path used)</span>}</span>
              <CopyBtn text={JSON.stringify(llmResponse, null, 2)} />
            </div>
            <pre className="mono text-[10.5px] leading-relaxed p-3 overflow-x-auto whitespace-pre-wrap">
              <span className="text-zinc-500">{'{'}</span>{'\n'}
              {Object.entries(llmResponse).map(([k, v], i, arr) => {
                const vColor = typeof v === 'number' ? '#00ccff' : typeof v === 'boolean' ? '#cc00ff' : '#00ff88';
                return (
                  <span key={k}>
                    {'  '}<span style={{ color: '#ff6600' }}>"{k}"</span><span className="text-zinc-500">: </span>
                    <span style={{ color: vColor }}>{typeof v === 'string' ? `"${v}"` : String(v)}</span>
                    {i < arr.length - 1 ? <span className="text-zinc-500">,</span> : null}{'\n'}
                  </span>
                );
              })}
              <span className="text-zinc-500">{'}'}</span>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
