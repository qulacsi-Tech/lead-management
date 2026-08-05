export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-on-surface">{title}</h2>
      {subtitle && <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>}
    </div>
  );
}
