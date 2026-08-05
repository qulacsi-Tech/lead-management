import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, FormGroup } from '../../components/ui/Field';
import { mockPage, mockOpportunities } from './mockData';
import PageHeader from './PageHeader';

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

export default function InstitutePage() {
  const [admins, setAdmins] = useState(mockPage.admins);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', course: '' });
  const [enquirySent, setEnquirySent] = useState(false);

  const addAdmin = (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAdmins((a) => [...a, { name: newAdminEmail.split('@')[0], role: 'Admin', email: newAdminEmail }]);
    setNewAdminEmail('');
    setAdminModalOpen(false);
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
              <p className="text-xs text-on-surface-variant">{mockPage.followers.toLocaleString()} followers</p>
            </div>
            <Button variant="outline" size="sm" icon="group_add">Add Admin</Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-2">About</h4>
            <p className="text-sm text-on-surface-variant mb-0">{mockPage.about}</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-on-surface">Opportunities</h4>
              <div className="flex gap-2">
                <Link to="/prototype/page/post-admission">
                  <Button size="sm" variant="soft" icon="campaign">Post Admission Notice</Button>
                </Link>
                <Link to="/prototype/page/post-job">
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
                <Badge key={c} tone="neutral">{c}</Badge>
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
            <h4 className="text-sm font-bold text-on-surface mb-3">Enquiry Form</h4>
            {enquirySent ? (
              <p className="text-sm text-secondary font-semibold mb-0">Thanks! The institute will contact you shortly.</p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEnquirySent(true);
                }}
              >
                <Input
                  placeholder="Your name"
                  value={enquiry.name}
                  onChange={(e) => setEnquiry((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Phone number"
                  value={enquiry.phone}
                  onChange={(e) => setEnquiry((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Course interested in"
                  value={enquiry.course}
                  onChange={(e) => setEnquiry((f) => ({ ...f, course: e.target.value }))}
                />
                <Button type="submit" size="sm" className="w-full">Send Enquiry</Button>
              </form>
            )}
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
    </div>
  );
}
