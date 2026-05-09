export default function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="card p-8 text-center">
      {Icon ? <Icon className="mx-auto mb-4 h-10 w-10 text-cyan-500" /> : null}
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
