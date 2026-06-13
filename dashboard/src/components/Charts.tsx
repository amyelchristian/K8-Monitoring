import {
  Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { Heal, Series } from '../lib/types';
import { healColor } from '../lib/format';

const tip = {
  contentStyle: { background: 'rgba(13,13,15,0.9)', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#888' }, itemStyle: { color: '#fff' },
};

function Frame({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[20px] p-4 flex flex-col shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}60` }} />
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">{title}</h3>
      </div>
      <div className="h-[150px]">{children}</div>
    </div>
  );
}

export function TimeAreaChart({ title, data, accent, threshold }: { title: string; data: Series[]; accent: string; threshold?: boolean }) {
  const d = data.map((p, i) => ({ i, v: Math.round(p.v * 10) / 10 }));
  const id = `g-${accent.replace('#', '')}`;
  return (
    <Frame title={title} accent={accent}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={d} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} width={28} />
          {threshold && <ReferenceLine y={60} stroke="#ffcc00" strokeDasharray="4 4" strokeOpacity={0.6} />}
          {threshold && <ReferenceLine y={85} stroke="#ff3366" strokeDasharray="4 4" strokeOpacity={0.6} />}
          <Tooltip {...tip} formatter={(v) => [`${v}%`, title]} labelFormatter={() => ''} />
          <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function HealTimeChart({ heals }: { heals: Heal[] }) {
  const d = heals.map((h, i) => ({ i: i + 1, v: h.seconds, time: h.time }));
  const avg = d.length ? d.reduce((s, x) => s + x.v, 0) / d.length : 0;
  return (
    <Frame title="Heal Time History" accent="#cc00ff">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={d} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <XAxis dataKey="i" tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} width={28} />
          {avg > 0 && <ReferenceLine y={avg} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}s`, fontSize: 9, fill: '#888', position: 'insideTopRight' }} />}
          <Tooltip {...tip} formatter={(v) => [`${v}s`, 'heal']} labelFormatter={(l) => `heal #${l}`} />
          <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {d.map((x, i) => <Cell key={i} fill={healColor(x.v)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}
