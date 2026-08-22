import Button from './Button';

/**
 * Shared empty state for management tables and content sections.
 * Every list surface in the Institute Console and Admin portal uses this so an
 * empty module reads as "nothing here yet" rather than a broken screen.
 */
export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction, compact }) {
  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-14'} px-6`}>
      <span className="material-symbols-outlined text-on-surface-variant/50 text-[40px]">{icon}</span>
      <p className="text-sm font-bold text-on-surface mt-2 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-on-surface-variant mb-0 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction} icon="add">{actionLabel}</Button>
      )}
    </div>
  );
}
