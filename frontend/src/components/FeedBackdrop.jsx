/**
 * The decorative layer behind every member screen (rendered by AppLayout):
 * tinted colour washes, a faint dot grid, and education icons drifting in the
 * side gutters.
 *
 * Client request, 26 Sep 2026: the empty space at the far left and right
 * should get "some animations … with some different background shades for a
 * more attractive and aesthetic feel". Blue on the left, orange and green on
 * the right — the landing page's colours. Pure decoration: fixed, behind the
 * content, never clickable, hidden from assistive tech, and still for anyone
 * with reduced motion turned on (`motion-safe:`).
 *
 * The icons only appear from 1640px up, where the gutters beside the widened
 * feed (1384px) are wide enough to
 * hold them without sitting under the cards.
 */

const ICONS = [
  { icon: 'school', side: 'left-[2.5%]', top: 'top-[18%]', tone: 'text-blue-500 bg-blue-100', delay: '0s', dur: '7s' },
  { icon: 'menu_book', side: 'left-[4%]', top: 'top-[46%]', tone: 'text-indigo-500 bg-indigo-100', delay: '-2s', dur: '8s' },
  { icon: 'lightbulb', side: 'left-[2%]', top: 'top-[74%]', tone: 'text-sky-500 bg-sky-100', delay: '-4s', dur: '6.5s' },
  { icon: 'campaign', side: 'right-[2.5%]', top: 'top-[22%]', tone: 'text-orange-500 bg-orange-100', delay: '-1s', dur: '7.5s' },
  { icon: 'work', side: 'right-[4%]', top: 'top-[52%]', tone: 'text-emerald-500 bg-emerald-100', delay: '-3s', dur: '6s' },
  { icon: 'emoji_events', side: 'right-[2%]', top: 'top-[80%]', tone: 'text-amber-500 bg-amber-100', delay: '-5s', dur: '8.5s' },
];

export default function FeedBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Side washes: a different shade on each side. */}
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-blue-100/70 via-blue-50/40 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-orange-50/80 via-emerald-50/40 to-transparent" />

      {/* Dot grid, fading out towards the middle. */}
      <div className="absolute inset-0 [background-image:radial-gradient(rgb(148_163_184/0.35)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_right,black,transparent_28%,transparent_72%,black)]" />

      {/* Slow colour blobs. */}
      <div className="absolute -left-40 top-16 w-[28rem] h-[28rem] rounded-full bg-blue-300/30 blur-3xl motion-safe:animate-drift" />
      <div className="absolute -left-32 bottom-0 w-80 h-80 rounded-full bg-indigo-300/25 blur-3xl motion-safe:animate-drift" style={{ animationDelay: '-9s' }} />
      <div className="absolute -right-40 top-24 w-[26rem] h-[26rem] rounded-full bg-orange-200/40 blur-3xl motion-safe:animate-drift" style={{ animationDelay: '-5s' }} />
      <div className="absolute -right-24 bottom-10 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl motion-safe:animate-drift" style={{ animationDelay: '-13s' }} />

      {/* Drifting icons in the gutters. */}
      {ICONS.map((i) => (
        <span
          key={i.icon}
          className={`hidden min-[1640px]:flex absolute ${i.side} ${i.top} w-12 h-12 rounded-2xl items-center justify-center shadow-sm opacity-70 ${i.tone} motion-safe:animate-bob`}
          style={{ animationDelay: i.delay, animationDuration: i.dur }}
        >
          <span className="material-symbols-outlined text-[26px]">{i.icon}</span>
        </span>
      ))}
    </div>
  );
}
