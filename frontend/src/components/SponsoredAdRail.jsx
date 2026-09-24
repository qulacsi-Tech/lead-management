import { useEffect, useState } from 'react';

/**
 * The "Sponsored · near you" rail.
 *
 * One ad at a time with dot pagination, matching the design the client
 * supplied. It is deliberately NOT a Card: the reference has a hairline border
 * on a plain ground with the label sitting *outside* the box, which is what
 * separates a promoted slot from the institute's own content around it. A
 * visitor should be able to tell at a glance which parts of the page the
 * institute wrote and which are advertising.
 *
 * "near you" is literal, not decoration: `city` is passed in and the caller
 * only supplies ads it has already matched on location.
 */

function AdSlide({ ad }) {
  const isJob = ad.type === 'job';

  return (
    <article className="rounded-xl border border-outline-variant border-l-4 border-l-amber-400 bg-surface-container-lowest p-4">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold mb-2 ${
          isJob
            ? 'bg-emerald-500/12 text-emerald-800'
            : 'bg-primary-container/50 text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[13px]">{isJob ? 'work' : 'campaign'}</span>
        {isJob ? 'Hiring' : 'Admissions'}
      </span>

      <h3 className="text-base font-bold text-on-surface m-0 mb-1 leading-snug">{ad.title}</h3>

      {ad.org && <p className="text-sm text-on-surface-variant m-0">{ad.org}</p>}

      {ad.meta && <p className="text-sm text-on-surface-variant m-0 mt-0.5">{ad.meta}</p>}

      <a
        href={ad.href}
        target={ad.external ? '_blank' : undefined}
        rel={ad.external ? 'noreferrer' : undefined}
        className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-on-surface underline underline-offset-4 decoration-1"
      >
        {isJob ? 'View Job' : 'View Notice'}
        <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}

export default function SponsoredAdRail({ ads = [], city, intervalMs = 6000 }) {
  const [index, setIndex] = useState(0);

  // Clamp when the ad list shrinks under us (a notice expiring mid-session),
  // so the rail never lands on a slide that no longer exists.
  const safeIndex = ads.length ? Math.min(index, ads.length - 1) : 0;

  useEffect(() => {
    if (ads.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % ads.length), intervalMs);
    return () => clearInterval(id);
  }, [ads.length, intervalMs]);

  if (ads.length === 0) return null;

  return (
    <section aria-label="Sponsored" className="px-1">
      <p className="flex items-center gap-1.5 text-xs text-on-surface-variant m-0 mb-1.5">
        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 text-[10px] font-extrabold tracking-wider">
          AD
        </span>
        Sponsored{city ? ' · near you' : ''}
      </p>

      <AdSlide ad={ads[safeIndex]} />

      {ads.length > 1 && (
        <div className="flex items-center gap-1.5 mt-2">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`Show sponsored item ${i + 1} of ${ads.length}`}
              aria-current={i === safeIndex}
              onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full border-none p-0 cursor-pointer transition-colors ${
                i === safeIndex ? 'bg-amber-500' : 'bg-outline-variant'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
