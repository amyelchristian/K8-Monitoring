import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Search, ArrowDown } from 'lucide-react';
import type { SwarmData } from '../lib/useSwarmData';
import { hhmmss } from '../lib/format';
import type { SwarmEvent } from '../lib/types';

function JsonLine({ obj }: { obj: Record<string, unknown> }) {
  return (
    <span>
      <span className="text-zinc-600">{'{'}</span>
      {Object.entries(obj).map(([k, v], i, arr) => (
        <span key={k}>
          <span className="text-flame">"{k}"</span><span className="text-zinc-600">: </span>
          <span className={typeof v === 'number' ? 'text-fast' : typeof v === 'boolean' ? 'text-llm' : 'text-zinc-200'}>
            {typeof v === 'string' ? `"${v}"` : String(v)}
          </span>{i < arr.length - 1 && <span className="text-zinc-600">, </span>}
        </span>
      ))}
      <span className="text-zinc-600">{'}'}</span>
    </span>
  );
}

function Panel({ title, lines, accent, render }: { title: string; lines: unknown[]; accent: string; render: (x: unknown) => React.ReactNode }) {
  const [q, setQ] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [live, setLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  const filtered = useMemo(
    () => lines.filter((l) => !q || JSON.stringify(l).toLowerCase().includes(q.toLowerCase())),
    [lines, q],
  );

  useEffect(() => {
    if (filtered.length > prevLen.current) {
      setLive(true);
      if (autoScroll && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      const t = setTimeout(() => setLive(false), 2000);
      prevLen.current = filtered.length;
      return () => clearTimeout(t);
    }
    prevLen.current = filtered.length;
  }, [filtered.length, autoScroll]);

  const download = () => {
    const blob = new Blob([lines.map((l) => JSON.stringify(l)).join('\n')], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title.replace(/\W/g, '_')}.log`; a.click();
  };

  return (
    <div className="glass rounded-2xl p-3 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2 text-[12px] mono font-semibold" style={{ color: accent }}>
          <span className={`w-2 h-2 rounded-full ${live ? 'blink' : ''}`} style={{ background: live ? accent : '#3a3a3e', boxShadow: live ? `0 0 8px ${accent}` : 'none' }} />
          {title}
          <span className="chip" style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}40` }}>
            {filtered.length} {filtered.length === 1 ? 'line' : 'lines'}
          </span>
          {live && <span className="chip" style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}40` }}>● LIVE</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoScroll((v) => !v)}
            className={`flex items-center gap-1 text-[10px] mono px-2 py-1 rounded-md border transition-colors ${autoScroll ? 'text-ok border-ok/40 bg-ok/10' : 'text-muted border-line hover:text-zinc-200'}`}>
            <ArrowDown className="w-3 h-3" /> Auto-scroll
          </button>
          <div className="relative">
            <Search className="w-3 h-3 text-muted absolute left-2 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search"
              className="bg-black/40 border border-line rounded pl-6 pr-2 py-1 text-[10px] outline-none focus:border-flame/40 w-28" />
          </div>
          <button onClick={download} className="text-muted hover:text-white"><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto log-scroll rounded-lg bg-black/50 border border-line p-2 mono text-[13px] leading-relaxed min-h-0">
        {filtered.length === 0 && <div className="text-muted/40 p-2">— empty —</div>}
        {filtered.map((l, i) => (
          <div key={i} className="flex gap-3 hover:bg-white/5 px-1 rounded whitespace-nowrap">
            <span className="text-zinc-700 select-none w-8 text-right shrink-0">{i + 1}</span>
            <span>{render(l)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogsPage({ data }: { data: SwarmData }) {
  const diagnoses = useMemo(() => data.events.filter((e) => e.type === 'incident').map((e) => ({
    metric: e.metric, pod: e.pod, severity: e.severity || 'critical', timestamp: e.timestamp,
  })), [data.events]);

  return (
    <div className="flex flex-col gap-3 min-h-0" style={{ height: 'calc(100vh - 104px)' }}>
      <h2 className="text-lg font-bold flame-text shrink-0">Logs</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <Panel title="diagnoses.log" lines={diagnoses} accent="#ff6600" render={(l) => <JsonLine obj={l as Record<string, unknown>} />} />
        <Panel title="swarm_output.log" lines={data.events} accent="#00ccff" render={(l) => {
          const e = l as SwarmEvent;
          return <span><span className="text-warn">[{hhmmss(e.timestamp)}]</span> <span className="text-llm">[{e.agent}]</span> <span className="text-zinc-300">{e.content}</span></span>;
        }} />
      </div>
    </div>
  );
}
