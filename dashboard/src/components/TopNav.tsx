import { Search, Download, ShieldCheck, Zap, HeartPulse, Rocket, Presentation, User } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';

export function TopNav({ data, onDemoControl, onPresent }: { data: SwarmData; onDemoControl: () => void; onPresent: () => void; onSettings?: () => void }) {
  const s = data.stats;

  const exportCsv = () => {
    const rows = [['time', 'pod', 'heal_seconds', 'metric'], ...data.heals.map((h) => [h.time, h.pod, String(h.seconds), h.metric])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ebpf-swarm-heals.csv'; a.click();
  };

  return (
    <header className="relative z-20 shrink-0 h-20 px-8 flex items-center justify-between gap-6 bg-transparent">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="w-[18px] h-[18px] text-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search agents, pods, or metrics..."
            className="w-full bg-black/40 border border-line rounded-full h-11 pl-11 pr-4 text-[13px] font-medium text-white placeholder:text-muted/60 focus:outline-none focus:border-flame/40 transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="hidden xl:flex items-center gap-4 mr-4 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-[18px] h-[18px] text-ok" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold leading-none">{s.incidentsPrevented}</span>
              <span className="text-[9px] uppercase text-muted tracking-wider leading-tight">Prevented</span>
            </div>
          </div>
          <div className="w-px h-6 bg-line" />
          <div className="flex items-center gap-2">
            <Zap className="w-[18px] h-[18px] text-fast" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold leading-none">{s.avgHealTime ? `${s.avgHealTime.toFixed(1)}s` : '—'}</span>
              <span className="text-[9px] uppercase text-muted tracking-wider leading-tight">Avg Heal</span>
            </div>
          </div>
          <div className="w-px h-6 bg-line" />
          <div className="flex items-center gap-2">
            <HeartPulse className="w-[18px] h-[18px] text-ok" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold leading-none">{s.uptime}%</span>
              <span className="text-[9px] uppercase text-muted tracking-wider leading-tight">Uptime</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPresent} title="Presentation mode" className="w-10 h-10 rounded-full border border-line grid place-items-center text-muted hover:text-white hover:bg-white/5 transition-colors" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Presentation className="w-4 h-4" />
          </button>
          <button onClick={exportCsv} title="Export CSV" className="w-10 h-10 rounded-full border border-line grid place-items-center text-muted hover:text-white hover:bg-white/5 transition-colors" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onDemoControl} title="Demo control" className="h-10 px-4 rounded-full flame-bg text-white text-[13px] font-bold flex items-center gap-2 transition-colors" style={{ boxShadow: '0 0 20px rgba(255,51,0,0.3)' }}>
            <Rocket className="w-4 h-4" /> Demo
          </button>
        </div>

        <div className="w-px h-8 bg-line" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-line grid place-items-center overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <User className="w-5 h-5 text-muted" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-[13px] font-bold leading-tight text-white">System Admin</div>
            <div className="text-[10px] text-muted mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: data.connected ? '#00ff88' : '#444', boxShadow: data.connected ? '0 0 4px #00ff88' : 'none' }} />
              {data.connected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
