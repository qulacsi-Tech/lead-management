import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, FormGroup, Select } from '../components/ui/Field';
import { mockPage, mockPageContent, mockOpportunities, COURSE_SPECIALIZATIONS, EXISTING_ENQUIRY_USER } from './mockData';
import { KEY_HIGHLIGHTS_OPTIONS, FACILITIES_OPTIONS, buildAboutParagraph } from './pageBuilderContent';
import PageHeader from './PageHeader';

function statCardsFrom(options, selected) {
  return selected
    .map((s) => ({ ...options.find((o) => o.key === s.key), value: s.value }))
    .filter((s) => s.label);
}

function OpportunityCard({ op }) {
  const isAdmission = op.type === 'admission';
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge tone={isAdmission ? 'success' : 'tertiary'}>
          {isAdmission ? 'Admission Open Notice' : 'Job Vacancy'}
        </Badge>
        <span className="text-xs text-on-surface-variant">Ranking #{op.ranking}</span>
      </div>
      <h4 className="text-sm font-bold text-on-surface mb-1">
        {isAdmission ? op.course : op.position}
      </h4>
      <p className="text-xs text-on-surface-variant mb-3">{op.description}</p>
      <div className="grid grid-cols-2 gap-y-1 text-xs text-on-surface-variant mb-3">
        {isAdmission ? (
          <>
            <span>Session: {op.session}</span>
            <span>Eligibility: {op.eligibility}</span>
            <span>Starts: {op.startDate}</span>
            <span>Ends: {op.endDate}</span>
          </>
        ) : (
          <>
            <span>Subject: {op.subject}</span>
            <span>Experience: {op.experience}</span>
            <span>Qualification: {op.qualification}</span>
            <span>Apply before: {op.applyBefore}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-on-surface-variant border-t border-outline-variant pt-2">
        <span>Reach {op.reach}</span>
        <span>Views {op.views}</span>
        <Button variant="ghost" size="sm" icon="edit">Edit</Button>
        <Button variant="ghost" size="sm" icon="arrow_upward">Push to top</Button>
      </div>
    </Card>
  );
}

// The enquiry funnel that connects an Institute's public landing page to the
// marketplace behind it — deliberately shows only the institute's own name,
// never the platform's, per docs/CLIENT_FEEDBACK_2026-08-12.md Section 6.
function EnquiryModal({ open, onClose, page, course, setCourse, specialization, setSpecialization }) {
  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [newUser, setNewUser] = useState({ name: '', email: '', mobile: '', otp: '', state: '', city: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [existingPhone, setExistingPhone] = useState('');
  const [existingMatch, setExistingMatch] = useState(null); // null | user object | false (not found)
  const [submitted, setSubmitted] = useState(false);

  const specializations = COURSE_SPECIALIZATIONS[course] || [];

  const close = () => {
    onClose();
    // Reset after the close animation would run, so a reopen starts fresh.
    setTimeout(() => {
      setMode('new');
      setNewUser({ name: '', email: '', mobile: '', otp: '', state: '', city: '' });
      setOtpSent(false);
      setExistingPhone('');
      setExistingMatch(null);
      setSubmitted(false);
    }, 200);
  };

  const submitNewUser = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const lookupExisting = (e) => {
    e.preventDefault();
    setExistingMatch(existingPhone.trim() === EXISTING_ENQUIRY_USER.phone ? EXISTING_ENQUIRY_USER : false);
  };

  const submitExisting = () => setSubmitted(true);

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
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {page.logo}
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
                {page.courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Specialization">
              <Select value={specialization} onChange={(e) => setSpecialization(e.target.value)} disabled={!specializations.length}>
                <option value="" disabled>{specializations.length ? 'Choose one' : 'Select a course first'}</option>
                {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>
          </div>

          <div className="flex gap-2 mb-4 border-b border-outline-variant">
            {[{ key: 'new', label: 'New User' }, { key: 'existing', label: 'Existing User' }].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setMode(t.key)}
                className={`px-3 py-2 text-sm font-semibold cursor-pointer border-b-2 -mb-px transition-colors ${
                  mode === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === 'new' ? (
            <form onSubmit={submitNewUser} className="space-y-3">
              <Input
                required placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                required type="email" placeholder="Email Address"
                value={newUser.email}
                onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))}
              />
              <div className="flex gap-2">
                <Input
                  required placeholder="Mobile Number"
                  value={newUser.mobile}
                  onChange={(e) => setNewUser((f) => ({ ...f, mobile: e.target.value }))}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setOtpSent(true)} disabled={!newUser.mobile || otpSent}>
                  {otpSent ? 'Sent' : 'Send OTP'}
                </Button>
              </div>
              {otpSent && (
                <Input
                  required placeholder="Enter OTP"
                  value={newUser.otp}
                  onChange={(e) => setNewUser((f) => ({ ...f, otp: e.target.value }))}
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="State" value={newUser.state} onChange={(e) => setNewUser((f) => ({ ...f, state: e.target.value }))} />
                <Input placeholder="City" value={newUser.city} onChange={(e) => setNewUser((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={!course || (otpSent && !newUser.otp)}>
                Submit Enquiry
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              {existingMatch === null && (
                <form onSubmit={lookupExisting} className="space-y-3">
                  <Input
                    required placeholder="Registered mobile number"
                    value={existingPhone}
                    onChange={(e) => setExistingPhone(e.target.value)}
                  />
                  <Button type="submit" className="w-full">Find My Account</Button>
                </form>
              )}
              {existingMatch === false && (
                <p className="text-sm text-error mb-0">
                  No account found with that number. Try "New User" instead.
                </p>
              )}
              {existingMatch && (
                <div>
                  <p className="text-sm text-on-surface mb-3">
                    Welcome back, <strong>{existingMatch.name}</strong>.
                  </p>
                  <Button className="w-full" disabled={!course} onClick={submitExisting}>
                    Submit my application
                  </Button>
                </div>
              )}
            </div>
          )}
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

export default function InstitutePage() {
  const [admins, setAdmins] = useState(mockPage.admins);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [course, setCourse] = useState('');
  const [specialization, setSpecialization] = useState('');

  const addAdmin = (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAdmins((a) => [...a, { name: newAdminEmail.split('@')[0], role: 'Admin', email: newAdminEmail }]);
    setNewAdminEmail('');
    setAdminModalOpen(false);
  };

  const openEnquiry = (preselectedCourse) => {
    if (preselectedCourse) setCourse(preselectedCourse);
    setEnquiryOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Institute Page"
        subtitle="Landing page: Logo / Cover / About / Address / Website / Contact / Courses / Enquiry form."
      />

      {/* Cover + logo */}
      <Card className="overflow-hidden mb-5">
        <div className="h-28 md:h-36 bg-gradient-to-r from-primary to-tertiary" />
        {mockPage.banners?.length > 0 && (
          <div className="grid grid-cols-3 gap-1 px-5 -mt-1">
            {mockPage.banners.map((src, i) => (
              <img key={i} src={src} alt={`Banner ${i + 1}`} className="w-full h-16 md:h-20 object-cover rounded" />
            ))}
          </div>
        )}
        <div className="p-5 pt-0">
          <div className="w-20 h-20 -mt-10 mb-3 rounded-2xl border-4 border-surface-container-lowest shadow-sm flex items-center justify-center text-xl font-bold text-primary bg-surface-container-high">
            {mockPage.logo}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-on-surface">{mockPage.name}</h3>
                <Badge tone="primary">{mockPage.type}</Badge>
              </div>
              {mockPage.tagline && <p className="text-sm text-on-surface-variant italic mb-0.5">{mockPage.tagline}</p>}
              <p className="text-xs text-on-surface-variant mb-0">{mockPage.followers.toLocaleString()} followers</p>
            </div>
            <div className="flex gap-2">
              <Link to="/page/edit">
                <Button variant="outline" size="sm" icon="edit_square">Edit Page</Button>
              </Link>
              <Button variant="outline" size="sm" icon="group_add">Add Admin</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-2">About</h4>
            <p className="text-sm text-on-surface-variant mb-0">
              {buildAboutParagraph(mockPage.name, mockPageContent.aboutStats) || mockPage.about}
            </p>
          </Card>

          {mockPageContent.whyChooseUs?.length > 0 && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-on-surface mb-3">Why Choose Us</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {mockPageContent.whyChooseUs.map((point) => (
                  <div key={point} className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                    {point}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {mockPageContent.keyHighlights?.length > 0 && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-on-surface mb-3">Key Highlights</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statCardsFrom(KEY_HIGHLIGHTS_OPTIONS, mockPageContent.keyHighlights).map((h) => (
                  <div key={h.key} className="p-3 rounded-xl bg-surface-container-low text-center">
                    <p className="text-lg font-bold text-primary mb-0">{h.value}</p>
                    <p className="text-[11px] text-on-surface-variant mb-0">{h.field}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {mockPageContent.facilities?.length > 0 && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-on-surface mb-3">Facilities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {statCardsFrom(FACILITIES_OPTIONS, mockPageContent.facilities).map((f) => (
                  <div key={f.key} className="p-3 rounded-xl border border-outline-variant">
                    <p className="text-sm font-bold text-on-surface mb-0.5">{f.label}</p>
                    <p className="text-xs text-on-surface-variant mb-0">{f.field}: {f.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {mockPageContent.campusLife?.length > 0 && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-on-surface mb-3">Campus Life</h4>
              <div className="flex flex-wrap gap-1.5">
                {mockPageContent.campusLife.map((c) => <Badge key={c} tone="tertiary">{c}</Badge>)}
              </div>
            </Card>
          )}

          {mockPageContent.achievements && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-on-surface mb-3">Achievements & Placement</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-primary-container/30 text-center">
                  <p className="text-lg font-bold text-primary mb-0">₹{mockPageContent.achievements.highestPlacement} LPA</p>
                  <p className="text-[11px] text-on-surface-variant mb-0">Highest Placement</p>
                </div>
                <div className="p-3 rounded-xl bg-primary-container/30 text-center">
                  <p className="text-lg font-bold text-primary mb-0">₹{mockPageContent.achievements.averagePlacement} LPA</p>
                  <p className="text-[11px] text-on-surface-variant mb-0">Average Placement</p>
                </div>
                <div className="p-3 rounded-xl bg-primary-container/30 text-center">
                  <p className="text-lg font-bold text-primary mb-0">{mockPageContent.achievements.placementRate}%</p>
                  <p className="text-[11px] text-on-surface-variant mb-0">Placement Rate</p>
                </div>
                <div className="p-3 rounded-xl bg-primary-container/30 text-center">
                  <p className="text-lg font-bold text-primary mb-0">{mockPageContent.achievements.recruiters}</p>
                  <p className="text-[11px] text-on-surface-variant mb-0">Recruiters</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-on-surface">Opportunities</h4>
              <div className="flex gap-2">
                <Link to="/page/post-admission">
                  <Button size="sm" variant="soft" icon="campaign">Post Admission Notice</Button>
                </Link>
                <Link to="/page/post-job">
                  <Button size="sm" variant="soft" icon="work">Post Job Vacancy</Button>
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {mockOpportunities.map((op) => (
                <OpportunityCard key={op.id} op={op} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-3">Details</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {mockPage.address}
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">language</span>
                {mockPage.website}
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">call</span>
                {mockPage.contact}
              </li>
            </ul>
            <h4 className="text-sm font-bold text-on-surface mt-4 mb-2">Courses</h4>
            <div className="flex flex-wrap gap-1.5">
              {mockPage.courses.map((c) => (
                <button key={c} type="button" onClick={() => openEnquiry(c)} className="cursor-pointer">
                  <Badge tone="neutral">{c}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-on-surface">Page Admins</h4>
              <Button size="sm" variant="ghost" icon="add" onClick={() => setAdminModalOpen(true)}>
                Add
              </Button>
            </div>
            <ul className="space-y-2">
              {admins.map((a) => (
                <li key={a.email} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-on-surface font-semibold mb-0">{a.name}</p>
                    <p className="text-xs text-on-surface-variant mb-0">{a.email}</p>
                  </div>
                  <Badge tone="neutral">{a.role}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-1">Quick Enquiry</h4>
            <p className="text-xs text-on-surface-variant mb-3">
              Pick a course and specialization — we'll take it from there.
            </p>
            <div className="space-y-3">
              <Select value={course} onChange={(e) => { setCourse(e.target.value); setSpecialization(''); }}>
                <option value="" disabled>Select Course</option>
                {mockPage.courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                disabled={!(COURSE_SPECIALIZATIONS[course] || []).length}
              >
                <option value="" disabled>Select Specialization</option>
                {(COURSE_SPECIALIZATIONS[course] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Button size="sm" className="w-full" onClick={() => openEnquiry()} disabled={!course}>
                Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} width={360}>
        <h3 className="text-base font-bold text-on-surface mb-3">Add Page Admin</h3>
        <form onSubmit={addAdmin} className="space-y-3">
          <FormGroup label="Admin email">
            <Input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </FormGroup>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdminModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">Add Admin</Button>
          </div>
        </form>
      </Modal>

      <FloatingEnquiryButton onClick={() => openEnquiry()} />
      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        page={mockPage}
        course={course}
        setCourse={setCourse}
        specialization={specialization}
        setSpecialization={setSpecialization}
      />
    </div>
  );
}
