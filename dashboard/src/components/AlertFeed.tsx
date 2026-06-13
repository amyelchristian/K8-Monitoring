import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, AlertOctagon, CheckCircle2, Skull, Cpu, Activity } from 'lucide-react';
import type { SwarmEvent } from '../lib/types';
import { hhmmss } from '../lib/format';

type Cat = 'ALL' | 'WARNING' | 'CRITICAL' | 'HEALED' | 'CRASH';

const META: Record<string, { cat: Cat; color: string; icon: React.ElementType; label: string }> = {
  incident: { cat: 'CRITICAL', color: '#ff3366', icon: AlertOctagon, label: 'CRITICAL' },
  decision: { cat: 'CRITICAL', color: '#cc00ff', icon: Activity, label: 'DECISION' },
  evaluation: { cat: 'CRITICAL', color: '#cc00ff', icon: CheckCircle2, label: 'AUDIT' },
  executing: { cat: 'CRITICAL', color: '#00ccff', icon: Cpu, label: 'EXEC' },
  command_output: { cat: 'CRITICAL', color: '#00ccff', icon: Cpu, label: 'OUTPUT' },
  verified: { cat: 'HEALED', color: '#00ff88', icon: CheckCircle2, label: 'VERIFIED' },
  healed: { cat: 'HEALED', color: '#00ff88', icon: CheckCircle2, label: 'HEALED' },
  warning: { cat: 'WARNING', color: '#ffcc00', icon: AlertTriangle, label: 'WARNING' },
  error: { cat: 'CRASH', color: '#ff3366', icon: Skull, label: 'ERROR' },
  failed: { cat: 'CRASH', color: '#ff3366', icon: Skull, label: 'FAILED' },
};
const fallback = { cat: 'ALL' as Cat, color: '#888', icon: Activity, label: 'INFO' };

const PILLS: Cat[] = ['ALL', 'WARNING', 'CRITICAL', 'HEALED', 'CRASH'];

export function AlertFeed({ events }: { events: SwarmEvent[] }) {
  const [cat, setCat] = useState<Cat>('ALL');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return [...events].reverse().filter((e) => {
      const m = META[e.type] || fallback;
      if (cat !== 'ALL' && m.cat !== cat) return false;
      if (q && !`${e.content} ${e.pod || ''} ${e.type}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [events, cat, q]);

  return (
    <div className="glass rounded-[20px] p-4 flex flex-col h-full min-h-0 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-crit blink" /> Live Alert Feed
        </h3>
        <span className="text-[10px] mono text-muted">{rows.length} events</span>
      </div>

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {PILLS.map((p) => (
          <button key={p} onClick={() => setCat(p)}
            style={{ background: cat === p ? undefined : 'rgba(255,255,255,0.02)' }}
            className={`text-[9px] mono uppercase px-2 py-1 rounded-md tracking-wider transition-colors shadow-sm ${cat === p ? 'flame-bg text-white shadow-lg' : 'text-muted border border-line hover:text-white hover:bg-white/5'}`}>{p}</button>
        ))}
      </div>

      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts…"
          className="w-full bg-black/40 border border-line rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white outline-none focus:border-flame/40 placeholder:text-muted/60 shadow-sm" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 min-h-0">
        {rows.length === 0 && <div className="text-[11px] text-muted mono text-center py-8">no events — trigger a fault to begin</div>}
        <AnimatePresence initial={false}>
          {rows.map((e) => {
            const m = META[e.type] || fallback;
            const Icon = m.icon;
            return (
              <motion.div key={e.id} layout initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="rounded-lg px-3 py-2 flex items-start gap-2.5 glass shadow-sm" style={{ borderLeft: `2px solid ${m.color}` }}>
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: m.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="chip" style={{ color: m.color, background: `${m.color}14`, border: `1px solid ${m.color}40` }}>{m.label}</span>
                    <span className="text-[9px] mono text-muted tabular-nums">{hhmmss(e.timestamp)}</span>
                    {e.total_heal_time && <span className="text-[9px] mono text-ok">{e.total_heal_time}</span>}
                  </div>
                  <div className="text-[11px] text-zinc-200 mt-0.5 leading-snug break-words">{e.content}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
