import { useEffect, useState } from 'react';
import { Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import { API, num } from '../lib/format';

function Slider({ label, value, set, min, max, suffix = '%' }: { label: string; value: number; set: (n: number) => void; min: number; max: number; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[12px]"><span className="text-zinc-300">{label}</span><span className="mono font-bold flame-text">{value}{suffix}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)}
        className="w-full accent-[#ff6600]" style={{ accentColor: '#ff6600' }} />
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (b: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} className="flex items-center justify-between w-full text-[12px] text-zinc-300">
      <span>{label}</span>
      <span className="w-10 h-5 rounded-full p-0.5 transition-colors" style={{ background: on ? 'linear-gradient(90deg,#ff3300,#ff6600)' : '#26262a' }}>
        <span className="block w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(20px)' : 'none' }} />
      </span>
    </button>
  );
}

type SaveState = 'idle' | 'saving' | 'ok' | 'err';

export function SettingsPage({ data }: { data: SwarmData }) {
  const [cpuWarn, setCpuWarn] = useState(60);
  const [cpuCrit, setCpuCrit] = useState(85);
  const [memWarn, setMemWarn] = useState(60);
  const [memCrit, setMemCrit] = useState(85);
  const [cooldown, setCooldown] = useState(120);
  const [llmTimeout, setLlmTimeout] = useState(20);
  const [model, setModel] = useState(data.aiConfig?.model || 'meta/llama-3.1-70b-instruct');
  const [sound, setSound] = useState(false);
  const [autoscroll, setAutoscroll] = useState(true);
  const [refresh, setRefresh] = useState(1);
  const [state, setState] = useState<SaveState>('idle');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/settings`);
        if (!r.ok) return;
        const c = await r.json();
        if (!alive) return;
        if (typeof c.cpu_warning === 'number') setCpuWarn(c.cpu_warning);
        if (typeof c.cpu_critical === 'number') setCpuCrit(c.cpu_critical);
        if (typeof c.memory_warning === 'number') setMemWarn(c.memory_warning);
        if (typeof c.memory_critical === 'number') setMemCrit(c.memory_critical);
        if (typeof c.cooldown === 'number') setCooldown(c.cooldown);
        if (typeof c.llm_timeout === 'number') setLlmTimeout(c.llm_timeout);
        if (typeof c.llm_model === 'string') setModel(c.llm_model);
        if (typeof c.sound_notifications === 'boolean') setSound(c.sound_notifications);
        if (typeof c.auto_scroll === 'boolean') setAutoscroll(c.auto_scroll);
        if (typeof c.refresh_rate === 'number') setRefresh(c.refresh_rate);
      } catch { /* backend offline — keep defaults */ }
    })();
    return () => { alive = false; };
  }, []);

  const save = async () => {
    setState('saving');
    try {
      const r = await fetch(`${API}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpu_warning: cpuWarn, cpu_critical: cpuCrit,
          memory_warning: memWarn, memory_critical: memCrit,
          cooldown, llm_timeout: llmTimeout, llm_model: model,
          sound_notifications: sound, auto_scroll: autoscroll, refresh_rate: refresh,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      setState(d.applied ? 'ok' : 'err');
    } catch {
      setState('err');
    }
    setTimeout(() => setState('idle'), 4000);
  };
  const cpu = data.metrics.cpu || 0;
  const band = cpu >= cpuCrit ? 'critical' : cpu >= cpuWarn ? 'warning' : 'ok';
  const bandColor = band === 'critical' ? '#ff3366' : band === 'warning' ? '#ffcc00' : '#00ff88';
  const bandText = band === 'critical' ? '⚡ would trigger CRITICAL NOW → heal' : band === 'warning' ? '⚡ would trigger WARNING NOW' : 'below warning — healthy';

  return (
    <div className="flex flex-col gap-4 pb-6 max-w-[760px]">
      <h2 className="text-lg font-bold flame-text">Settings</h2>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">Thresholds</h3>
        <Slider label="CPU warning" value={cpuWarn} set={setCpuWarn} min={10} max={95} />
        <Slider label="CPU critical" value={cpuCrit} set={setCpuCrit} min={20} max={100} />
        <Slider label="Memory warning" value={memWarn} set={setMemWarn} min={10} max={95} />
        <Slider label="Memory critical" value={memCrit} set={setMemCrit} min={20} max={100} />
        <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted mb-2">
            <span>Live preview · current pod CPU</span>
            <span className="mono" style={{ color: bandColor }}>{num(cpu)}% — {bandText}</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: '#000' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(cpu, 100)}%`, background: bandColor, boxShadow: `0 0 10px ${bandColor}99` }} />
            <span className="absolute top-0 bottom-0 w-0.5" style={{ left: `${cpuWarn}%`, background: '#ffcc00' }} title={`warning ${cpuWarn}%`} />
            <span className="absolute top-0 bottom-0 w-0.5" style={{ left: `${cpuCrit}%`, background: '#ff3366' }} title={`critical ${cpuCrit}%`} />
          </div>
          <div className="flex justify-between text-[9px] mono text-muted mt-1.5">
            <span>0%</span>
            <span style={{ color: '#ffcc00' }}>▲ warn {cpuWarn}%</span>
            <span style={{ color: '#ff3366' }}>▲ crit {cpuCrit}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">Swarm</h3>
          <Slider label="Cooldown" value={cooldown} set={setCooldown} min={0} max={300} suffix="s" />
          <Slider label="LLM timeout" value={llmTimeout} set={setLlmTimeout} min={5} max={60} suffix="s" />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] text-zinc-300">LLM model</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="bg-black/40 border border-line rounded-lg px-3 py-2 text-[12px] outline-none focus:border-flame/40">
              <option value="meta/llama-3.1-70b-instruct">Llama 3.1 70B</option>
              <option value="nvidia/nemotron-3-ultra-550b-a55b">Nemotron Ultra</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">Interface</h3>
          <Toggle label="Sound notifications" on={sound} set={setSound} />
          <Toggle label="Auto-scroll feeds" on={autoscroll} set={setAutoscroll} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] text-zinc-300">Refresh rate</span>
            <div className="flex gap-2">
              {[1, 2, 5].map((r) => (
                <button key={r} onClick={() => setRefresh(r)} className={`px-3 py-1.5 rounded-lg text-[11px] mono ${refresh === r ? 'flame-bg text-white' : 'border border-line text-muted'}`}>{r}s</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={save} disabled={state === 'saving'} className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl flame-bg text-white font-semibold text-[13px] shadow-lg disabled:opacity-60" style={{ boxShadow: '0 8px 28px -8px rgba(255,51,0,0.6)' }}>
          {state === 'saving' ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}
          {state === 'saving' ? 'Saving…' : 'Save Settings'}
        </button>
        {state === 'ok' && <span className="flex items-center gap-1.5 text-[12px] text-ok"><CheckCircle2 className="w-4 h-4" /> Settings saved and applied to running system</span>}
        {state === 'err' && <span className="flex items-center gap-1.5 text-[12px] text-crit"><XCircle className="w-4 h-4" /> Failed to save — is the backend running?</span>}
      </div>
      <p className="text-[10px] text-muted/70">
        Written to <span className="mono">config.json</span> (read live by the swarm) and <span className="mono">.env</span> (model/timeout).
        Thresholds are <span className="mono">minikube cp</span>’d into the node so the snitch re-tunes within ~10s — no restart.
      </p>
    </div>
  );
}
