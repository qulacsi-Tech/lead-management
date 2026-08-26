export default function Modal({ open, onClose, children, width = 340, height, className = '' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-on-surface/40 flex items-center justify-center z-100 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-surface-container-lowest rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[95vh] ${className}`}
        style={{ width, height }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

