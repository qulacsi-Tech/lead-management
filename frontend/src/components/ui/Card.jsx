export default function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
