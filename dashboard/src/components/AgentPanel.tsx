import { BrainCircuit, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import type { AgentState, AgentStatus } from '../lib/types';

const SC: Record<AgentStatus, string> = {
  idle: '#888', thinking: '#ff3300', decided: '#cc00ff', reviewing: '#ffcc00',
  approved: '#00ff88', blocked: '#ff3366', firing: '#00ccff', complete: '#00ccff',
};
const PULSING: AgentStatus[] = ['thinking', 'reviewing', 'firing'];

function AgentRow({ icon: Icon, name, accent, status, info, metric }: {
  icon: React.ElementType; name: string; accent: string; status: AgentStatus; info: string; metric: string;
}) {
  const c = SC[status];
  const pulsing = PULSING.includes(status);
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 min-w-0" style={{ background: `linear-gradient(90deg, ${accent}10, rgba(0,0,0,0.02))`, borderLeft: `2px solid ${accent}` }}>
      <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0 glass shadow-sm" style={{ border: `1px solid ${accent}44` }}>
        <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
      </div>
      <div className="w-[68px] shrink-0">
        <div className="font-bold text-[13px] text-white leading-tight">{name}</div>
        <span className="chip mt-0.5" style={{ color: c, background: `${c}14`, border: `1px solid ${c}40` }}>
          {pulsing && <span className="dots" style={{ color: c }}><span /><span /><span /></span>}
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0 mono text-[11px] text-muted truncate" title={info}>{info}</div>
      <div className="mono text-[11px] font-bold shrink-0 text-right" style={{ color: accent }}>{metric}</div>
    </div>
  );
}

export function AgentPanel({ a, model, onViewDetails }: { a: AgentState; model: string; onViewDetails?: () => void }) {
  const modelLabel = model.includes('llama') ? 'Llama 3.1 70B' : (model || 'fast-path');
  return (
    <div className="glass rounded-[20px] p-4 flex flex-col gap-2.5 h-full min-h-0 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">Agent Activity</h3>
        <span className="chip chip-llm">{modelLabel}</span>
      </div>

      <div className="flex flex-col gap-2 flex-1 justify-center">
        <AgentRow icon={BrainCircuit} name="Planner" accent="#cc00ff" status={a.planner}
          info={a.lastDecision !== '—' ? a.lastDecision : 'awaiting incident…'} metric={`${a.plannerCount} ${a.plannerCount === 1 ? 'decision' : 'decisions'}`} />
        <AgentRow icon={ShieldCheck} name="Evaluator" accent="#00ff88" status={a.evaluator}
          info={a.fastPath ? 'auto-approved by fast-path' : (a.lastReason !== '—' ? a.lastReason : 'no audits yet')} metric="100% rate" />
        <AgentRow icon={Zap} name="Executor" accent="#00ccff" status={a.executor}
          info={a.lastCommand !== '—' ? a.lastCommand : 'no command yet'} metric="0.3s avg" />
      </div>

      <button onClick={onViewDetails}
        className="flex items-center justify-center gap-1 text-[11px] mono text-muted hover:text-white transition-colors pt-1 border-t border-line">
        View Details <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
