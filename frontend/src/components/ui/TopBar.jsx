import { useState } from 'react';
import { useData } from '../../context/DataContext';

export default function TopBar({ searchPlaceholder, name, roleLabel, initials, userKey }) {
  const { notificationsFor, markAllRead } = useData();
  const [open, setOpen] = useState(false);
  const notifications = notificationsFor(userKey);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markAllRead(userKey);
      return next;
    });
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-256px)] h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-6 z-40 box-border">
      <div className="flex items-center flex-1 max-w-xl relative">
        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all box-border"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={toggleOpen}
            className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="text-sm font-semibold m-0">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8 m-0">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-outline-variant last:border-0 text-sm">
                    <p className="m-0">{n.message}</p>
                    <p className="text-[10px] text-on-surface-variant m-0 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-outline-variant mx-1" />
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-on-surface m-0 leading-none">{name}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider m-0 mt-0.5">
              {roleLabel}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary bg-surface-container-high flex items-center justify-center text-primary font-bold text-xs">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
