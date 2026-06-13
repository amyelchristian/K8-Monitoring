import { AnimatePresence, motion } from 'framer-motion';
import type { Toast } from '../lib/types';

const border: Record<Toast['kind'], string> = {
  crit: 'rgba(255,51,102,0.5)', fast: 'rgba(0,204,255,0.5)', ok: 'rgba(0,255,136,0.5)',
  warn: 'rgba(255,204,0,0.5)', llm: 'rgba(204,0,255,0.5)',
};

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-[300px]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={() => dismiss(t.id)}
            className="glass rounded-xl px-3.5 py-3 flex items-center gap-3 cursor-pointer"
            style={{ border: `1px solid ${border[t.kind]}` }}>
            <span className="text-lg">{t.icon}</span>
            <span className="text-[12px] text-zinc-200 leading-snug">{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}