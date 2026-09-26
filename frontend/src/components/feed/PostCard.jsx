import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Panel, { initials, personTone, timeAgo } from './Panel';
import { useMyPages } from '../../hooks/useMyPages';
import {
  ApiError,
  resolveAssetUrl,
  deletePost,
  likePost,
  unlikePost,
  fetchPostComments,
  createPostComment,
  deletePostComment,
} from '../../Api/Api';

export const POST_KINDS = {
  update: { label: 'Update', icon: 'campaign', pill: 'bg-blue-100 text-blue-700', bar: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
  question: { label: 'Question', icon: 'help', pill: 'bg-violet-100 text-violet-700', bar: 'bg-gradient-to-r from-violet-500 to-fuchsia-500' },
  requirement: { label: 'Looking for', icon: 'person_search', pill: 'bg-amber-100 text-amber-800', bar: 'bg-gradient-to-r from-amber-400 to-orange-400' },
};

// Long posts open clamped; "See more" shows the rest.
const CLAMP_AT = 320;

function PersonAvatar({ person, size = 'w-11 h-11', text = 'text-sm' }) {
  if (person?.profile_photo_url) {
    return <img src={resolveAssetUrl(person.profile_photo_url)} alt="" className={`${size} rounded-2xl object-cover shrink-0`} />;
  }
  return (
    <span className={`${size} rounded-2xl bg-gradient-to-br ${personTone(person?.id)} text-white font-bold ${text} flex items-center justify-center shrink-0`}>
      {initials(person?.name)}
    </span>
  );
}

function PageAvatar({ page, size = 'w-9 h-9' }) {
  return (
    <span className={`${size} rounded-xl bg-blue-50 ring-1 ring-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center overflow-hidden shrink-0`}>
      {page.logo_url
        ? <img src={resolveAssetUrl(page.logo_url)} alt="" className="w-full h-full object-cover" />
        : initials(page.name)}
    </span>
  );
}

function Comment({ comment, onDelete }) {
  const asPage = comment.page;
  return (
    <li className="flex items-start gap-2.5">
      {asPage ? (
        <Link to={asPage.public_path} className="no-underline"><PageAvatar page={asPage} /></Link>
      ) : (
        <PersonAvatar person={comment.author} size="w-9 h-9" text="text-xs" />
      )}
      <div className="flex-1 min-w-0">
        <div className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 ${asPage ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {asPage ? (
              <>
                <Link to={asPage.public_path} className="text-xs font-bold text-slate-900 no-underline hover:text-blue-700">
                  {asPage.name}
                </Link>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Institute
                </span>
              </>
            ) : (
              <span className="text-xs font-bold text-slate-900">{comment.author.name}</span>
            )}
            <span className="text-[11px] text-slate-400">· {timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-slate-700 m-0 mt-0.5 whitespace-pre-line break-words">{comment.body}</p>
        </div>
        {comment.can_delete && (
          <button
            type="button"
            onClick={() => onDelete(comment)}
            className="text-[11px] font-semibold text-slate-400 hover:text-error bg-transparent border-none cursor-pointer px-2 py-1"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Replies under a post. Loaded when first opened, not with the feed, so a
 * feed of twenty posts does not cost twenty extra requests.
 *
 * A member who administers institutes chooses who they reply as — themselves
 * or one of their institutes. The server checks that choice against
 * page_admins; the picker only offers what it will accept.
 */
function Replies({ post, onCountChange }) {
  const { pages: myPages } = useMyPages();
  const [comments, setComments] = useState(null);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [asPageId, setAsPageId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPostComments(post.id)
      .then((list) => !cancelled && setComments(list))
      .catch(() => !cancelled && setError("Couldn't load replies."));
    return () => { cancelled = true; };
  }, [post.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const created = await createPostComment(post.id, { body, asPageId });
      setComments((list) => [...(list || []), created]);
      onCountChange(1);
      setBody('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post your reply.');
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await deletePostComment(post.id, comment.id);
      setComments((list) => list.filter((c) => c.id !== comment.id));
      onCountChange(-1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the reply.');
    }
  };

  return (
    <div className="border-t border-slate-100 pt-4 mt-3 space-y-3">
      {comments === null && !error && <p className="text-xs text-slate-400 m-0">Loading replies…</p>}
      {comments && comments.length > 0 && (
        <ul className="space-y-3 list-none m-0 p-0">
          {comments.map((c) => <Comment key={c.id} comment={c} onDelete={remove} />)}
        </ul>
      )}
      {error && <p className="text-xs text-error m-0">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2">
        {myPages.length > 0 && (
          <select
            value={asPageId}
            onChange={(e) => setAsPageId(e.target.value)}
            aria-label="Reply as"
            className="max-w-[40%] text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-2.5 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Reply as me</option>
            {myPages.map((p) => <option key={p.id} value={p.id}>As {p.name}</option>)}
          </select>
        )}
        <div className="flex-1 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-1 py-1 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1500}
            placeholder={post.kind === 'requirement' ? 'Suggest an institute or course…' : 'Write a reply…'}
            aria-label="Write a reply"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-900 py-1.5"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            aria-label="Send reply"
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-none cursor-pointer hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}

const ACTION =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50';

/** One member post on the feed. */
export default function PostCard({ post, onDeleted }) {
  const kind = POST_KINDS[post.kind] || POST_KINDS.update;
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [comments, setComments] = useState(post.comments_count || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const long = post.body.length > CLAMP_AT;
  const author = post.author;

  const toggleLike = async () => {
    setBusy(true);
    try {
      const res = liked ? await unlikePost(post.id) : await likePost(post.id);
      setLiked(res.liked);
      setLikes(res.likes_count);
    } catch {
      // Leave the button as it was; a failed like is not worth an alert.
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this post? Replies will be deleted too.')) return;
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      window.alert('Could not delete the post. Please try again.');
    }
  };

  return (
    <Panel className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1.5 ${kind.bar}`} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <PersonAvatar person={author} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 mb-0 truncate">{author.name}</p>
            <p className="text-xs text-slate-500 mb-0 truncate">
              {[author.headline || author.role, timeAgo(post.created_at)].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${kind.pill}`}>
            <span className="material-symbols-outlined text-[14px]">{kind.icon}</span>
            {kind.label}
          </span>
          {post.can_delete && (
            <button
              type="button"
              onClick={remove}
              aria-label="Delete post"
              title="Delete post"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-error hover:bg-error-container/50 bg-transparent border-none cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>

        <p className={`text-[15px] text-slate-800 leading-relaxed m-0 whitespace-pre-line break-words ${long && !expanded ? 'line-clamp-5' : ''}`}>
          {post.body}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-semibold text-blue-600 bg-transparent border-none cursor-pointer p-0 mt-1 hover:underline"
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        )}

        <div className="flex items-center gap-1 border-t border-slate-100 pt-3 mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={toggleLike}
            aria-pressed={liked}
            className={`${ACTION} ${liked ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{liked ? 'thumb_up' : 'thumb_up_off_alt'}</span>
            {likes > 0 ? likes : 'Like'}
          </button>
          <button
            type="button"
            onClick={() => setShowReplies((v) => !v)}
            aria-expanded={showReplies}
            className={`${ACTION} ${showReplies ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat_bubble</span>
            {comments > 0 ? `${comments} ${comments === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
          </button>
        </div>

        {showReplies && <Replies post={post} onCountChange={(d) => setComments((n) => n + d)} />}
      </div>
    </Panel>
  );
}
