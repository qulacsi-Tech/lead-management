const VARIANTS = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20',
  secondary:
    'bg-secondary text-on-secondary hover:opacity-90 shadow-sm',
  soft:
    'bg-blue-50 text-blue-700 hover:bg-blue-100',
  outline:
    'bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-700',
  ghost:
    'bg-transparent text-blue-700 hover:bg-blue-50',
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
