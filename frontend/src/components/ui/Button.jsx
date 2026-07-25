const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:opacity-90 shadow-sm',
  secondary:
    'bg-secondary text-on-secondary hover:opacity-90 shadow-sm',
  soft:
    'bg-surface-container-high text-primary hover:bg-surface-container-highest',
  outline:
    'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low',
  ghost:
    'bg-transparent text-primary hover:bg-surface-container-low',
  danger:
    'bg-transparent text-error hover:bg-error-container',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  pill = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        pill ? 'rounded-full' : 'rounded-xl'
      } ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
}
