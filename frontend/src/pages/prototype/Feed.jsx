import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { mockFeedPosts, mockPage, mockProfessional } from './mockData';
import { useProtoAuth } from './useProtoAuth';

const POST_TYPE_BADGE = {
  admission: { label: 'Admission Open', tone: 'success' },
  job: { label: 'Job Vacancy', tone: 'tertiary' },
  expert: { label: 'Expert Opinion', tone: 'primary' },
  lookingForJob: { label: 'Open to Work', tone: 'neutral' },
  lookingForAdmission: { label: 'Looking for Admission', tone: 'neutral' },
};

function ProfileRail({ role, name }) {
  const isProfessional = role === 'professional';
  return (
    <Card className="overflow-hidden">
      <div className="h-12 bg-gradient-to-r from-primary to-tertiary" />
      <div className="px-4 pb-4 -mt-6">
        <div className="w-14 h-14 rounded-full bg-surface-container-high border-4 border-surface-container-lowest flex items-center justify-center font-bold text-primary">
          {(name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <p className="text-sm font-bold text-on-surface mt-2 mb-0">{name}</p>
        <p className="text-xs text-on-surface-variant mb-3">
          {isProfessional ? mockProfessional.headline : 'Student · Looking for Admission'}
        </p>
        <div className="text-xs text-on-surface-variant space-y-1 border-t border-outline-variant pt-3">
          {isProfessional ? (
            <>
              <div className="flex justify-between"><span>Profile views</span><span className="font-semibold text-primary">36</span></div>
              <div className="flex justify-between"><span>Followers</span><span className="font-semibold text-primary">{mockProfessional.stats.followers}</span></div>
            </>
          ) : (
            <div className="flex justify-between"><span>Enquiries sent</span><span className="font-semibold text-primary">2</span></div>
          )}
        </div>
      </div>
      <div className="border-t border-outline-variant p-2">
        <Link to="/prototype/profile">
          <Button variant="ghost" size="sm" className="w-full justify-start" icon="person">My Profile</Button>
        </Link>
        {isProfessional && (
          <Link to="/prototype/page">
            <Button variant="ghost" size="sm" className="w-full justify-start" icon="storefront">My Institute Page</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

function Composer({ role }) {
  const [open, setOpen] = useState(false);
  const isProfessional = role === 'professional';

  const actions = isProfessional
    ? [
        { to: '/prototype/page/post-admission', icon: 'campaign', label: 'Admission Notice' },
        { to: '/prototype/page/post-job', icon: 'work', label: 'Job Vacancy' },
        { to: '/prototype/dashboard', icon: 'psychology', label: 'Expert Opinion' },
        { to: '/prototype/dashboard', icon: 'business_center', label: 'Looking for Job' },
        { to: '/prototype/dashboard', icon: 'school', label: 'Looking for Admission' },
      ]
    : [{ to: '/prototype/dashboard', icon: 'school', label: 'Looking for Admission' }];

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-2.5 rounded-full border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer"
      >
        Start a post, notice or vacancy...
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-outline-variant">
          {actions.map((a) => (
            <Link key={a.label} to={a.to}>
              <Button variant="soft" size="sm" icon={a.icon}>{a.label}</Button>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const badge = POST_TYPE_BADGE[post.postType];

  const toggleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary shrink-0">
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface mb-0 truncate">{post.author.name}</p>
          <p className="text-xs text-on-surface-variant mb-0 truncate">{post.author.sub}</p>
        </div>
        <span className="text-xs text-on-surface-variant shrink-0">{post.time}</span>
      </div>

      <Badge tone={badge.tone} className="mb-2">{badge.label}</Badge>
      <h4 className="text-sm font-bold text-on-surface mb-1">{post.title}</h4>
      <p className="text-sm text-on-surface-variant mb-3">{post.body}</p>

      <div className="flex items-center justify-between border-t border-outline-variant pt-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={liked ? 'thumb_up' : 'thumb_up_off_alt'}
            className={liked ? 'text-primary' : ''}
            onClick={toggleLike}
          >
            {likeCount}
          </Button>
          <Button variant="ghost" size="sm" icon="chat_bubble_outline">{post.comments}</Button>
          <Button variant="ghost" size="sm" icon="share">Share</Button>
        </div>
        <Link to={post.ctaTo}>
          <Button size="sm" variant="soft">{post.ctaLabel}</Button>
        </Link>
      </div>
    </Card>
  );
}

function SuggestionsRail() {
  return (
    <Card className="p-4">
      <h4 className="text-sm font-bold text-on-surface mb-3">Institute Pages to follow</h4>
      <div className="space-y-3">
        {[
          { name: mockPage.name, sub: mockPage.type, avatar: 'BF' },
          { name: 'Horizon Public School', sub: 'School', avatar: 'HS' },
          { name: 'Zenith Training Institute', sub: 'Training Institute', avatar: 'ZT' },
        ].map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {s.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface mb-0 truncate">{s.name}</p>
              <p className="text-[11px] text-on-surface-variant mb-0 truncate">{s.sub}</p>
            </div>
            <Button size="sm" variant="ghost">Follow</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Feed() {
  const { role, name } = useProtoAuth();

  return (
    <div className="grid lg:grid-cols-[260px_1fr_280px] gap-5 items-start">
      <div className="hidden lg:block sticky top-20">
        <ProfileRail role={role} name={name} />
      </div>

      <div className="space-y-4">
        <Composer role={role} />
        {mockFeedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div className="hidden lg:block sticky top-20">
        <SuggestionsRail />
      </div>
    </div>
  );
}
