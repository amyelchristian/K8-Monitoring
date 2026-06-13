import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Boxes, Cpu, Database, HeartPulse, Zap, RotateCw, Clock } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import { cpuColor, num, timeAgo } from '../lib/format';
import { ArcGauge } from '../components/viz';
function MiniGauge({ pct, color, icon: Icon, label, value }: { pct: number; color: string; icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center" style={{ width: 96 }}>
      <ArcGauge pct={pct} color={color} size={88} stroke={9} />
      <div className="flex items-center gap-1 -mt-6">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="mono text-[14px] font-extrabold" style={{ color }}>{value}</span>
      </div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted mt-1">{label}</div>
    </div>
  );
}
function PodCard({ m, healing }: { m: SwarmData['metrics']; healing: boolean }) {
  const cpu = m.cpu || 0;
  const memPct = ((m.memory || 0) / 256) * 100;
  const health = cpu >= 85 ? 'critical' : cpu >= 60 || memPct >= 60 ? 'warning' : 'healthy';
  const glow = health === 'critical' ? '#ff3366' : health === 'warning' ? '#ffcc00' : '#00ff88';
  const badge = { healthy: 'chip-ok', warning: 'chip-warn', critical: 'chip-crit' }[health];

  const Bar = ({ label, pct, color, valueLabel }: { label: string; pct: number; color: string; valueLabel: string }) => (
    <div className="flex items-center gap-2.5">
      <span className="text-[9px] mono uppercase tracking-wider text-muted w-8 shrink-0">{label}</span>
      <div className="relative h-1.5 rounded-full overflow-hidden flex-1" style={{ background: '#000' }}>
        <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: pct >= 85 ? `0 0 8px ${color}` : 'none' }}
          initial={false} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        <span className="absolute top-0 bottom-0 w-px bg-warn/60" style={{ left: '60%' }} />
        <span className="absolute top-0 bottom-0 w-px bg-crit/70" style={{ left: '85%' }} />
      </div>
      <span className="mono text-[10px] font-bold w-20 text-right shrink-0" style={{ color: pct >= 60 ? color : '#d4d4d8' }}>{valueLabel}</span>
    </div>
  );

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`rounded-xl w-[320px] overflow-hidden ${healing ? 'pulse-crit' : ''}`}
      style={{ background: '#0e0e10', border: `1.5px solid ${glow}`, boxShadow: `0 0 28px -10px ${glow}` }}>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2 min-w-0">
          <motion.span animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
            className="w-2 h-2 rounded-full shrink-0" style={{ background: glow, boxShadow: `0 0 8px ${glow}` }} />
          <span className="mono text-[11px] truncate">{m.pod_name || 'unknown'}</span>
        </div>
        <span className={`chip ${badge} shrink-0`}>{health}</span>
      </div>
      <div className="px-4 pb-3 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
        <Bar label="CPU" pct={cpu} color={cpuColor(cpu)} valueLabel={`${num(cpu)}%`} />
        <Bar label="MEM" pct={memPct} color={memPct >= 85 ? '#ff3366' : '#ff6600'} valueLabel={`${Math.round(m.memory || 0)}Mi`} />
      </div>
      <div className="flex justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[['Restarts', String(m.restarts ?? 0), (m.restarts ?? 0) > 0 ? '#ff3366' : '#d4d4d8'],
          ['Age', '—', '#d4d4d8'], ['Port', ':8000', '#d4d4d8'], ['NS', 'default', '#d4d4d8']].map(([k, v, c]) => (
          <div key={k} className="text-center">
            <div className="text-[8px] uppercase tracking-wider text-muted">{k}</div>
            <div className="mono text-[11px] font-bold" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
export function ClusterMapPage({ data }: { data: SwarmData }) {
  const m = data.metrics;
  const cpu = m.cpu || 0;
  const memPct = ((m.memory || 0) / 256) * 100;
  const nodeHealth = cpu >= 85 ? '#ff3366' : cpu >= 60 ? '#ffcc00' : '#00ff88';
  const online = !!m.pod_name && m.pod_name !== 'unknown';
  const lastHeal = data.heals[data.heals.length - 1];

  const timeline = useMemo(() => {
    const inc = data.events.find((e) => e.type === 'incident');
    return [
      { label: 'Created', color: '#00ff88', when: 'pod start' },
      { label: 'Stressed', color: '#ff3366', when: inc ? timeAgo(inc.timestamp) : '—' },
      { label: 'Healed', color: '#00ccff', when: lastHeal ? `${lastHeal.seconds}s` : '—' },
      { label: 'Running', color: '#00ff88', when: 'now' },
    ];
  }, [data.events, lastHeal]);

  const statCards = [
    { icon: HeartPulse, color: '#00ff88', label: 'Healthy', value: `${online ? 1 : 0} pod` },
    { icon: Zap, color: '#00ccff', label: 'Last Heal', value: lastHeal ? `${lastHeal.seconds}s` : '—' },
    { icon: RotateCw, color: (m.restarts ?? 0) > 0 ? '#ff6600' : '#d4d4d8', label: 'Restarts', value: String(m.restarts ?? 0) },
    { icon: Clock, color: '#00ff88', label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h2 className="text-lg font-bold flame-text">Cluster Map</h2>

      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,51,0,0.12), transparent 70%)' }} />

        <div className="relative">
          <div className="rounded-2xl" style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.015)', border: `1px solid ${nodeHealth}40`, boxShadow: `0 0 20px ${nodeHealth}33` }}>
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl grid place-items-center flame-bg" style={{ boxShadow: '0 6px 22px -6px rgba(255,51,0,0.6)' }}>
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-base">minikube</div>
                  <div className="text-[10px] text-muted mono">control-plane · <span className="text-ok">Ready</span></div>
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 40 }}>
                <MiniGauge pct={cpu} color={cpuColor(cpu)} icon={Cpu} label="CPU" value={`${num(cpu)}%`} />
                <MiniGauge pct={memPct} color="#ff6600" icon={Database} label="MEM" value={`${Math.round(m.memory || 0)}Mi`} />
                <div className="flex flex-col items-center" style={{ width: 96 }}>
                  <Boxes className="w-7 h-7 text-fast" />
                  <div className="mono text-lg font-extrabold mt-1.5">{online ? 1 : 0}<span className="text-muted">/110</span></div>
                  <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: '#000' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(1 / 110) * 100}%` }} transition={{ duration: 0.8 }} style={{ background: '#00ccff' }} className="h-full" />
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.12em] text-muted mt-1">Pods</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderLeft: '2px dashed rgba(0,255,136,0.3)', height: 40, marginLeft: 40 }} />
          <div style={{ padding: 20, background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-4">Pods in this node</div>
            <div className="flex gap-4 flex-wrap">
              <AnimatePresence mode="popLayout">
                {online && <PodCard key={m.pod_name} m={m} healing={data.simulating} />}
              </AnimatePresence>
              <div className="w-[320px] rounded-xl grid place-items-center text-[10px] mono text-muted/30" style={{ minHeight: 150, border: '1.5px dashed rgba(255,255,255,0.08)' }}>
                {online ? 'available capacity' : 'no pods — cluster offline'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 40, marginBottom: 32 }}>
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted mb-4">Pod Event Timeline</div>
            <div className="flex items-start">
              {timeline.map((t, i) => (
                <div key={t.label} className="flex items-start flex-1 last:flex-none">
                  <div className="flex flex-col items-center w-[90px]" title={t.when}>
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1, type: 'spring' }}
                      className="w-4 h-4 rounded-full" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }} />
                    <span className="text-[11px] font-bold" style={{ marginTop: 8 }}>{t.label}</span>
                    <span className="text-[9px] mono" style={{ marginTop: 4, color: '#666' }}>{t.when}</span>
                  </div>
                  {i < timeline.length - 1 && <div className="flex-1 rounded-full" style={{ height: 2, marginTop: 7, background: `linear-gradient(90deg, ${t.color}, ${timeline[i + 1].color})` }} />}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#0f0f0f', border: `1px solid ${color}30` }}>
                <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: `${color}16`, border: `1px solid ${color}40` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-[0.12em] text-muted">{label}</div>
                  <div className="mono text-lg font-extrabold" style={{ color }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center flex-wrap text-[10px] mono text-muted" style={{ gap: 24, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[['#00ff88', 'Healthy'], ['#ffcc00', 'Warning'], ['#ff3366', 'Critical'], ['#00ccff', 'Healing']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
