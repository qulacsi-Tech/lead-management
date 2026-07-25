export default function Modal({ open, onClose, children, width = 340 }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-on-surface/40 flex items-center justify-center z-100"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl p-8 shadow-2xl"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
