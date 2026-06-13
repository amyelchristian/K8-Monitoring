import { useEffect, useState } from 'react';
import { useSwarmData } from './lib/useSwarmData';
import { TopNav } from './components/TopNav';
import { Sidebar, type PageId } from './components/Sidebar';
import { Toasts } from './components/Toasts';
import { DemoControl } from './components/DemoControl';
import { PresentationMode } from './components/PresentationMode';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LogsPage } from './pages/LogsPage';
import { ClusterMapPage } from './pages/ClusterMapPage';
import { AgentsPage } from './pages/AgentsPage';
import { SettingsPage } from './pages/SettingsPage';

const KEYS: Record<string, PageId> = { d: 'dashboard', a: 'analytics', l: 'logs', c: 'cluster', g: 'agents', s: 'settings' };

export default function App() {
  const data = useSwarmData();
  const [page, setPage] = useState<PageId>('dashboard');
  const [showDemo, setShowDemo] = useState(false);
  const [showPresent, setShowPresent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); if (!data.simulating) data.trigger('cpu'); return; }
      const p = KEYS[e.key.toLowerCase()];
      if (p) setPage(p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data]);

  return (
    <div className="h-full flex bg-[#050505] text-white font-sans overflow-hidden app-glow">
      <Sidebar page={page} setPage={setPage} data={data} />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopNav data={data} onDemoControl={() => setShowDemo(true)} onPresent={() => setShowPresent(true)} />

        <main className="flex-1 min-w-0 overflow-y-auto px-8 py-8">
          <div className="max-w-[1600px] mx-auto h-full">
            {page === 'dashboard' && <DashboardPage data={data} onNavigate={setPage} />}
            {page === 'analytics' && <AnalyticsPage data={data} />}
            {page === 'logs' && <LogsPage data={data} />}
            {page === 'cluster' && <ClusterMapPage data={data} />}
            {page === 'agents' && <AgentsPage data={data} />}
            {page === 'settings' && <SettingsPage data={data} />}
          </div>
        </main>
      </div>

      <Toasts toasts={data.toasts} dismiss={data.dismissToast} />
      {showDemo && <DemoControl data={data} onClose={() => setShowDemo(false)} />}
      {showPresent && <PresentationMode data={data} onClose={() => setShowPresent(false)} />}
    </div>
  );
}
