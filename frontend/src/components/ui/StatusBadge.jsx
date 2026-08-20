import Badge from './Badge';

// One mapping for every lifecycle label used across the Institute Console and
// Admin portal, so "Published" looks the same wherever it appears.
const TONES = {
  Published: 'success',
  Active: 'success',
  Open: 'success',
  Draft: 'neutral',
  Pending: 'neutral',
  Expired: 'error',
  Closed: 'error',
  Suspended: 'error',
  Disabled: 'error',
  Responded: 'primary',
  Contacted: 'primary',
  New: 'tertiary',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <Badge tone={TONES[status] || 'neutral'} className={className}>
      {status}
    </Badge>
  );
}
