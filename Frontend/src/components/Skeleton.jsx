export function CardSkeleton() {
  return <div className="card animate-pulse p-6"><div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="mt-4 h-8 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="mt-4 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800" /></div>;
}

export function TableSkeleton({ rows = 5 }) {
  return <div className="card overflow-hidden"><div className="table-head h-12" />{Array.from({ length: rows }).map((_, index) => <div key={index} className="grid grid-cols-4 gap-4 border-b border-soft p-5"><span className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" /><span className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" /><span className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" /><span className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" /></div>)}</div>;
}

export function LoadingSpinner() {
  return <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600 dark:border-cyan-500/20 dark:border-t-cyan-300" />;
}
