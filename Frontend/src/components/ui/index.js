export function Button({ children, className = '', ...props }) { return <button className={'btn-primary ' + className} {...props}>{children}</button>; }
export function Input(props) { return <input className={'input ' + (props.className || '')} {...props} />; }
export function Select({ children, className = '', ...props }) { return <select className={'input ' + className} {...props}>{children}</select>; }
export function Textarea({ className = '', ...props }) { return <textarea className={'input min-h-28 ' + className} {...props} />; }
export function Badge({ children, className = '' }) { return <span className={'badge ' + className}>{children}</span>; }
export function Card({ children, className = '' }) { return <div className={'card p-6 ' + className}>{children}</div>; }
export function Modal({ children, className = '' }) { return <div className={'card p-6 ' + className}>{children}</div>; }
export function Drawer({ children, className = '' }) { return <aside className={'card p-6 ' + className}>{children}</aside>; }
export function Table({ children, className = '' }) { return <div className={'overflow-x-auto ' + className}><table className="min-w-full text-sm">{children}</table></div>; }
export function PageHeader({ title, description }) { return <header><h1 className="text-2xl font-semibold text-primary">{title}</h1>{description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}</header>; }
export function StatCard({ label, value }) { return <div className="card p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-primary">{value}</p></div>; }
export function SearchFilterBar({ children }) { return <div className="card p-6">{children}</div>; }
export function ConfirmDialog({ children }) { return <div>{children}</div>; }
export function EmptyState({ title }) { return <div className="card p-8 text-center text-muted">{title}</div>; }
export function ErrorState({ message }) { return <div className="card p-8 text-center text-rose-600">{message}</div>; }
export function Skeleton() { return <div className="card h-24 animate-pulse p-6" />; }
