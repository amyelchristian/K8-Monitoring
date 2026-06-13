import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValueEvent } from 'framer-motion';

export function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '' }: {
  value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const sp = useSpring(0, { stiffness: 70, damping: 18, mass: 0.7 });
  const [txt, setTxt] = useState('0');
  useEffect(() => { sp.set(Number.isFinite(value) ? value : 0); }, [value, sp]);
  useMotionValueEvent(sp, 'change', (v) => setTxt(Number(v).toFixed(decimals)));
  return <span>{prefix}{txt}{suffix}</span>;
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
};

export function ArcGauge({ pct, color, size = 184, stroke = 13 }: {
  pct: number; color: string; size?: number; stroke?: number;
}) {
  const r = size / 2 - stroke;
  const cx = size / 2, cy = size / 2;
  const L = polar(cx, cy, r, 180), R = polar(cx, cy, r, 0);
  const d = `M ${L.x} ${L.y} A ${r} ${r} 0 0 1 ${R.x} ${R.y}`;
  const len = Math.PI * r;
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <svg viewBox={`0 0 ${size} ${size / 2 + stroke}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`ag-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d={d} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <motion.path d={d} stroke={`url(#ag-${color.replace('#', '')})`} strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={len} initial={{ strokeDashoffset: len }}
        animate={{ strokeDashoffset: len * (1 - clamped / 100) }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
    </svg>
  );
}

export function ProgressRing({ pct, color, size = 96, stroke = 8, children }: {
  pct: number; color: string; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 5px ${color}60)` }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Sparkline({ data, color, w = 88, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  const d = data.length ? data : [0, 0];
  const max = Math.max(...d, 1), min = Math.min(...d, 0);
  const x = (i: number) => (i / (d.length - 1 || 1)) * w;
  const y = (v: number) => h - ((v - min) / ((max - min) || 1)) * (h - 4) - 2;
  const line = d.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const id = `sp-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const TrendArrow = ({ up, good }: { up: boolean; good?: boolean }) => (
  <span style={{ color: (good ?? !up) ? '#00ff88' : '#ff3366' }}>{up ? '↑' : '↓'}</span>
);
