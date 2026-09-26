import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Panel, { initials, personTone } from './Panel';
import { POST_KINDS } from './PostCard';
import { useSession } from '../../context/useSession';
import { useMyPages } from '../../hooks/useMyPages';
import { ApiError, createPost } from '../../Api/Api';

const MAX_LENGTH = 3000;

const PLACEHOLDERS = {
  update: 'Share news, a result or an achievement…',
  question: 'Ask the community — students, teachers and institutes can answer…',
  requirement: 'What are you looking for? e.g. "JEE coaching in Indore with weekend batches"',
};

/**
 * "Start a post" for every member (client request, 26 Sep 2026: it used to
 * send everyone to the Institute Console, which a student or mentor cannot
 * use). Clicking opens the editor in place.
 *
 * Admission notices and vacancies still belong to an institute, so those two
 * shortcuts only appear for someone who administers one.
 */
export default function PostComposer({ onPosted }) {
  const { auth, name } = useSession();
  const { isInstituteAdmin } = useMyPages();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('update');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const textRef = useRef(null);

  const expand = () => {
    setOpen(true);
    // Focus once the textarea has rendered.
    setTimeout(() => textRef.current?.focus(), 0);
  };

  const cancel = () => {
    setOpen(false);
    setBody('');
    setError('');
    setKind('update');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const post = await createPost({ kind, body });
      onPosted?.(post);
      cancel();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not publish your post. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const avatar = (
    <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${personTone(auth?.id)} text-white font-bold flex items-center justify-center shrink-0`}>
      {initials(name)}
    </span>
  );

  if (!open) {
    return (
      <Panel className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {avatar}
          <button
            type="button"
            onClick={expand}
            className="flex-1 text-left px-5 py-3 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-500 hover:border-blue-400 cursor-pointer transition-colors"
          >
            Start a post, ask a question or share what you&apos;re looking for…
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mt-3 sm:pl-14">
          {Object.entries(POST_KINDS).map(([key, k]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setKind(key); expand(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-transparent border-none cursor-pointer"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${k.pill}`}>
                <span className="material-symbols-outlined text-[16px]">{k.icon}</span>
              </span>
              {k.label}
            </button>
          ))}
          {isInstituteAdmin && (
            <>
              <span className="w-px bg-slate-200 mx-1 my-1" aria-hidden="true" />
              <Link
                to="/institute/notices"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 no-underline"
              >
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-orange-600 bg-orange-50">
                  <span className="material-symbols-outlined text-[16px]">campaign</span>
                </span>
                Admission Notice
              </Link>
              <Link
                to="/institute/jobs"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 no-underline"
              >
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50">
                  <span className="material-symbols-outlined text-[16px]">work</span>
                </span>
                Job Vacancy
              </Link>
            </>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-4 sm:p-5 ring-2 ring-blue-100">
      <form onSubmit={submit}>
        <div className="flex items-start gap-3">
          {avatar}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 m-0">{name}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5" role="radiogroup" aria-label="Type of post">
              {Object.entries(POST_KINDS).map(([key, k]) => {
                const active = kind === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setKind(key)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                      active ? `${k.pill} border-transparent` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{k.icon}</span>
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <textarea
          ref={textRef}
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(''); }}
          maxLength={MAX_LENGTH}
          rows={4}
          placeholder={PLACEHOLDERS[kind]}
          aria-label="Write your post"
          className="w-full mt-3 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[15px] text-slate-900 leading-relaxed outline-none resize-y focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        {error && <p className="text-xs text-error mt-2 mb-0">{error}</p>}

        <div className="flex items-center justify-between gap-3 mt-3">
          <span className={`text-[11px] ${body.length > MAX_LENGTH - 200 ? 'text-orange-600' : 'text-slate-400'}`}>
            {body.length}/{MAX_LENGTH}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={sending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-transparent border-none cursor-pointer hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Posting…' : 'Post'}
              {!sending && <span className="material-symbols-outlined text-[18px]" aria-hidden="true">send</span>}
            </button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
