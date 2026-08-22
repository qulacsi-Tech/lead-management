import Card from './Card';

/**
 * The management-table shell shared by the Admin portal and Institute Console.
 * Markup matches the hand-rolled tables already in pages/admin so the two look
 * identical — this just stops every new module from repeating it.
 *
 * columns: [{ key, label, align, render(row) }]
 */
export default function DataTable({ columns, rows, rowKey = (r) => r.id, empty }) {
  return (
    <Card className="p-0 overflow-hidden border border-outline-variant">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant uppercase tracking-wider">
              {columns.map((c) => (
                <th key={c.key} className={`py-3.5 px-5 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">{empty}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-surface-container-low transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={`py-4 px-5 ${c.align === 'right' ? 'text-right' : ''}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** The icon-button cluster used in every table's Actions column. */
export function RowAction({ icon, title, onClick, tone = 'default' }) {
  const tones = {
    default: 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high',
    warn: 'text-amber-600 hover:bg-amber-50',
    good: 'text-emerald-600 hover:bg-emerald-50',
    danger: 'text-error hover:bg-error-container/30',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${tones[tone]}`}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}
