import { motion } from 'framer-motion';
import { Trophy, CheckCircle2 } from 'lucide-react';
import type { Heal } from '../lib/types';

const PHASES = [
  { label: 'Alert', color: '#ff3366' },
  { label: 'Diagnosed', color: '#ffcc00' },
  { label: 'Decided', color: '#cc00ff' },
  { label: 'Executed', color: '#00ccff' },
];

export function HealingTimeline({ heals }: { heals: Heal[] }) {
  const last5 = heals.slice(-5).reverse();
  const fastest = heals.length ? Math.min(...heals.map((h) => h.seconds)) : 0;

  return (
    <div className="glass rounded-[20px] p-4 shadow-sm">
      <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-3">Healing Timeline</h3>
      {last5.length === 0 ? (
        <div className="text-[11px] text-muted/50 mono py-6 text-center">no heals yet — trigger a fault to record one</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {last5.map((h) => {
            const isFastest = h.seconds === fastest;
            const weights = [0.34, 0.18, 0.06, 0.42];
            return (
              <div key={h.id} className="flex items-center gap-3">
                <div className="w-16 shrink-0 mono text-[10px] text-muted tabular-nums">{h.time}</div>
                <div className="flex-1 flex items-stretch gap-1 h-7">
                  {PHASES.map((p, i) => (
                    <motion.div key={p.label} initial={{ width: 0 }} animate={{ width: `${weights[i] * 100}%` }} transition={{ delay: i * 0.05 }}
                      className="rounded-md grid place-items-center text-[8px] font-bold uppercase tracking-wider overflow-hidden whitespace-nowrap"
                      style={{ background: `${p.color}15`, border: `1px solid ${p.color}40`, color: p.color }}>
                      {p.label}
                    </motion.div>
                  ))}
                  <div className="rounded-md grid place-items-center px-2 shrink-0" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
                  </div>
                </div>
                <div className="w-16 shrink-0 flex items-center justify-end gap-1.5">
                  {isFastest && <Trophy className="w-3.5 h-3.5 text-warn" />}
                  <span className="mono text-[12px] font-bold text-ok">{h.seconds}s</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
