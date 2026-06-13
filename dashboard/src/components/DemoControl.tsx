import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Play, Square, Zap, Database, Network, RotateCcw, Rocket, Loader2 } from 'lucide-react';
import { API } from '../lib/format';
import type { SwarmData } from '../lib/useSwarmData';

interface SysStatus { backend: boolean; minikube: boolean; victim_app: boolean; pod_name: string; pipeline: boolean }

function StatusRow({ label, ok, value }: { label: string; ok: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between text-[12px] py-1">
      <span className="flex items-center gap-2 text-zinc-200">
        <span className="w-2 h-2 rounded-full" style={{ background: ok ? '#00ff88' : '#ff3366', boxShadow: `0 0 8px ${ok ? '#00ff88' : '#ff3366'}80` }} />
        {label}
      </span>
      <span className="mono text-[11px]" style={{ color: ok ? '#00ff88' : '#ff3366' }}>{value || (ok ? 'Running ✅' : 'Offline ✕')}</span>
    </div>
  );
}

export function DemoControl({ data, onClose }: { data: SwarmData; onClose: () => void }) {
  const [sys, setSys] = useState<SysStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');

  const refresh = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        fetch(`${API}/api/system/status`).then((r) => r.json()),
        fetch(`${API}/api/pipeline/status`).then((r) => r.json()),
      ]);
      setSys({ ...s, pipeline: p.running });
    } catch { setSys(null); }
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 3000); return () => clearInterval(i); }, [refresh]);

  const post = async (path: string, key: string, note: string) => {
    setBusy(key); setMsg('');
    try {
      const r = await fetch(`${API}${path}`, { method: 'POST' });
      const d = await r.json();
      setMsg(`${note}: ${d.status}`);
    } catch { setMsg(`${note}: failed — backend offline?`); }
    setBusy(null); refresh();
  };

  const chaos = async (type: 'cpu' | 'memory' | 'network', key: string) => {
    setBusy(key); setMsg('');
    try { await data.trigger(type); setMsg(`Injected ${type} fault — watch it heal!`); }
    catch { setMsg('Injection failed — backend offline?'); }
    setBusy(null);
  };

  const Btn = ({ id, onClick, icon: Icon, color, children, disabled }: { id: string; onClick: () => void; icon: React.ElementType; color: string; children: React.ReactNode; disabled?: boolean }) => (
    <button onClick={onClick} disabled={!!busy || disabled}
      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ borderColor: `${color}44`, background: `${color}12`, color }}>
      {busy === id ? <Loader2 className="w-4 h-4 spin" /> : <Icon className="w-4 h-4" />}{children}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
        <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,13,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(255,51,0,0.15), transparent)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flame-bg grid place-items-center"><Flame className="w-4.5 h-4.5 text-white" /></div>
              <div className="font-extrabold text-[15px] text-white">eBPF-Swarm Demo Control</div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">System Status</div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-line)' }}>
                <div className="flex items-center justify-between text-[12px] py-1">
                  <span className="flex items-center gap-2 text-zinc-200">
                    <span className="w-2 h-2 rounded-full" style={{ background: sys?.pipeline ? '#00ff88' : '#666' }} />
                    Pipeline (eBPF snitch)
                  </span>
                  <div className="flex gap-1.5">
                    <button onClick={() => post('/api/pipeline/start', 'pstart', 'Pipeline')} disabled={!!busy || sys?.pipeline}
                      className="flex items-center gap-1 text-[10px] mono px-2 py-1 rounded-md border border-ok/40 text-ok bg-ok/10 disabled:opacity-40">
                      {busy === 'pstart' ? <Loader2 className="w-3 h-3 spin" /> : <Play className="w-3 h-3" />} START
                    </button>
                    <button onClick={() => post('/api/pipeline/stop', 'pstop', 'Pipeline')} disabled={!!busy || !sys?.pipeline}
                      className="flex items-center gap-1 text-[10px] mono px-2 py-1 rounded-md border border-crit/40 text-crit bg-crit/10 disabled:opacity-40">
                      <Square className="w-3 h-3" /> STOP
                    </button>
                  </div>
                </div>
                <StatusRow label="Backend API" ok={!!sys?.backend} />
                <StatusRow label="Minikube" ok={!!sys?.minikube} />
                <StatusRow label="Victim App" ok={!!sys?.victim_app} value={sys?.victim_app ? (sys.pod_name || 'Running ✅') : undefined} />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">Inject Chaos</div>
              <div className="grid grid-cols-2 gap-2">
                <Btn id="cpu" onClick={() => chaos('cpu', 'cpu')} icon={Zap} color="#f97316">CPU Spike</Btn>
                <Btn id="mem" onClick={() => chaos('memory', 'mem')} icon={Database} color="#f59e0b">Memory Leak</Btn>
                <Btn id="net" onClick={() => chaos('network', 'net')} icon={Network} color="#8b5cf6">Network / LLM</Btn>
                <Btn id="reset" onClick={() => post('/api/chaos/reset', 'reset', 'Reset')} icon={RotateCcw} color="#00ccff">Reset All</Btn>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">Demo Script</div>
              <button onClick={() => post('/api/demo/run', 'demo', 'Auto-demo')} disabled={!!busy || data.simulating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl flame-bg text-white font-bold text-[13px] disabled:opacity-50"
                style={{ boxShadow: '0 8px 28px -8px rgba(255,51,0,0.4)' }}>
                {busy === 'demo' ? <Loader2 className="w-4 h-4 spin" /> : <Rocket className="w-4 h-4" />}
                Run Full Demo — auto CPU → Memory → Network
              </button>
              <div className="text-[10px] text-muted mt-1.5 text-center">Fires each fault and heals it, ~45s, hands-free.</div>
            </div>

            {msg && <div className="text-[11px] mono text-center rounded-lg py-2" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>{msg}</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
