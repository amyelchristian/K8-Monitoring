import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart3, ScrollText, Network, Bot, Settings, Flame, LogOut } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import { timeAgo } from '../lib/format';

export type PageId = 'dashboard' | 'analytics' | 'logs' | 'cluster' | 'agents' | 'settings';

const NAV: { id: PageId; label: string; icon: React.ElementType; key: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'D' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, key: 'A' },
  { id: 'logs', label: 'Logs', icon: ScrollText, key: 'L' },
  { id: 'cluster', label: 'Cluster Map', icon: Network, key: 'C' },
  { id: 'agents', label: 'Agents', icon: Bot, key: 'G' },
];

const dotFor = (type: string) =>
  type === 'healed' || type === 'verified' ? '#00ff88'
    : type === 'incident' || type === 'error' ? '#ff3366'
    : type === 'evaluation' ? '#cc00ff'
    : type === 'executing' || type === 'command_output' ? '#00ccff'
    : '#ffcc00';

export function Sidebar({ page, setPage, data }: { page: PageId; setPage: (p: PageId) => void; data: SwarmData }) {
  const live = [...data.events].slice(-5).reverse();
  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-full relative z-30" style={{ background: 'rgba(13,13,15,0.6)', borderRight: '1px solid var(--color-line)', backdropFilter: 'blur(20px)' }}>
      <div className="h-20 px-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] flame-bg grid place-items-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <div className="leading-none">
          <div className="font-extrabold text-[16px] tracking-tight text-white">eBPF-Swarm</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 px-4 py-2 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted font-bold px-2 mb-3">Overview</div>
          <nav className="flex flex-col gap-1.5">
            {NAV.map(({ id, label, icon: Icon, key }) => {
              const active = page === id;
              return (
                <button key={id} onClick={() => setPage(id)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group ${active ? 'flame-bg text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'}`}>
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-white' : 'text-muted group-hover:text-white'}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {!active && <kbd className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] mono text-muted border border-line rounded px-1">{key}</kbd>}
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted font-bold px-2 mb-3">Live Events</div>
          <div className="flex-1 flex flex-col gap-1 pr-1">
            {live.length === 0 && <div className="text-[11px] text-muted/50 px-2 mono">idle…</div>}
            {live.map((e) => (
              <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-line" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: dotFor(e.type), boxShadow: `0 0 4px ${dotFor(e.type)}80` }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-zinc-200 truncate leading-tight">{e.content}</div>
                  <div className="text-[10px] text-muted mono mt-0.5">{timeAgo(e.timestamp)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-line mt-auto flex flex-col gap-1">
        <button onClick={() => setPage('settings')} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group ${page === 'settings' ? 'flame-bg text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'}`}>
          <Settings className={`w-[18px] h-[18px] shrink-0 transition-colors ${page === 'settings' ? 'text-white' : 'text-muted group-hover:text-white'}`} />
          <span className="flex-1 text-left">Settings</span>
          {page === 'settings' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />}
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-muted hover:text-crit transition-colors group">
          <LogOut className="w-[18px] h-[18px] shrink-0 text-muted group-hover:text-crit" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </aside>
  );
}
