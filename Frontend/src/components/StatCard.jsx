export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
        </div>
        {Icon ? (
          <span className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-xs text-soft">{hint}</p> : null}
    </div>
  );
}
