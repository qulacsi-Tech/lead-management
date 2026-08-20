import { NavLink } from 'react-router-dom';

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm no-underline transition-colors ${
          isActive
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

/**
 * Pass either `navItems` (a flat list) or `navGroups`
 * ([{ label, items: [...] }]) — the Main Admin portal uses groups to make the
 * platform/management split visible in the navigation itself.
 */
export default function Sidebar({ title, subtitle, navItems, navGroups, headerSlot, bottomSlot }) {
  return (
    <aside className="fixed h-full w-64 left-0 top-0 bg-surface border-r border-outline-variant shadow-sm flex flex-col py-2 px-3 z-50 box-border overflow-y-auto">
      <div className="mb-6 px-2 pt-2">
        <h1 className="font-display text-xl font-bold text-primary leading-tight m-0">{title}</h1>
        <p className="text-xs text-on-surface-variant m-0 mt-0.5">{subtitle}</p>
      </div>

      {headerSlot}

      <nav className="flex-1 flex flex-col gap-4">
        {navGroups
          ? navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold px-4 mb-1.5">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => <NavItem key={item.to} item={item} />)}
                </div>
              </div>
            ))
          : (navItems || []).map((item) => <NavItem key={item.to} item={item} />)}
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-3 flex flex-col gap-2">
        {bottomSlot}
      </div>
    </aside>
  );
}
