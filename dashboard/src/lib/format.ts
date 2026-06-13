export const API = 'http://localhost:8000';

export function clock(d = new Date()): string {
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

export function dateLabel(d = new Date()): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function hhmmss(iso?: string): string {
  if (!iso) return '--:--:--';
  const t = iso.includes('T') ? iso.split('T')[1] : iso;
  return (t || '').slice(0, 8) || '--:--:--';
}

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.round(Math.abs(ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

export function num(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}
export function cpuColor(pct: number): string {
  if (pct >= 85) return '#ff3366';
  if (pct >= 60) return '#ffcc00';
  return '#00ff88';
}

export function healColor(seconds: number): string {
  if (seconds < 3) return '#00ff88';
  if (seconds <= 10) return '#ffcc00';
  return '#ff3366';
}

export function parseHealSeconds(v?: string | number): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const m = String(v).match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}