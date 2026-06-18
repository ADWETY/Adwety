export default function StatCard({ label, value, hint, icon: Icon, onClick, active = false, ariaLabel = '' }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">{label}</p>
          <p className="mt-3 break-words text-3xl font-semibold leading-none text-primary">{value}</p>
        </div>
        {Icon ? (
          <span className="shrink-0 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-soft">{hint}</p> : <span className="mt-3 block min-h-5" aria-hidden="true" />}
    </>
  );

  const classes = `card h-full min-h-[9.75rem] w-full p-5 text-start ${onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:border-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950' : ''} ${active ? 'border-cyan-400 ring-2 ring-cyan-400/30' : ''}`;

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-pressed={active} aria-label={ariaLabel || String(label || '')}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
