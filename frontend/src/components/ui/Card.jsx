export default function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-3xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
