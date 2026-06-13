import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from 'recharts';
import { ShieldCheck, Zap, CheckCircle2, HeartPulse } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import { AnimatedNumber, ArcGauge, ProgressRing, Sparkline, TrendArrow } from '../components/viz';

const C = { fast: '#00ccff', llm: '#cc00ff', ok: '#00ff88', warn: '#ffcc00', crit: '#ff3366', flame: '#ff6600' };
const METRIC_ICON: Record<string, string> = { cpu_spike: '⚡', process_crash: '💀', memory_leak: '💧', network_partition: '🌐', unknown: '❔' };
const METRIC_COLOR: Record<string, string> = { cpu_spike: '#ff6600', process_crash: '#ff3366', memory_leak: '#ffcc00', network_partition: '#cc00ff', unknown: '#888' };

function Panel({ title, sub, children, className = '', style }: { title: string; sub?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className={`glass rounded-2xl p-4 flex flex-col relative overflow-hidden box-border w-full ${className}`} style={{ background: '#0f0f0f', border: '1px solid rgba(255,51,0,0.15)', ...style }}>
      <div className="mb-3">
        <h3 className="text-[12px] font-bold tracking-wide">{title}</h3>
        {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}
function ResolutionFlow({ d }: { d: { detected: number; warning: number; critical: number; fast: number; llm: number; blocked: number; healed: number; manual: number } }) {
  const node = (x: number, y: number, label: string, color: string) => (
    <g>
      <rect x={x} y={y} width={128} height={34} rx={8} fill={`${color}1a`} stroke={`${color}66`} />
      <text x={x + 64} y={y + 21} textAnchor="middle" fill={color} fontSize={11} fontFamily="JetBrains Mono" fontWeight={700}>{label}</text>
    </g>
  );
  const link = (x1: number, y1: number, x2: number, y2: number, color: string, w: number, id: string) => {
    const mx = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return (
      <g key={id}>
        <path id={id} d={path} stroke={`${color}33`} strokeWidth={Math.max(w, 3)} fill="none" />
        <path d={path} stroke={color} strokeWidth={Math.max(w, 3)} fill="none" strokeOpacity={0.5}
          strokeDasharray="6 10" style={{ animation: 'dash 1.2s linear infinite' }} />
        <circle r={3} fill="#fff">
          <animateMotion dur="2.4s" repeatCount="indefinite"><mpath href={`#${id}`} /></animateMotion>
        </circle>
      </g>
    );
  };
  const sw = (n: number) => Math.min(2 + n * 2, 14);
  return (
    <svg viewBox="0 0 900 250" width="100%" style={{ minHeight: 230 }}>
      {link(188, 70, 250, 60, C.warn, sw(d.warning), 'l-dw')}
      {link(188, 70, 250, 150, C.crit, sw(d.critical), 'l-dc')}
      {link(378, 60, 440, 50, C.fast, sw(d.fast), 'l-wf')}
      {link(378, 150, 440, 130, C.llm, sw(d.llm), 'l-cl')}
      {link(378, 150, 440, 200, C.crit, sw(d.blocked), 'l-cb')}
      {link(568, 50, 700, 80, C.ok, sw(d.fast), 'l-fh')}
      {link(568, 130, 700, 80, C.ok, sw(d.llm), 'l-lh')}
      {link(568, 200, 700, 180, '#888', sw(d.blocked), 'l-bm')}
      {node(60, 53, 'Detected', C.flame)}
      {node(250, 43, 'WARNING', C.warn)}
      {node(250, 133, 'CRITICAL', C.crit)}
      {node(440, 33, '⚡ Fast Path', C.fast)}
      {node(440, 113, '🤖 LLM Path', C.llm)}
      {node(440, 183, 'Blocked', '#888')}
      {node(700, 63, '✅ Healed', C.ok)}
      {node(700, 163, '🔧 Manual', '#888')}
    </svg>
  );
}

export function AnalyticsPage({ data }: { data: SwarmData }) {
  const { events, heals, stats } = data;

  const derived = useMemo(() => {
    const llm = stats.llmDecisions;
    const fast = Math.max(heals.length - llm, 0);
    const totalPath = fast + llm || 1;

    const mc: Record<string, number> = {};
    events.filter((e) => e.type === 'incident').forEach((e) => { const m = e.metric || 'unknown'; mc[m] = (mc[m] || 0) + 1; });
    const totalInc = Object.values(mc).reduce((a, b) => a + b, 0);
    const ranked = Object.entries(mc).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count, pct: totalInc ? (count / totalInc) * 100 : 0 }));

    const hours: Record<string, number> = {};
    heals.forEach((h) => { const hr = h.time.slice(0, 2) + ':00'; hours[hr] = (hours[hr] || 0) + 1; });
    const hourData = Object.entries(hours).sort().map(([h, c]) => ({ h, c }));
    const avgRate = hourData.length ? hourData.reduce((s, x) => s + x.c, 0) / hourData.length : 0;
    const peak = hourData.reduce((p, x) => (x.c > p.c ? x : p), { h: '—', c: 0 });

    const buckets = [
      { label: '< 2s', color: C.ok, items: heals.filter((h) => h.seconds < 2) },
      { label: '2–5s', color: C.warn, items: heals.filter((h) => h.seconds >= 2 && h.seconds < 5) },
      { label: '5–10s', color: C.flame, items: heals.filter((h) => h.seconds >= 5 && h.seconds <= 10) },
      { label: '> 10s', color: C.crit, items: heals.filter((h) => h.seconds > 10) },
    ];

    const warning = events.filter((e) => e.type === 'warning').length;
    const critical = Math.max(totalInc - warning, totalInc ? 1 : 0);
    const flow = {
      detected: totalInc || 1, warning: warning || 1, critical: critical || 1,
      fast, llm, blocked: events.filter((e) => e.type === 'evaluation' && e.approved === false).length,
      healed: heals.length, manual: 0,
    };

    return { fast, llm, totalPath, fastPct: Math.round((fast / totalPath) * 100), llmPct: Math.round((llm / totalPath) * 100),
      ranked, totalInc, hourData, avgRate, peak, buckets, flow };
  }, [events, heals, stats.llmDecisions]);

  const agents = [
    { name: 'Planner', icon: '🧠', s: 3.7, max: 5, color: C.llm },
    { name: 'Evaluator', icon: '🔒', s: 2.1, max: 5, color: C.ok },
    { name: 'Executor', icon: '⚡', s: 0.3, max: 5, color: C.fast },
  ];
  const fastestAgent = agents.reduce((p, a) => (a.s < p.s ? a : p));

  const statCards = [
    { icon: ShieldCheck, label: 'Total Heals', value: stats.incidentsPrevented, dec: 0, suffix: '', color: C.ok, spark: heals.map((_, i) => i + 1) },
    { icon: Zap, label: 'Avg Heal Time', value: stats.avgHealTime, dec: 1, suffix: 's', color: C.fast, spark: heals.map((h) => h.seconds) },
    { icon: CheckCircle2, label: 'Success Rate', value: 100, dec: 0, suffix: '%', color: C.ok, spark: [90, 95, 100, 100, 100] },
    { icon: HeartPulse, label: 'Uptime', value: 99.9, dec: 1, suffix: '%', color: C.ok, spark: [99, 99.5, 99.9, 99.9, 99.9] },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h2 className="text-lg font-bold flame-text">Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 relative overflow-hidden flex flex-col box-border" style={{ minHeight: 158, background: `linear-gradient(135deg, ${c.color}14, #0f0f0f 60%)`, border: `1px solid ${c.color}33` }}>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: `${c.color}1c`, border: `1px solid ${c.color}44` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: c.color }} />
                </div>
                <span className="text-[10px] mono" style={{ color: c.color }}><TrendArrow up good /> 100%</span>
              </div>
              <div className="mono text-2xl font-extrabold mt-3" style={{ color: '#fff' }}>
                <AnimatedNumber value={c.value} decimals={c.dec} suffix={c.suffix} />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted">{c.label}</div>
              <div className="mt-1 -mb-1"><Sparkline data={c.spark.length ? c.spark : [0, 1, 0.5, 1]} color={c.color} w={120} h={26} /></div>
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Fast Path vs LLM Path" sub="rule-based vs LLM remediation" style={{ padding: '28px 32px 24px 32px' }}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-10 flex-1" style={{ marginTop: 28 }}>
            {[{ label: '⚡ FAST PATH', n: derived.fast, pct: derived.fastPct, color: C.fast, unit: 'executions' }, null,
              { label: '🤖 LLM PATH', n: derived.llm, pct: derived.llmPct, color: C.llm, unit: 'decisions' }].map((g) =>
              g === null ? (
                <div key="vs" className="flex flex-col items-center justify-center gap-2 px-1 self-stretch">
                  <div className="w-px bg-line" style={{ height: 80 }} />
                  <div className="w-9 h-9 rounded-full grid place-items-center text-[11px] mono shrink-0"
                    style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.12)', color: '#9b9ba3' }}>VS</div>
                  <div className="w-px bg-line" style={{ height: 80 }} />
                </div>
              ) : (
                <div key={g.label} className="flex flex-col items-center min-w-0">
                  <div className="text-[12px] font-bold whitespace-nowrap" style={{ color: g.color }}>{g.label}</div>
                  <div className="flex flex-col items-center w-full" style={{ maxWidth: 200, marginTop: 20 }}>
                    <ArcGauge pct={g.pct} color={g.color} size={180} stroke={14} />
                    <div className="mono font-extrabold leading-none" style={{ color: g.color, fontSize: 42, marginTop: -30 }}>
                      <AnimatedNumber value={g.n} />
                    </div>
                    <div className="uppercase" style={{ color: '#888', fontSize: 13, marginTop: 8, letterSpacing: '0.05em' }}>{g.unit}</div>
                  </div>
                  <div className="mono" style={{ color: g.color, fontSize: 15, fontWeight: 600, marginTop: 6 }}><AnimatedNumber value={g.pct} suffix="%" /></div>
                </div>
              )
            )}
          </div>
          <div className="border-t border-line" style={{ marginTop: 32, paddingTop: 20 }}>
            <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: '#000' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${derived.fastPct}%` }} transition={{ duration: 0.9 }} style={{ background: `linear-gradient(90deg, ${C.fast}, #0088ff)` }} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${derived.llmPct}%` }} transition={{ duration: 0.9 }} style={{ background: `linear-gradient(90deg, ${C.llm}, #8800cc)` }} />
            </div>
            <div className="flex justify-between mt-2 text-[11px] mono">
              <span style={{ color: C.fast }}>Fast {derived.fastPct}%</span>
              <span style={{ color: C.llm }}>LLM {derived.llmPct}%</span>
            </div>
          </div>
        </Panel>

        <Panel title="Incident Distribution" sub="ranked by frequency">
          <div className="h-3 rounded-full overflow-hidden flex mb-3" style={{ background: '#000' }}>
            {(derived.ranked.length ? derived.ranked : [{ name: 'none', pct: 100, count: 0 }]).map((r) => (
              <motion.div key={r.name} initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 0.8 }}
                style={{ background: METRIC_COLOR[r.name] || '#26262a' }} />
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {(derived.ranked.length ? derived.ranked : [{ name: 'cpu_spike', count: 0, pct: 0 }, { name: 'process_crash', count: 0, pct: 0 }, { name: 'memory_leak', count: 0, pct: 0 }]).map((r, i) => (
              <div key={r.name} className="flex items-center gap-2.5 group">
                <span className="text-[10px] text-muted w-4 mono">{i + 1}</span>
                <span className="text-base w-5 text-center">{METRIC_ICON[r.name] || '❔'}</span>
                <span className="mono text-[11px] w-28 truncate" style={{ color: METRIC_COLOR[r.name] }}>{r.name}</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#000' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(r.pct, 2)}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${METRIC_COLOR[r.name]}66, ${METRIC_COLOR[r.name]})` }} />
                </div>
                <span className="mono text-[11px] w-9 text-right font-bold">{Math.round(r.pct)}%</span>
                <span className="chip chip-mut w-16 justify-center">{r.count} inc</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Heals by Hour" sub="recovery volume over the day">
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={derived.hourData.length ? derived.hourData : [{ h: '00:00', c: 0 }, { h: '12:00', c: 0 }]} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="hbar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.flame} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={C.flame} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} allowDecimals={false} width={26} />
                {derived.avgRate > 0 && <ReferenceLine y={derived.avgRate} stroke={C.flame} strokeDasharray="4 4" strokeOpacity={0.6} />}
                <Tooltip contentStyle={{ background: '#0d0d0d', border: `1px solid ${C.flame}55`, borderRadius: 8, fontSize: 11 }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#888' }} />
                <Area type="monotone" dataKey="c" stroke={C.flame} strokeWidth={2.5} fill="url(#hbar)" isAnimationActive
                  dot={{ r: 3, fill: C.flame, stroke: '#0a0a0a', strokeWidth: 1 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] mono text-muted">
            <span>Peak: <span className="text-flame-2">{derived.peak.h}</span></span>
            <span>Avg/hr: <span className="text-zinc-300">{derived.avgRate.toFixed(1)}</span></span>
            <span>Total: <span className="text-zinc-300">{heals.length}</span></span>
          </div>
        </Panel>

        <Panel title="Agent Response Time" sub="avg latency per agent">
          <div className="flex items-center justify-around">
            {agents.map((a) => (
              <div key={a.name} className="flex flex-col items-center gap-1.5">
                <ProgressRing pct={(a.s / a.max) * 100} color={a.color} size={a.name === 'Planner' ? 104 : a.name === 'Evaluator' ? 92 : 80}>
                  <div className="mono text-lg font-extrabold" style={{ color: a.color }}><AnimatedNumber value={a.s} decimals={1} suffix="s" /></div>
                </ProgressRing>
                <div className="text-[11px] font-bold flex items-center gap-1">{a.icon} {a.name}{a.name === fastestAgent.name && <span title="fastest">⚡</span>}</div>
                <div className="text-[9px] text-muted">avg response</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {agents.map((a) => (
              <div key={a.name} className="flex items-center gap-2">
                <span className="text-[9px] mono text-muted w-16">{a.name}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#000' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(a.s / a.max) * 100}%` }} transition={{ duration: 0.9 }} style={{ background: a.color }} />
                </div>
                <span className="text-[9px] mono w-7 text-right" style={{ color: a.color }}>{a.s}s</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Incident Resolution Flow" sub="detection → triage → remediation → outcome">
        <ResolutionFlow d={derived.flow} />
      </Panel>
      <Panel title="Heal Speed Distribution" sub="every heal placed by recovery time">
        <div className="flex flex-col gap-3 py-1">
          {derived.buckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="mono text-[11px] w-14 text-right" style={{ color: b.color }}>{b.label}</span>
              <div className="flex-1 flex items-center gap-1.5 min-h-[20px]">
                {b.items.length === 0 ? <span className="text-[10px] text-muted/40 mono">—</span> :
                  b.items.map((h, i) => (
                    <motion.span key={h.id} title={`${h.pod} · ${h.seconds}s`}
                      initial={{ opacity: 0, x: -12, scale: 0 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18, delay: i * 0.04 }}
                      className="w-3.5 h-3.5 rounded-full cursor-pointer" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                  ))}
              </div>
              <span className="chip chip-mut w-16 justify-center">{b.items.length} heals</span>
            </div>
          ))}
          {stats.avgHealTime > 0 && (
            <div className="text-[10px] mono text-muted mt-1 flex items-center gap-2">
              <span className="inline-block w-8 border-t border-dashed border-flame-2" /> avg {stats.avgHealTime.toFixed(1)}s
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
