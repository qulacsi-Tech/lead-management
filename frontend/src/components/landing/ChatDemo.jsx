import { useEffect, useRef, useState } from 'react';

/**
 * The landing hero's assistant panel: a tilted, layered card in which a
 * scripted conversation plays on its own — a visitor asks, the assistant
 * "types" and answers with institute, notice, job and paper cards.
 *
 * Client request, 26 Sep 2026: "make this chat section 3d format, auto dummy
 * chat happening type replies, feed like that where someone can see what's
 * happening inside like a glimpse". It is a preview of the product, not a
 * working assistant: every name below is fictional, and the real search is the
 * form passed in as `children`, which sits under the conversation.
 *
 * Pauses while the visitor is using that form, so the demo never competes with
 * what they are typing. With reduced motion turned on, the first conversation
 * is shown complete and nothing moves.
 */

const SCENARIOS = [
  [
    { from: 'user', text: 'B.Tech colleges in Bhubaneswar' },
    { from: 'bot', text: 'Mil gaye! Aapke liye top matches 👇' },
    {
      from: 'bot',
      cards: [
        { icon: 'school', title: 'Sunrise Institute of Technology', meta: 'College · Bhubaneswar', tag: 'Admissions open', tone: 'green' },
        { icon: 'school', title: 'Greenfield Engineering College', meta: 'College · Khordha', tag: 'NAAC A+', tone: 'blue' },
      ],
    },
    { from: 'bot', text: '📢 Sunrise ka admission notice aaya hai — last date 30 Oct.' },
  ],
  [
    { from: 'user', text: 'JEE coaching near me' },
    {
      from: 'bot',
      cards: [
        { icon: 'account_balance', title: 'Apex JEE Academy', meta: 'Coaching · 4.8 ★ · 1.2 km', tag: 'New batch Monday', tone: 'amber' },
      ],
    },
    { from: 'user', text: 'Enquiry bhej do 🙏' },
    { from: 'bot', text: '✅ Enquiry sent! Apex aapko jaldi contact karega.' },
  ],
  [
    { from: 'user', text: 'Maths teacher jobs' },
    {
      from: 'bot',
      cards: [
        { icon: 'work', title: 'We Are Hiring – Maths Faculty', meta: 'Bluebell Public School · 2+ yrs', tag: 'Apply now', tone: 'green' },
      ],
    },
    {
      from: 'bot',
      text: 'Students ke liye free guess paper bhi hai:',
      cards: [
        { icon: 'description', title: 'Class 12 Physics – Guess Paper', meta: 'Free PDF · 2,458 downloads', tag: 'Download', tone: 'blue' },
      ],
    },
  ],
];

const TONES = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-900',
};

const USER_DELAY = 1100;   // pause before the visitor "sends"
const TYPING_TIME = 1300;  // how long the assistant shows the typing dots
const END_PAUSE = 3200;    // time to read the finished conversation

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function ResultCard({ card }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
      <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-slate-900 truncate">{card.title}</span>
        <span className="block text-[11px] text-slate-500 truncate">{card.meta}</span>
      </span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TONES[card.tone]}`}>{card.tag}</span>
    </div>
  );
}

function Message({ msg }) {
  const mine = msg.from === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} motion-safe:animate-msg-in`}>
      <div className={`max-w-[85%] space-y-1.5 ${mine ? 'items-end' : ''}`}>
        {msg.text && (
          <p
            className={`text-sm m-0 px-3.5 py-2 rounded-2xl ${
              mine
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
            }`}
          >
            {msg.text}
          </p>
        )}
        {msg.cards?.map((c) => <ResultCard key={c.title} card={c} />)}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start" aria-hidden="true">
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-3">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 motion-safe:animate-bounce"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatDemo({ children }) {
  const reduced = prefersReducedMotion();
  const [scenario, setScenario] = useState(0);
  const [step, setStep] = useState(reduced ? SCENARIOS[0].length : 0);
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);

  const script = SCENARIOS[scenario];

  // One timer per beat: user messages land after a short pause, assistant
  // messages after the typing dots; the end of a script rolls to the next.
  useEffect(() => {
    if (reduced || paused) return undefined;
    let timer;
    if (step >= script.length) {
      timer = setTimeout(() => {
        setScenario((s) => (s + 1) % SCENARIOS.length);
        setStep(0);
      }, END_PAUSE);
    } else if (script[step].from === 'user') {
      timer = setTimeout(() => setStep((n) => n + 1), USER_DELAY);
    } else if (!typing) {
      timer = setTimeout(() => setTyping(true), 350);
    } else {
      timer = setTimeout(() => { setTyping(false); setStep((n) => n + 1); }, TYPING_TIME);
    }
    return () => clearTimeout(timer);
  }, [step, typing, paused, script, reduced]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [step, typing, reduced]);

  return (
    <div className="relative lg:[perspective:1400px]">
      {/* Floating chips — in front of the card, drifting slowly. */}
      <div className="hidden lg:flex absolute -top-9 right-6 z-20 items-center gap-2 bg-white rounded-xl shadow-xl border border-slate-200 px-3 py-2 motion-safe:animate-float">
        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
          <span className="material-symbols-outlined text-[16px]">campaign</span>
        </span>
        <span className="text-[11px] font-semibold text-slate-800">New admission notice</span>
      </div>
      <div
        className="hidden lg:flex absolute -bottom-8 -left-8 z-20 items-center gap-2 bg-white rounded-xl shadow-xl border border-slate-200 px-3 py-2 motion-safe:animate-float"
        style={{ animationDelay: '-2.5s' }}
      >
        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
        </span>
        <span className="text-[11px] font-semibold text-slate-800">Enquiry sent · 2m ago</span>
      </div>

      <div className="relative transition-transform duration-700 ease-out lg:[transform:rotateY(-10deg)_rotateX(5deg)] lg:hover:[transform:rotateY(-3deg)_rotateX(1deg)]">
        {/* Depth plate behind the card. A flat offset rather than a
            translateZ: preserve-3d would stop the conversation's overflow
            from being clipped. */}
        <div
          className="hidden lg:block absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90 translate-x-4 translate-y-4"
          aria-hidden="true"
        />

        <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Window header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold">ConnectEDus Assistant</span>
              <span className="flex items-center gap-1 text-[11px] text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
              </span>
            </span>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-1 rounded-full">
              Live preview
            </span>
          </div>

          {/* Conversation — decorative, so assistive tech skips it. */}
          <div
            ref={scrollRef}
            aria-hidden="true"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="h-64 overflow-hidden px-4 py-4 space-y-2.5 bg-gradient-to-b from-slate-50 to-white [mask-image:linear-gradient(to_bottom,transparent,black_28px)]"
          >
            <div className="flex justify-start">
              <p className="text-sm m-0 px-3.5 py-2 rounded-2xl rounded-bl-sm bg-slate-100 text-slate-800">
                <span className="font-semibold">Hi! 👋</span> Aap kya search karna chahte hain?
              </p>
            </div>
            {script.slice(0, step).map((msg, i) => <Message key={`${scenario}-${i}`} msg={msg} />)}
            {typing && <TypingDots />}
          </div>

          {/* The real controls. */}
          <div
            className="border-t border-slate-200 p-4"
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
