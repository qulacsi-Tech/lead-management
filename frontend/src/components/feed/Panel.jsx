/** A white rounded panel — the feed's card, in the landing page's shape. */
export default function Panel({ className = '', children }) {
  return (
    <section className={`bg-white rounded-3xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

/** Two-letter monogram for a person or institute without a picture. */
export function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const PERSON_TONES = [
  'from-orange-400 to-orange-500',
  'from-blue-500 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-pink-400 to-rose-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-yellow-500',
];

/** A stable colour per person, so the same member always looks the same. */
export function personTone(key) {
  let h = 0;
  for (const ch of key || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PERSON_TONES[h % PERSON_TONES.length];
}

export function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString();
}
