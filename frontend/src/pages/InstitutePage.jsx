import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, FormGroup, Select } from '../components/ui/Field';
import { COURSE_SPECIALIZATIONS } from './mockData';
import { pageDisplayUrl } from '../utils/pageUrl';
import { KEY_HIGHLIGHTS_OPTIONS, FACILITIES_OPTIONS, buildAboutParagraph } from './pageBuilderContent';
import { useAuth } from '../context/AuthContext';
import { useLoginPrompt } from '../context/LoginPrompt';
import PageHeader from './PageHeader';
import SponsoredAdRail from '../components/SponsoredAdRail';
import StudyMaterialSection from '../components/StudyMaterialSection';
import {
  ApiError,
  resolveAssetUrl,
  resolvePageByPath,
  fetchPageCourses,
  fetchPageOpportunities,
  submitPageEnquiry,
  followPage,
  unfollowPage,
  fetchPagePapers,
  fetchPublicOpportunities,
  fetchPublicPapers,
  fetchPublicPages,
} from '../Api/Api';

function normalizeHighlights(options, items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') return { title: item, value: '✓', fieldLabel: '' };
      const matchedOpt = options.find((o) => o.key === item.key || o.id === item.id);
      return {
        title: item.title || item.label || matchedOpt?.label || matchedOpt?.title || 'Highlight',
        fieldLabel: item.fieldLabel || item.field || matchedOpt?.field || '',
        value: item.value || '',
      };
    })
    .filter((h) => h.value);
}

function normalizeFacilities(options, items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') return { name: item, value: 'Available', fieldLabel: '' };
      const matchedOpt = options.find((o) => o.key === item.key || o.id === item.id);
      return {
        name: item.name || item.label || matchedOpt?.label || 'Facility',
        fieldLabel: item.fieldLabel || item.field || matchedOpt?.field || 'Capacity',
        value: item.value || '',
        icon: item.icon || 'domain',
      };
    })
    .filter((f) => f.value);
}

function normalizeAchievements(ach) {
  if (!ach) return [];
  if (Array.isArray(ach)) {
    return ach
      .map((a) => ({
        title: a.title || a.label || 'Achievement',
        displayValue: `${a.prefix || ''}${a.value || ''}${a.suffix || ''}`,
      }))
      .filter((a) => a.displayValue.trim());
  }
  const list = [];
  if (ach.highestPlacement) list.push({ title: 'Highest Placement', displayValue: `₹${ach.highestPlacement} LPA` });
  if (ach.averagePlacement) list.push({ title: 'Average Placement', displayValue: `₹${ach.averagePlacement} LPA` });
  if (ach.placementRate) list.push({ title: 'Placement Rate', displayValue: `${ach.placementRate}%` });
  if (ach.recruiters) list.push({ title: 'Recruiters', displayValue: `${ach.recruiters}` });
  return list;
}


/** Two-letter monogram, shown when an institute has not uploaded a logo. */
function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Backend dates arrive as ISO strings (or null) rather than pre-formatted. */
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

// Public, read-only. Editing an opportunity belongs to the Institute Console
// (/institute/notices, /institute/jobs) so that the public page has a single
// job: showing published content to visitors.
function OpportunityCard({ op }) {
  const isAdmission = op.type === 'admission';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge tone={isAdmission ? 'success' : 'tertiary'}>
          {isAdmission ? 'Admission Open Notice' : 'Job Vacancy'}
        </Badge>
      </div>
      <h4 className="text-sm font-bold text-on-surface mb-1">
        {isAdmission ? op.title : op.position || op.title}
      </h4>
      {op.description && <p className="text-xs text-on-surface-variant mb-3">{op.description}</p>}
      <div className="grid grid-cols-2 gap-y-1 text-xs text-on-surface-variant mb-3">
        {isAdmission ? (
          <>
            <span>Session: {op.session || '—'}</span>
            <span>Eligibility: {op.eligibility || '—'}</span>
            <span>Starts: {formatDate(op.start_date)}</span>
            <span>Ends: {formatDate(op.end_date)}</span>
          </>
        ) : (
          <>
            <span>Subject: {op.subject || '—'}</span>
            <span>Experience: {op.experience || '—'}</span>
            <span>Qualification: {op.qualification || '—'}</span>
            <span>Apply before: {formatDate(op.apply_before)}</span>
          </>
        )}
      </div>
      {op.apply_url && (
        <p className="text-xs text-primary mb-0">Apply: {op.apply_url}</p>
      )}
    </Card>
  );
}

// The enquiry funnel that connects an Institute's public landing page to the
// marketplace behind it — deliberately shows only the institute's own name,
// never the platform's, per docs/CLIENT_FEEDBACK_2026-08-12.md Section 6.
//
// Anonymous visitors may submit: POST /pages/{id}/enquiries takes an optional
// user, and records who submitted only when somebody is signed in.
function EnquiryModal({ open, onClose, page, courses, course, setCourse, specialization, setSpecialization }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', state: '', city: '' });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = courses.find((c) => c.name === course);
  // Specializations come from the institute's own course record when it has
  // them, falling back to the platform's map for courses that carry none.
  const specializations = selectedCourse?.specializations?.length
    ? selectedCourse.specializations
    : COURSE_SPECIALIZATIONS[course] || [];

  const close = () => {
    onClose();
    // Reset after the close animation would run, so a reopen starts fresh.
    setTimeout(() => {
      setForm({ name: '', email: '', phone: '', state: '', city: '' });
      setSubmitted(false);
      setError('');
    }, 200);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // The enquiry is recorded against this institute so it appears in that
  // institute's console (/institute/enquiries) — enquiries belong to the
  // institute they were addressed to, not to the platform.
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await submitPageEnquiry(page.id, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        course_id: selectedCourse?.id,
        course_name: course || undefined,
        specialization: specialization || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your enquiry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} width={420}>
      {submitted ? (
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-secondary text-[44px]">check_circle</span>
          <h3 className="text-base font-bold text-on-surface mt-2 mb-1">Enquiry Submitted</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            {page.name} will contact you shortly about {course || 'your enquiry'}.
          </p>
          <Button size="sm" onClick={close}>Close</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
              {page.logo_url
                ? <img src={resolveAssetUrl(page.logo_url)} alt={page.name} className="w-full h-full object-cover" />
                : initials(page.name)}
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface mb-0">{page.name}</h3>
              <p className="text-xs text-on-surface-variant mb-0">Submit an Enquiry</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 mb-3">
            <FormGroup label="Select Course">
              <Select value={course} onChange={(e) => { setCourse(e.target.value); setSpecialization(''); }}>
                <option value="" disabled>Choose a course</option>
                {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Specialization">
              <Select value={specialization} onChange={(e) => setSpecialization(e.target.value)} disabled={!specializations.length}>
                <option value="" disabled>{specializations.length ? 'Choose one' : 'Select a course first'}</option>
                {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Input required placeholder="Full Name" value={form.name} onChange={set('name')} />
            <Input required type="email" placeholder="Email Address" value={form.email} onChange={set('email')} />
            <Input placeholder="Mobile Number" value={form.phone} onChange={set('phone')} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="State" value={form.state} onChange={set('state')} />
              <Input placeholder="City" value={form.city} onChange={set('city')} />
            </div>
            {error && (
              <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={!course || saving}>
              {saving ? 'Submitting…' : 'Submit Enquiry'}
            </Button>
          </form>
        </>
      )}
    </Modal>
  );
}

function FloatingEnquiryButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 items-center gap-2 bg-primary text-on-primary font-bold text-sm px-4 py-3 rounded-full shadow-lg hover:opacity-90 transition-all cursor-pointer"
    >
      <span className="material-symbols-outlined text-[20px]">edit_note</span>
      Submit Enquiry
    </button>
  );
}

/**
 * An institute's public page, at connectedus.in/college/sait/indore.
 *
 * PUBLIC and path-driven: it reads GET /pages/resolve?path=..., which serves
 * anonymous callers and hides disabled pages from everyone but their admins.
 * The URL carries type and city as well as the name, so two institutes with
 * the same name in different cities resolve to different pages.
 * Ownership is decided by `is_page_member` on that response — a real row in
 * page_admins, resolved server side, never by comparing the URL slug or an
 * email in the browser. Note `is_page_member`, NOT `is_page_admin`: the latter
 * is true for a Main Admin on every page, and keying the owner controls off it
 * put "Manage / Notices / Vacancies" on every institute for platform staff and
 * sent them into a console for an institute they have nothing to do with.
 */
export default function InstitutePage() {
  const { typeSegment, instituteSlug, citySegment } = useParams();
  // Rebuilt from the params rather than read off `location`, so a trailing
  // slash or a query string cannot change what gets looked up.
  const path = `/${[typeSegment, instituteSlug, citySegment].filter(Boolean).join('/')}`;
  const { user } = useAuth();
  const { openLogin } = useLoginPrompt();

  const [page, setPage] = useState(null);
  const [courses, setCourses] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [papers, setPapers] = useState([]);
  // [{ ...opportunity, org }] — the advertiser's name is resolved when the
  // rail loads, because OpportunityResponse carries only its page_id.
  const [sponsored, setSponsored] = useState([]);
  // Papers other institutes have cleared to run platform-wide.
  const [sharedPapers, setSharedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [course, setCourse] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError('');
    try {
      const detail = await resolvePageByPath(path);
      setPage(detail);
      setFollowing(!!detail.is_following);

      // Courses and opportunities are page-scoped resources, so they can only
      // be fetched once the path has resolved to an id. Both endpoints return
      // published items only to non-admins, enforced server side.
      const [c, o, p] = await Promise.allSettled([
        fetchPageCourses(detail.id),
        fetchPageOpportunities(detail.id),
        fetchPagePapers(detail.id),
      ]);
      setCourses(c.status === 'fulfilled' ? c.value : []);
      setOpportunities(o.status === 'fulfilled' ? o.value : []);
      setPapers(p.status === 'fulfilled' && Array.isArray(p.value) ? p.value : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(err instanceof ApiError ? err.message : 'Could not load this institute page.');
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Sponsored rail — ads a Main Admin has cleared to run across every
   * institute page (visibility: 'platform'). Eligibility is that explicit
   * decision, not something inferred here: the platform is selling placement
   * on a page the advertiser does not own, so nothing opts an institute in on
   * its behalf. The server applies both filters; this only orders the result.
   *
   * Loaded separately from `load` so a failure can never keep the institute's
   * own page from rendering — advertising is the least important thing here.
   */
  useEffect(() => {
    if (!page?.id) return undefined;
    let cancelled = false;

    Promise.allSettled([
      fetchPublicOpportunities({ limit: 20, visibility: 'platform', excludePageId: page.id }),
      fetchPublicPages(),
      fetchPublicPapers({ limit: 10, visibility: 'platform', excludePageId: page.id }),
    ])
      .then(([oppRes, pageRes, paperRes]) => {
        if (cancelled) return;

        const nameById = Object.fromEntries(
          (pageRes.status === 'fulfilled' && Array.isArray(pageRes.value) ? pageRes.value : [])
            .map((pg) => [pg.id, pg.name]),
        );

        if (paperRes.status === 'fulfilled' && Array.isArray(paperRes.value)) {
          setSharedPapers(paperRes.value.map((sp) => ({ ...sp, org: nameById[sp.page_id] })));
        }

        if (oppRes.status !== 'fulfilled' || !Array.isArray(oppRes.value)) return;

        // Same-city ads first, so the "near you" label is earned by whichever
        // ad leads the rail rather than being decoration.
        const here = (page.city || '').trim().toLowerCase();
        const isNear = (o) =>
          !!here && !!o.location && o.location.trim().toLowerCase().includes(here);
        const ordered = [...oppRes.value].sort((a, b) => Number(isNear(b)) - Number(isNear(a)));

        setSponsored(
          ordered.slice(0, 4).map((o) => ({ ...o, org: nameById[o.page_id], near: isNear(o) })),
        );
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [page?.id, page?.city]);

  const toggleFollow = async () => {
    if (!page) return;
    setFollowBusy(true);
    try {
      if (following) await unfollowPage(page.id);
      else await followPage(page.id);
      setFollowing((f) => !f);
    } catch {
      // A failed follow is not worth interrupting a public page for.
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-on-surface-variant py-12 text-center m-0">Loading…</p>;
  }

  if (notFound || !page) {
    return (
      <div>
        <PageHeader
          title="Page not found"
          subtitle={error || "This Institute Page doesn't exist or hasn't been published yet."}
        />
      </div>
    );
  }

  const openEnquiry = (preselectedCourse) => {
    if (preselectedCourse) setCourse(preselectedCourse);
    setEnquiryOpen(true);
  };

  // "This page is mine to run" — page_admins membership, and the only thing
  // that may reveal the Institute Console.
  const isMyPage = !!page.is_page_member;
  // Platform staff: full write access, but this institute is not theirs. They
  // get a link to the screen actually built for it instead of the console.
  const isPlatformAdmin = !isMyPage && !!page.is_page_admin;
  const content = page.content || {};
  const gallery = page.gallery || [];
  const banners = page.banners || [];
  const socials = Object.entries(page.social_links || {}).filter(([, v]) => v);
  const quickSelected = courses.find((c) => c.name === course);
  const quickSpecializations = quickSelected?.specializations?.length
    ? quickSelected.specializations
    : COURSE_SPECIALIZATIONS[course] || [];

  return (
    <div>
      <PageHeader
        title={isMyPage ? 'Institute Page' : page.name}
        subtitle={pageDisplayUrl(page)}
      />

      {/* Cover + logo */}
      <Card className="overflow-hidden mb-5">
        <div className="h-28 md:h-36 bg-gradient-to-r from-primary to-tertiary" />
        {banners.length > 0 && (
          <div className="grid grid-cols-3 gap-1 px-5 -mt-1">
            {banners.map((src, i) => (
              <img key={src} src={resolveAssetUrl(src)} alt={`${page.name} banner ${i + 1}`} className="w-full h-16 md:h-20 object-cover rounded" />
            ))}
          </div>
        )}
        <div className="p-5 pt-0">
          <div className="w-20 h-20 -mt-10 mb-3 rounded-2xl border-4 border-surface-container-lowest shadow-sm flex items-center justify-center text-xl font-bold text-primary bg-surface-container-high overflow-hidden">
            {page.logo_url
              ? <img src={resolveAssetUrl(page.logo_url)} alt={page.name} className="w-full h-full object-cover" />
              : initials(page.name)}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-on-surface m-0">{page.name}</h1>
                <Badge tone="primary">{page.type}</Badge>
              </div>
              {page.tagline && <p className="text-sm text-on-surface-variant italic mb-0.5">{page.tagline}</p>}
              <p className="text-xs text-on-surface-variant mb-0">
                {(page.followers_count || 0).toLocaleString()} followers
              </p>
            </div>
            <div className="flex gap-2">
              {isMyPage ? (
                /* Owner controls send you to the Institute Console rather than
                   editing in place — one place owns this institute's content. */
                <Link to="/institute">
                  <Button variant="outline" size="sm" icon="tune">Manage this page</Button>
                </Link>
              ) : isPlatformAdmin ? (
                /* Not this admin's institute — the platform console is where
                   they edit it, so never offer the Institute Console here. */
                <Link to={`/admin/pages/${page.id}`}>
                  <Button variant="outline" size="sm" icon="shield_person">
                    Open in Platform Admin
                  </Button>
                </Link>
              ) : user ? (
                <Button
                  size="sm"
                  variant={following ? 'outline' : 'primary'}
                  icon={following ? 'check' : 'add'}
                  disabled={followBusy}
                  onClick={toggleFollow}
                >
                  {following ? 'Following' : 'Follow'}
                </Button>
              ) : (
                /* Following needs an account, so an anonymous visitor is sent
                   to sign in rather than shown a button that cannot work. */
                <Link to="/">
                  <Button size="sm" icon="add">Sign in to follow</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-on-surface mb-2">About</h2>
            <p className="text-sm text-on-surface-variant mb-0">
              {buildAboutParagraph(page.name, content.aboutStats) || page.about || 'No description added yet.'}
            </p>
          </Card>

          {content.whyChooseUs?.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-on-surface mb-3">Why Choose Us</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {content.whyChooseUs.map((point) => (
                  <div key={point} className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                    {point}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {content.keyHighlights?.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-on-surface mb-3">Key Highlights</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {normalizeHighlights(KEY_HIGHLIGHTS_OPTIONS, content.keyHighlights).map((h, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-container-low text-center">
                    <p className="text-lg font-bold text-primary mb-0">{h.value}</p>
                    <p className="text-xs font-semibold text-on-surface mb-0">{h.title}</p>
                    {h.fieldLabel && <p className="text-[11px] text-on-surface-variant mb-0">{h.fieldLabel}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {content.facilities?.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-on-surface mb-3">Facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {normalizeFacilities(FACILITIES_OPTIONS, content.facilities).map((f, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-outline-variant flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">{f.icon || 'domain'}</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface mb-0.5">{f.name}</p>
                      <p className="text-xs text-on-surface-variant mb-0">{f.fieldLabel}: {f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {content.campusLife?.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-on-surface mb-3">Campus Life</h2>
              <div className="flex flex-wrap gap-1.5">
                {content.campusLife.map((c) => <Badge key={c} tone="tertiary">{c}</Badge>)}
              </div>
            </Card>
          )}

          {/* Promoted ads from nearby institutes. Visually separated from the
              institute's own content — see SponsoredAdRail.jsx. */}
          <SponsoredAdRail
            city={sponsored.some((o) => o.near) ? page.city : null}
            ads={sponsored.map((o) => ({
              id: o.id,
              type: o.type,
              title: o.type === 'job'
                ? `We Are Hiring – ${o.position || o.title}`
                : o.title,
              org: o.org,
              meta: [o.location, o.experience].filter(Boolean).join(' · '),
              href: o.apply_url || '/',
              external: !!o.apply_url,
            }))}
          />

          {normalizeAchievements(content.achievements).length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-on-surface mb-3">Achievements &amp; Placement</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {normalizeAchievements(content.achievements).map((a, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-primary-container/30 text-center">
                    <p className="text-lg font-bold text-primary mb-0">{a.displayValue}</p>
                    <p className="text-[11px] text-on-surface-variant mb-0">{a.title}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}


          {/* Courses — INSTITUTE-OWNED, managed at /institute/courses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-on-surface">Courses Offered</h2>
              {isMyPage && (
                <Link to="/institute/courses">
                  <Button size="sm" variant="ghost" icon="tune">Manage</Button>
                </Link>
              )}
            </div>
            {courses.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourseDetail(c)}
                    className="text-left p-4 rounded-xl border border-outline-variant hover:border-primary transition-colors cursor-pointer bg-transparent"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-on-surface m-0">{c.name}</p>
                      {c.admission_open && <Badge tone="success">Open</Badge>}
                    </div>
                    <p className="text-[11px] text-on-surface-variant m-0 mb-2">
                      {[c.category, c.level].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
                      {c.duration && <span><strong className="text-on-surface">{c.duration}</strong> duration</span>}
                      {c.fees && <span><strong className="text-on-surface">₹{c.fees}</strong></span>}
                      {c.intake && <span><strong className="text-on-surface">{c.intake}</strong> seats</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant mb-0">No courses listed yet.</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-on-surface">Opportunities</h2>
              {isMyPage && (
                <div className="flex gap-2">
                  <Link to="/institute/notices">
                    <Button size="sm" variant="soft" icon="campaign">Notices</Button>
                  </Link>
                  <Link to="/institute/jobs">
                    <Button size="sm" variant="soft" icon="work">Vacancies</Button>
                  </Link>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {opportunities.length > 0 ? (
                opportunities.map((op) => <OpportunityCard key={op.id} op={op} />)
              ) : (
                <p className="text-sm text-on-surface-variant mb-0">No opportunities posted yet.</p>
              )}
            </div>
          </Card>

          <StudyMaterialSection
            papers={papers}
            sharedPapers={sharedPapers}
            isMyPage={isMyPage}
            onRequireLogin={openLogin}
          />

          {/* Gallery — INSTITUTE-OWNED, managed at /institute/profile */}
          {gallery.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-on-surface mb-3">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((img) => (
                  <figure key={img.id || img.url} className="m-0">
                    <img
                      src={resolveAssetUrl(img.url)}
                      alt={img.caption || page.name}
                      className="w-full h-28 object-cover rounded-xl border border-outline-variant"
                    />
                    {img.caption && (
                      <figcaption className="text-[11px] text-on-surface-variant mt-1">{img.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-on-surface mb-3">Details</h2>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              {(page.address || page.city || page.state) && (
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  {[page.address, page.city, page.state].filter(Boolean).join(', ')}
                </li>
              )}
              {page.website && (
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">language</span>
                  {page.website}
                </li>
              )}
              {page.contact && (
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  {page.contact}
                </li>
              )}
              {page.affiliation && (
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  {page.affiliation}
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant">
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noreferrer"
                    title={key}
                    className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary no-underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </a>
                ))}
              </div>
            )}
            <h3 className="text-sm font-bold text-on-surface mt-4 mb-2">Courses</h3>
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => (
                <button key={c.id} type="button" onClick={() => openEnquiry(c.name)} className="cursor-pointer bg-transparent border-none p-0">
                  <Badge tone="neutral">{c.name}</Badge>
                </button>
              ))}
              {courses.length === 0 && (
                <p className="text-xs text-on-surface-variant mb-0">No courses listed yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-on-surface mb-1">Quick Enquiry</h2>
            <p className="text-xs text-on-surface-variant mb-3">
              Pick a course and specialization — we&apos;ll take it from there.
            </p>
            <div className="space-y-3">
              <Select value={course} onChange={(e) => { setCourse(e.target.value); setSpecialization(''); }}>
                <option value="" disabled>Select Course</option>
                {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </Select>
              <Select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                disabled={!quickSpecializations.length}
              >
                <option value="" disabled>Select Specialization</option>
                {quickSpecializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Button size="sm" className="w-full" onClick={() => openEnquiry()} disabled={!course}>
                Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Public course detail — the enquiry funnel's entry point from a course */}
      <Modal open={!!courseDetail} onClose={() => setCourseDetail(null)} width={440}>
        {courseDetail && (
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-on-surface m-0">{courseDetail.name}</h3>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                  {[courseDetail.category, courseDetail.level].filter(Boolean).join(' · ')}
                </p>
              </div>
              {courseDetail.admission_open && <Badge tone="success">Admissions Open</Badge>}
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 grid grid-cols-2 gap-3 mb-4 border border-outline-variant text-xs">
              <div><span className="text-on-surface-variant">Duration</span><p className="font-semibold text-on-surface m-0">{courseDetail.duration || '—'}</p></div>
              <div><span className="text-on-surface-variant">Fees</span><p className="font-semibold text-on-surface m-0">{courseDetail.fees ? `₹${courseDetail.fees}` : '—'}</p></div>
              <div><span className="text-on-surface-variant">Intake</span><p className="font-semibold text-on-surface m-0">{courseDetail.intake || '—'}</p></div>
              <div><span className="text-on-surface-variant">Eligibility</span><p className="font-semibold text-on-surface m-0">{courseDetail.eligibility || '—'}</p></div>
            </div>

            {courseDetail.specializations?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-on-surface-variant mb-1.5">Specializations</p>
                <div className="flex flex-wrap gap-1.5">
                  {courseDetail.specializations.map((s) => <Badge key={s} tone="tertiary">{s}</Badge>)}
                </div>
              </div>
            )}

            {courseDetail.description && (
              <p className="text-sm text-on-surface-variant mb-4">{courseDetail.description}</p>
            )}

            <div className="flex gap-2 justify-end border-t border-outline-variant pt-4">
              <Button variant="outline" size="sm" onClick={() => setCourseDetail(null)}>Close</Button>
              <Button
                size="sm"
                icon="edit_note"
                onClick={() => { const name = courseDetail.name; setCourseDetail(null); openEnquiry(name); }}
              >
                Enquire about this course
              </Button>
            </div>
          </>
        )}
      </Modal>

      <FloatingEnquiryButton onClick={() => openEnquiry()} />
      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        page={page}
        courses={courses}
        course={course}
        setCourse={setCourse}
        specialization={specialization}
        setSpecialization={setSpecialization}
      />
    </div>
  );
}
