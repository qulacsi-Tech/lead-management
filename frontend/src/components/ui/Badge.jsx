export default function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    neutral: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-surface-container-high text-primary',
    success: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
    tertiary: 'bg-tertiary-fixed text-tertiary',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
