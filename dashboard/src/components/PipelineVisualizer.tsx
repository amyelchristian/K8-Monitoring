import { motion } from 'framer-motion';
import { Eye, BrainCircuit, Bot, CheckCircle2 } from 'lucide-react';
import type { PipelineStage } from '../lib/types';
import type { SwarmData } from '../lib/useSwarmData';

const ORDER: PipelineStage[] = ['snitch', 'brain', 'swarm', 'healed'];

const NODES = [
  { id: 'snitch', icon: Eye, title: 'SNITCH', sub: 'Watching' },
  { id: 'brain', icon: BrainCircuit, title: 'BRAIN', sub: 'Diagnosing' },
  { id: 'swarm', icon: Bot, title: 'SWARM', sub: 'Deciding' },
  { id: 'healed', icon: CheckCircle2, title: 'HEALED', sub: 'Complete' },
] as const;

export function PipelineVisualizer({ data }: { data: SwarmData }) {
  const stageIdx = data.pipeline === 'idle' ? -1 : ORDER.indexOf(data.pipeline);
  const healed = data.pipeline === 'healed';
  const watching = data.connected;   // system live & monitoring → SNITCH is always watching
  const last = data.events[data.events.length - 1];
  const metric = data.events.find((e) => e.type === 'incident')?.metric || 'cpu_spike';
  const decision = data.events.find((e) => e.type === 'decision')?.action || 'restart_pod';
  const healTime = data.heals.length ? `${data.heals[data.heals.length - 1].seconds}s` : '—';
  const subBy: Record<string, string> = {
    snitch: metric, brain: `${Math.round(data.metrics.cpu)}% CPU`, swarm: decision, healed: healTime,
  };

  return (
    <div className={`glass ${healed ? 'glass-flame' : ''} rounded-[20px] p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">Self-Healing Pipeline</h3>
        {data.simulating && (
          <motion.span className="chip chip-crit"
            animate={{ scale: [1, 1.05, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-crit blink" />Active
          </motion.span>
        )}
        {healed && <span className="chip chip-ok">Healed</span>}
      </div>

      <div className="flex items-center">
        {NODES.map((n, i) => {
          const isWatch = watching && stageIdx < 0 && n.id === 'snitch';   // idle but live → SNITCH glows
          const active = (stageIdx >= 0 && i <= stageIdx) || isWatch;
          const isCurrent = i === stageIdx;
          const glow = isCurrent || healed || isWatch;
          const Icon = n.icon;
          const color = healed ? '#00ff88' : isCurrent ? '#ff3300' : isWatch ? '#ff3300' : active ? '#cc00ff' : '#444';
          return (
            <div key={n.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 w-[120px] shrink-0">
                <motion.div animate={(isCurrent || isWatch) ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ repeat: (isCurrent || isWatch) ? Infinity : 0, duration: isWatch ? 2 : 1.2, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl grid place-items-center glass shadow-sm"
                  style={{
                    background: active ? `radial-gradient(circle, ${color}15, transparent)` : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: glow ? `0 0 16px -2px ${color}60` : 'none',
                  }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </motion.div>
                <div className="text-[11px] font-bold tracking-wide" style={{ color: active ? '#fff' : '#888' }}>{n.title}</div>
                <div className="text-[9px] text-muted">{n.sub}</div>
                <div className="mono text-[9px]" style={{ color: active ? color : '#666' }}>{subBy[n.id]}</div>
              </div>
              {i < NODES.length - 1 && (
                <div className="flex-1 h-[2px] relative mx-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {i < stageIdx && (
                    <>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,#cc00ff,#ff3300)' }} />
                      <motion.span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ background: '#fff', boxShadow: '0 0 8px #ff3300' }}
                        animate={{ left: ['0%', '100%'] }} transition={{ repeat: Infinity, duration: data.simulating ? 0.7 : 1.4, ease: 'linear' }} />
                    </>
                  )}
                  {watching && stageIdx < 0 && i === 0 && (
                    <motion.span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: '#fff', boxShadow: '0 0 8px #ff3300' }}
                      animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }} />
                  )}
                  {healed && <div className="absolute inset-0" style={{ background: '#00ff88' }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {last && (
        <div className="mt-4 pt-3 border-t border-line text-[10px] mono text-muted truncate">
          <span className="text-flame">›</span> {last.content}
        </div>
      )}
    </div>
  );
}
