import { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: XCircle, warning: TriangleAlert, info: Info };
const tones = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200',
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  function remove(id) { setItems((current) => current.filter((item) => item.id !== id)); }
  function show(message, variant = 'info') {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { id, message, variant }].slice(-4));
    window.setTimeout(() => remove(id), 3200);
  }
  const value = useMemo(() => ({ show, success: (message) => show(message, 'success'), error: (message) => show(message, 'error'), warning: (message) => show(message, 'warning'), info: (message) => show(message, 'info') }), []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {items.map((item) => {
          const Icon = icons[item.variant] || Info;
          return (
            <div key={item.id} className={cn('pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-soft backdrop-blur', tones[item.variant] || tones.info)}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="min-w-0 flex-1 text-sm font-medium">{item.message}</p>
              <button type="button" onClick={() => remove(item.id)} className="rounded-full p-1 hover:bg-white/30"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
