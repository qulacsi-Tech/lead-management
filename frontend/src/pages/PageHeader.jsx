export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 m-0">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1.5 mb-0">{subtitle}</p>}
    </div>
  );
}
