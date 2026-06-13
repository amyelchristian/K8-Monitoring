import { motion } from 'framer-motion';
import { Server } from 'lucide-react';
import { cpuColor, num } from '../lib/format';
import type { PodMetrics } from '../lib/types';

function Bar({ label, pct, valueLabel, color, markers = true }: { label: string; pct: number; valueLabel: string; color: string; markers?: boolean }) {
  const w = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] mono">
        <span className="text-muted uppercase tracking-wider">{label}</span>
        <span className="font-bold" style={{ color: pct >= 60 ? color : '#888' }}>{valueLabel}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={false} animate={{ width: `${w}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        {markers && (
          <>
            <span className="absolute top-0 bottom-0 w-px bg-amber-500/60" style={{ left: '60%' }} />
            <span className="absolute top-0 bottom-0 w-px bg-red-500/70" style={{ left: '85%' }} />
          </>
        )}
      </div>
    </div>
  );
}

export function PodHealthCard({ m }: { m: PodMetrics }) {
  const cpu = m.cpu || 0;
  const memPct = ((m.memory || 0) / 256) * 100;
  const critical = cpu >= 85;
  const warn = cpu >= 60 || memPct >= 60;
  const running = !!m.pod_name && m.pod_name !== 'unknown';

  return (
    <div className={`glass ${critical ? 'glass-flame' : ''} ${critical ? 'pulse-crit' : warn ? 'pulse-warn' : ''} rounded-[20px] p-5 w-full h-full flex flex-col justify-center shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="w-5 h-5 text-muted shrink-0" />
          <span className="mono text-[14px] font-bold text-white truncate">{m.pod_name || 'unknown'}</span>
        </div>
        <span className={`chip ${running ? 'chip-ok' : 'chip-mut'}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: running ? '#00ff88' : '#444' }} />
          {running ? 'Running' : 'Offline'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <Bar label="CPU Limit" pct={cpu} valueLabel={`${num(cpu)}%`} color={cpuColor(cpu)} />
        <Bar label="Memory" pct={memPct} valueLabel={`${Math.round(m.memory || 0)}Mi / 256Mi`} color={memPct >= 85 ? '#ff3366' : memPct >= 60 ? '#ffcc00' : '#00ccff'} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-line">
        {[['Restarts', String(m.restarts ?? 0)], ['Namespace', 'default'], ['Limit', '500m']].map(([k, v]) => (
          <div key={k}>
            <div className="text-[9px] uppercase tracking-wider text-muted">{k}</div>
            <div className="mono text-[13px] font-bold text-white">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
