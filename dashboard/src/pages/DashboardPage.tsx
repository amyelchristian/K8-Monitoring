import { Cpu, Database, Network, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import { PodHealthCard } from '../components/PodHealthCard';
import { PipelineVisualizer } from '../components/PipelineVisualizer';
import { AgentPanel } from '../components/AgentPanel';
import { AlertFeed } from '../components/AlertFeed';
import { TimeAreaChart, HealTimeChart } from '../components/Charts';

const CHAOS = [
  { type: 'cpu' as const, label: 'CPU Spike', icon: Cpu, color: '#ff6600', text: 'Simulate CPU overload in random pod' },
  { type: 'memory' as const, label: 'Memory Leak', icon: Database, color: '#ffcc00', text: 'Inject memory leak to trigger OOMKill' },
  { type: 'network' as const, label: 'Network Delay', icon: Network, color: '#cc00ff', text: 'Add artificial latency to network calls' },
];

export function DashboardPage({ data, onNavigate }: { data: SwarmData; onNavigate?: (p: 'agents' | 'cluster') => void }) {
  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-full pb-8">
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        <div className="relative rounded-[24px] p-8 overflow-hidden shadow-2xl flex flex-col justify-center min-h-[220px] glass">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-flame rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-flame rounded-full blur-[100px] opacity-[0.08] pointer-events-none"></div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-zinc-300 text-[11px] uppercase tracking-widest font-bold mb-4 backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-ok animate-pulse" style={{ boxShadow: '0 0 8px #00ff8880' }}></span> Live System Control
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight leading-tight">
              Maintain Uptime with <br /> <span className="flame-text">Autonomous AI Agents</span>
            </h1>
            <p className="text-zinc-400 text-[14px] leading-relaxed mb-6 max-w-md font-medium">
              eBPF-Swarm monitors your clusters in real-time. It detects anomalies, hypothesizes root causes, and automatically applies healing actions without human intervention.
            </p>
            <button onClick={() => onNavigate?.('cluster')} className="h-11 px-6 flame-bg text-white font-bold rounded-full text-[14px] hover:opacity-90 transition-opacity inline-flex items-center gap-2 group w-fit shrink-0 shadow-[0_8px_20px_-6px_rgba(255,51,0,0.5)]">
              View Active Clusters <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        <div className="flex flex-col xl:flex-row gap-4 items-stretch">
          <div className="w-full xl:w-[320px] shrink-0">
            <PodHealthCard m={data.metrics} />
          </div>
          <div className="flex-1 flex gap-3 overflow-x-auto pb-2 scrollbar-none min-w-0">
            {CHAOS.map(({ type, label, icon: Icon, color, text }) => (
              <button key={type} onClick={() => data.trigger(type)} disabled={data.simulating}
                className="flex-1 min-w-[200px] flex flex-col justify-center gap-3 p-4 rounded-[20px] border border-line hover:border-flame hover:bg-white/5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group relative overflow-hidden"
                style={{ background: 'rgba(13,13,15,0.6)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  {data.simulating ? <Loader2 className="w-4 h-4 spin text-muted" /> : <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><ArrowRight className="w-3 h-3 text-muted group-hover:text-white" /></div>}
                </div>
                <div>
                  <div className="font-bold text-[14px] text-white mb-1">{label}</div>
                  <div className="text-[11px] text-muted leading-tight">{text}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-flame" /> Live Healing Pipeline
            </h2>
            <PipelineVisualizer data={data} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-white">Recent Alerts</h2>
              <button className="text-[13px] font-semibold text-flame hover:text-flame-2 transition-colors">See all</button>
            </div>
            <div className="glass rounded-[20px] overflow-hidden shadow-sm">
              <AlertFeed events={data.events} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-white">Statistics</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="glass rounded-[20px] p-5 shadow-sm">
              <TimeAreaChart title="CPU Usage" data={data.cpuHistory} accent="#ff3366" threshold />
            </div>
            <div className="glass rounded-[20px] p-5 shadow-sm">
              <TimeAreaChart title="Memory Usage" data={data.memHistory} accent="#ffcc00" threshold />
            </div>
            <div className="glass rounded-[20px] p-5 shadow-sm">
              <HealTimeChart heals={data.heals} />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-white">Active Agents</h2>
            <button className="w-6 h-6 rounded-full border border-line flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-colors">+</button>
          </div>
          <div className="glass rounded-[20px] overflow-hidden shadow-sm flex-1 min-h-[300px]">
            <AgentPanel a={data.agents} model={data.aiConfig?.model || ''} onViewDetails={() => onNavigate?.('agents')} />
          </div>
        </div>

      </div>
    </div>
  );
}
