import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Zap, Check } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
export function PresentationMode({ data, onClose }: { data: SwarmData; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const healBaseline = useRef(data.heals.length);

  const hasIncident = useMemo(() => data.events.some((e) => e.type === 'incident'), [data.events]);
  const healed = data.heals.length > healBaseline.current;
  const lastHeal = data.heals[data.heals.length - 1];
  useEffect(() => { if (step === 1 && hasIncident) setStep(2); }, [step, hasIncident]);
  useEffect(() => { if ((step === 2 || step === 3) && healed) setStep(4); }, [step, healed]);

  const inject = () => { healBaseline.current = data.heals.length; data.trigger('cpu'); };

  const steps = [
    { n: 'This is our victim app — currently healthy.', sub: 'A normal Kubernetes pod, CPU near idle. Watch the Pod Health card.', action: <NextBtn onClick={() => setStep(1)} /> },
    { n: 'Watch what happens when CPU spikes…', sub: 'Click to inject a real CPU fault into the pod.', action: <button onClick={inject} className="flex items-center gap-2 px-4 py-2 rounded-lg flame-bg text-white font-bold text-[12px] shadow-md hover:opacity-90"><Zap className="w-4 h-4" /> Inject CPU Spike</button> },
    { n: 'eBPF detected it in seconds!', sub: 'The snitch caught the spike BEFORE a crash — see the Live Alert Feed light up.', action: <NextBtn onClick={() => setStep(3)} /> },
    { n: 'The AI Swarm is healing it automatically…', sub: 'Planner → Evaluator → Executor decide and act. No human in the loop.', action: <span className="text-[11px] mono text-muted flex items-center gap-1.5"><span className="dots" style={{ color: '#ff3300' }}><span /><span /><span /></span> waiting for heal…</span> },
    { n: lastHeal ? `Pod healed in ${lastHeal.seconds}s — before it ever crashed.` : 'Pod healed — before it ever crashed.', sub: 'Proactive, autonomous recovery. That’s eBPF-Swarm.', action: <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ok/10 border border-ok/40 text-ok font-bold text-[12px]"><Check className="w-4 h-4" /> Finish</button> },
  ];
  const cur = steps[step];

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-end justify-center pb-8 px-4">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="pointer-events-auto w-full max-w-[560px] rounded-2xl p-5"
          style={{ background: 'rgba(13,13,15,0.96)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 70px -16px rgba(0,0,0,0.8)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="chip" style={{ color: '#ff3300', background: 'rgba(255,51,0,0.1)', border: '1px solid rgba(255,51,0,0.3)' }}>Step {step + 1} / {steps.length}</span>
            <button onClick={onClose} className="text-muted hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-[17px] font-extrabold leading-snug text-white">{cur.n}</div>
          <div className="text-[12px] text-muted mt-1.5">{cur.sub}</div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i <= step ? '#ff3300' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            {cur.action}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const NextBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line bg-white/5 text-zinc-200 hover:border-flame shadow-sm font-semibold text-[12px]">
    Next <ArrowRight className="w-3.5 h-3.5" />
  </button>
);
