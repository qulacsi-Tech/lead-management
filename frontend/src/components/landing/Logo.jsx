import { Link } from 'react-router-dom';

/**
 * The ConnectEDus wordmark used on the landing, sign-in and app pages.
 * `compact` drops the words below `sm`, leaving the mark, for headers that
 * also have to fit navigation on a phone.
 */
export default function Logo({ inverted = false, compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
      <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-primary flex items-center justify-center shadow-md">
        <span className="material-symbols-outlined text-white text-[26px]">school</span>
      </span>
      <span className={`leading-tight ${compact ? 'hidden sm:block' : ''}`}>
        <span className={`block text-xl font-extrabold tracking-tight font-display ${inverted ? 'text-white' : 'text-primary'}`}>
          Connect<span className="text-orange-500">EDus</span>
        </span>
        <span className={`block text-[10px] font-semibold ${inverted ? 'text-white/70' : 'text-on-surface-variant'}`}>
          Education • Mentors • Colleges
        </span>
      </span>
    </Link>
  );
}
