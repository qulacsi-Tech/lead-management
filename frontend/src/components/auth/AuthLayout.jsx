import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../landing/Logo';
import HeroIllustration from '../landing/HeroIllustration';

/**
 * The frame shared by /login and /signup, styled after the landing page
 * (client request, 26 Sep 2026: "revamp the login and register page, it should
 * match the aesthetics of the landing page").
 *
 * Left: the landing scene with a short pitch over it (desktop only). Right:
 * the form. `reason` is the line an entry point passed along ("Sign in to
 * follow this institute."), shown above the form so the visitor knows why
 * they were sent here.
 */
export default function AuthLayout({ title, subtitle, reason, pitch, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-slate-50 font-body text-on-surface">
      {/* Scene panel */}
      {/* Text on the plain gradient above, scene in the space left below —
          the scene never runs behind the copy. */}
      <aside className="sticky top-0 h-screen hidden lg:flex flex-col overflow-hidden bg-gradient-to-br from-white via-blue-50 to-sky-100">
        <div className="relative px-10 xl:px-14 pt-10 xl:pt-12 pb-4">
          <Logo />
          <h1 className="font-display text-4xl xl:text-[2.75rem] font-extrabold leading-tight text-slate-900 mt-10 mb-3 max-w-lg">
            {pitch.title} <span className="text-blue-600">{pitch.highlight}</span>
          </h1>
          <p className="text-base text-slate-600 m-0 max-w-md">{pitch.body}</p>
          <ul className="mt-5 mb-0 space-y-2 list-none p-0">
            {pitch.points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex-1 min-h-[260px] [mask-image:linear-gradient(to_bottom,transparent,black_18%)]">
          <HeroIllustration className="absolute inset-0 w-full h-full" />
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-10 h-20">
          <span className="lg:hidden"><Logo /></span>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600 no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-10 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 m-0">{title}</h2>
              <p className="text-sm text-slate-500 mt-1.5 mb-6">{subtitle}</p>

              {reason && (
                <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-900">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">info</span>
                  <span>{reason}</span>
                </div>
              )}

              {children}
            </div>
            {footer && <div className="text-center text-sm text-slate-600 mt-6">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

/** A labelled input with a leading icon, matching the landing search box. */
export function AuthField({ label, icon, hint, type = 'text', ...rest }) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-800 mb-1.5">{label}</span>
      <span className="flex items-center gap-2.5 px-4 rounded-2xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-shadow">
        <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
        <input
          type={isPassword && reveal ? 'text' : type}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-900 py-3.5"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="flex items-center text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer p-0"
          >
            <span className="material-symbols-outlined text-[20px]">{reveal ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </span>
      {hint && <span className="block text-xs text-slate-500 mt-1.5">{hint}</span>}
    </label>
  );
}

export function AuthSubmit({ children, busy, busyLabel }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? busyLabel : children}
      {!busy && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
    </button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-center gap-2 text-sm text-error m-0 px-4 py-2.5 rounded-xl bg-error-container/60">
      <span className="material-symbols-outlined text-[18px]">error</span>
      {children}
    </p>
  );
}
