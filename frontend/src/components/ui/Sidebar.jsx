import { NavLink } from 'react-router-dom';

export default function Sidebar({ title, subtitle, navItems, bottomSlot }) {
  return (
    <aside className="fixed h-full w-64 left-0 top-0 bg-surface border-r border-outline-variant shadow-sm flex flex-col py-2 px-3 z-50 box-border">
      <div className="mb-10 px-2">
        <h1 className="font-display text-2xl font-bold text-primary leading-tight m-0">{title}</h1>
        <p className="text-xs text-on-surface-variant m-0 mt-0.5">{subtitle}</p>
      </div>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm no-underline transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-outline-variant pt-3 flex flex-col gap-2">
        {bottomSlot}
      </div>
    </aside>
  );
}
