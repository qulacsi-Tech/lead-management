const TONE = {
  success: { icon: 'check_circle', classes: 'bg-secondary-container text-on-secondary-container' },
  error: { icon: 'error', classes: 'bg-error-container text-on-error-container' },
  info: { icon: 'info', classes: 'bg-primary-fixed text-primary' },
};

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-200 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => {
        const tone = TONE[t.type] || TONE.info;
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${tone.classes}`}
          >
            <span className="material-symbols-outlined text-lg flex-shrink-0">{tone.icon}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="bg-transparent border-none cursor-pointer p-0 flex-shrink-0 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
