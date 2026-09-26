export default function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    error: 'bg-error-container text-on-error-container',
    tertiary: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
