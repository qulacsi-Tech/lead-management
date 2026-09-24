/**
 * A scrolling ad banner — the "banner marquee" the client asked for on the
 * public institute page (feedback 24 Sep 2026: "show ads in multiple areas or
 * in banner marquee format, it should feel like an ad").
 *
 * The label sits in a fixed block on the left and the items scroll behind it,
 * so it reads as a ticker rather than as part of the institute's content.
 * Hovering or focusing pauses it so an item can actually be clicked; with
 * reduced motion turned on it stops and the strip scrolls sideways by hand
 * instead (`motion-safe:` on the track; keyframes in index.css).
 *
 * `items`: [{ id, kind: 'admission' | 'job' | 'paper', text, org?, onClick?, href?, external? }]
 */

const KIND = {
  admission: { icon: 'campaign', label: 'Admissions', tone: 'bg-amber-400 text-amber-950' },
  job: { icon: 'work', label: 'Hiring', tone: 'bg-emerald-400 text-emerald-950' },
  paper: { icon: 'description', label: 'Free Paper', tone: 'bg-sky-300 text-sky-950' },
};

function MarqueeItem({ item, hidden }) {
  const kind = KIND[item.kind] || KIND.admission;
  const body = (
    <>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${kind.tone}`}>
        <span className="material-symbols-outlined text-[14px]">{kind.icon}</span>
        {kind.label}
      </span>
      <span className="font-semibold">{item.text}</span>
      {item.org && <span className="text-on-primary/70">· {item.org}</span>}
      <span className="material-symbols-outlined text-[16px] text-amber-300" aria-hidden="true">arrow_forward</span>
    </>
  );
  const className =
    'inline-flex items-center gap-2 text-sm text-on-primary whitespace-nowrap no-underline bg-transparent border-none p-0 cursor-pointer hover:underline';
  // The second copy exists only to make the loop seamless; keep it out of the
  // tab order and away from screen readers.
  const a11y = hidden ? { tabIndex: -1, 'aria-hidden': true } : {};

  return (
    <li className="flex items-center gap-8 shrink-0 pr-8">
      {item.href ? (
        <a
          href={item.href}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noreferrer' : undefined}
          className={className}
          {...a11y}
        >
          {body}
        </a>
      ) : (
        <button type="button" onClick={item.onClick} className={className} {...a11y}>
          {body}
        </button>
      )}
      <span className="w-1.5 h-1.5 rounded-full bg-amber-300" aria-hidden="true" />
    </li>
  );
}

// Fewer items than this and one pass is narrower than the strip, leaving a
// blank stretch before the loop comes round — so short lists are repeated.
const MIN_LOOP_ITEMS = 6;

export default function AdMarquee({ items = [], label = 'Ads', secondsPerItem = 8 }) {
  if (items.length === 0) return null;

  const loop = [];
  while (loop.length < MIN_LOOP_ITEMS) loop.push(...items);

  return (
    <section
      aria-label={label}
      className="group relative flex items-stretch rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-tertiary-container shadow-sm"
    >
      <div className="relative z-10 shrink-0 flex items-center gap-1.5 px-4 bg-amber-400 text-amber-950 text-xs font-extrabold uppercase tracking-wider">
        <span className="material-symbols-outlined text-[18px]">campaign</span>
        {label}
      </div>

      <div className="flex-1 min-w-0 overflow-x-auto motion-safe:overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
        <ul
          className="flex w-max list-none m-0 p-0 motion-safe:animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          style={{ '--marquee-duration': `${loop.length * secondsPerItem}s` }}
        >
          {loop.map((item, i) => (
            <MarqueeItem key={`${item.id}-${i}`} item={item} hidden={i >= items.length} />
          ))}
          {loop.map((item, i) => <MarqueeItem key={`${item.id}-${i}-copy`} item={item} hidden />)}
        </ul>
      </div>
    </section>
  );
}
