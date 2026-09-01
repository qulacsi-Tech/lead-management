import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useInstitute } from '../../context/InstituteContext';
import { fetchPageCourses, fetchPageOpportunities } from '../../Api/Api';
import { pageDisplayUrl } from '../../utils/pageUrl';

function Stat({ icon, label, value, to }) {
  const body = (
    <Card className="p-4 h-full hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-on-surface m-0 leading-tight">{value}</p>
          <p className="text-[11px] text-on-surface-variant m-0 truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
  return to ? <Link to={to} className="no-underline">{body}</Link> : body;
}

function completeness(page) {
  const c = page.content || {};
  return [
    { label: 'Tagline', done: !!page.tagline, to: '/institute/profile' },
    { label: 'About / stats', done: Object.values(c.aboutStats || {}).some(Boolean), to: '/institute/profile' },
    { label: 'Logo', done: !!page.logoUrl || !!page.logo_url, to: '/institute/profile' },
    { label: 'Banner images', done: (page.banners || []).length > 0, to: '/institute/profile' },
    { label: 'Gallery', done: (page.gallery || []).length > 0, to: '/institute/profile' },
    { label: 'Courses', done: (page.courses || []).length > 0, to: '/institute/courses' },
    { label: 'Facilities', done: (c.facilities || []).length > 0, to: '/institute/profile' },
    { label: 'Contact details', done: !!page.contact && !!page.address, to: '/institute/profile' },
  ];
}

export default function InstituteDashboard() {
  const { page } = useInstitute();
  const [apiCourses, setApiCourses] = useState([]);
  const [apiOpps, setApiOpps] = useState([]);

  useEffect(() => {
    if (!page?.id) return;
    fetchPageCourses(page.id).then((r) => Array.isArray(r) && setApiCourses(r)).catch(() => { });
    fetchPageOpportunities(page.id).then((r) => Array.isArray(r) && setApiOpps(r)).catch(() => { });
  }, [page?.id]);

  if (!page) return null;

  const courses = apiCourses.length > 0 ? apiCourses : (page.courses || []);
  const opportunities = apiOpps.length > 0 ? apiOpps : (page.opportunities || []);
  const notices = opportunities.filter((o) => o.type === 'admission');
  const jobs = opportunities.filter((o) => o.type === 'job');
  const published = opportunities.filter((o) => (o.status || 'Published') === 'Published');
  const drafts = opportunities.filter((o) => o.status === 'Draft');

  const checks = completeness(page);
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);


  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">{page.name}</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            {pageDisplayUrl(page)} · <Badge tone="primary" className="ml-1">{page.type}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/institute/notices"><Button size="sm" variant="soft" icon="campaign">Post Notice</Button></Link>
          <Link to="/institute/jobs"><Button size="sm" variant="soft" icon="work">Post Vacancy</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="menu_book" label="Courses" value={courses.length} to="/institute/courses" />
        <Stat icon="campaign" label="Admission Notices" value={notices.length} to="/institute/notices" />
        <Stat icon="work" label="Job Vacancies" value={jobs.length} to="/institute/jobs" />
        <Stat icon="group" label="Followers" value={(Number(page.followers_count || page.followers) || 0).toLocaleString()} />

      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-on-surface m-0">Recent Sell Leads</h3>
              <span className="text-xs text-on-surface-variant">
                {published.length} published · {drafts.length} draft
              </span>
            </div>
            {opportunities.length === 0 ? (
              <EmptyState
                compact
                icon="sell"
                title="No Sell Leads yet"
                description="Admission Notices and Job Vacancies you publish appear here and reach your followers' feeds."
              />
            ) : (
              <div className="divide-y divide-outline-variant">
                {opportunities.slice(0, 5).map((op) => (
                  <div key={op.id} className="py-2.5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      {op.type === 'admission' ? 'campaign' : 'work'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface m-0 truncate">
                        {op.course || op.title || op.position || 'Opportunity'}
                      </p>

                      <p className="text-[11px] text-on-surface-variant m-0">
                        Reach {op.reach?.toLocaleString() ?? 0} · Views {op.views?.toLocaleString() ?? 0}
                      </p>
                    </div>
                    <StatusBadge status={op.status || 'Published'} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-on-surface m-0">Courses</h3>
              <Link to="/institute/courses">
                <Button size="sm" variant="ghost" icon="arrow_forward">Manage</Button>
              </Link>
            </div>
            {courses.length === 0 ? (
              <EmptyState
                compact
                icon="menu_book"
                title="No courses added"
                description="Courses drive your public page, admission notices and enquiry forms."
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {courses.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs bg-surface-container-high px-3 py-1 rounded-lg text-on-surface-variant font-medium"
                  >
                    {c.name}
                    {c.status === 'Draft' && <span className="text-on-surface-variant/60"> · draft</span>}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-on-surface m-0 mb-1">Page completeness</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              {doneCount} of {checks.length} sections filled in
            </p>
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden mb-4">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <ul className="space-y-1.5 list-none p-0 m-0">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={`material-symbols-outlined text-[16px] ${c.done ? 'text-secondary' : 'text-on-surface-variant/50'
                      }`}
                  >
                    {c.done ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  {c.done ? (
                    <span className="text-on-surface-variant">{c.label}</span>
                  ) : (
                    <Link to={c.to} className="text-primary no-underline hover:underline">
                      {c.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-on-surface m-0 mb-1">Page admins</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Assigned by the Connectedus platform team.
            </p>
            <ul className="space-y-2 list-none p-0 m-0">
              {(page.admins || []).map((a) => (
                <li key={a.email || a.user_id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface m-0 truncate">{a.name || a.email}</p>
                    <p className="text-[10px] text-on-surface-variant m-0 truncate">{a.email}</p>
                  </div>
                  <Badge tone="neutral">{(a.role || 'Admin').includes('Owner') || a.role === 'OWNER' ? 'Owner' : 'Admin'}</Badge>
                </li>
              ))}
            </ul>

          </Card>
        </div>
      </div>
    </div>
  );
}
