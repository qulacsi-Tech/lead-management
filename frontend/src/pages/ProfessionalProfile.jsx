import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import { FormGroup } from '../components/ui/Field';
import { mockProfessional, PROFESSIONAL_CATEGORIES } from './mockData';
import { useSession } from '../context/useSession';
import PageHeader from './PageHeader';

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            value === opt
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function AccountSetupCard() {
  const { role, category, updateAccount } = useSession();

  return (
    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary">settings_account_box</span>
        <h4 className="text-sm font-bold text-on-surface mb-0">Account Setup</h4>
        {!role && <Badge tone="error">Action needed</Badge>}
      </div>
      <p className="text-xs text-on-surface-variant mb-4">
        Your account type, category and Institute Page all live here — not on the signup form.
      </p>

      <FormGroup label="I am">
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => updateAccount({ role: 'professional', category: category || PROFESSIONAL_CATEGORIES[0] })}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
              role === 'professional'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined block mb-1">badge</span>
            Professional
          </button>
          <button
            type="button"
            onClick={() => updateAccount({ role: 'student', category: undefined })}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
              role === 'student'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined block mb-1">school</span>
            Student
          </button>
        </div>
      </FormGroup>

      {role === 'professional' && (
        <div className="mt-4">
          <FormGroup label="Professional category">
            <ChipGroup
              options={PROFESSIONAL_CATEGORIES}
              value={category}
              onChange={(c) => updateAccount({ category: c })}
            />
          </FormGroup>
        </div>
      )}

      {role === 'professional' && (
        <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-on-surface-variant mb-0">Want to create an Institute Page too?</p>
          <Link to="/create-page">
            <Button size="sm" variant="soft" icon="add_business">Create Institute Page</Button>
          </Link>
        </div>
      )}

      {role === 'student' && (
        <p className="text-xs text-on-surface-variant mt-3 mb-0">
          As a Student you won't see "Looking for a Job" or "Expert Opinion", and can't create a Page.
        </p>
      )}
    </Card>
  );
}

export default function ProfessionalProfile() {
  const p = mockProfessional;

  return (
    <div>
      <PageHeader
        title="Professional Profile"
        subtitle="LinkedIn-style profile — Followers / Likes / Downloads / Reputation Score / Recommendations."
      />

      <AccountSetupCard />

      <Card className="overflow-hidden mb-5">
        <div className="h-24 md:h-32 bg-gradient-to-r from-tertiary to-primary" />
        <div className="p-5 pt-0">
          <div className="w-20 h-20 -mt-10 mb-3 rounded-full bg-surface-container-high border-4 border-surface-container-lowest flex items-center justify-center text-xl font-bold text-primary">
            {p.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-[200px]">
              <h3 className="text-lg font-bold text-on-surface">{p.name}</h3>
              <p className="text-sm text-on-surface-variant mb-1">{p.headline}</p>
              <Badge tone="primary">{p.category}</Badge>
            </div>
            <Button variant="outline" size="sm" icon="edit">Edit Profile</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <StatCard icon="group" iconBg="var(--color-primary-container)" iconColor="var(--color-primary)" label="Followers" value={p.stats.followers} />
        <StatCard icon="thumb_up" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" label="Likes" value={p.stats.likes} />
        <StatCard icon="download" iconBg="var(--color-tertiary-fixed)" iconColor="var(--color-tertiary)" label="Downloads" value={p.stats.downloads} />
        <StatCard icon="military_tech" iconBg="var(--color-primary-container)" iconColor="var(--color-primary)" label="Reputation" value={p.stats.reputationScore} />
        <StatCard icon="verified" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" label="Recommendations" value={p.stats.recommendations} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-2">About</h4>
            <p className="text-sm text-on-surface-variant mb-0">{p.about}</p>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-3">Qualification & Experience</h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Qualification</p>
                <p className="text-on-surface font-semibold mb-0">{p.qualification}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Experience</p>
                <p className="text-on-surface font-semibold mb-0">{p.experience}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Current Institute</p>
                <p className="text-on-surface font-semibold mb-0">{p.currentInstitute}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Previous Institutes</p>
                <p className="text-on-surface font-semibold mb-0">{p.previousInstitutes.join(', ')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-2">Subjects</h4>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.subjects.map((s) => (
                <Badge key={s} tone="neutral">{s}</Badge>
              ))}
            </div>
            <h4 className="text-sm font-bold text-on-surface mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <Badge key={s} tone="tertiary">{s}</Badge>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-3">Resume</h4>
            {p.resumeUploaded ? (
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary">description</span>
                Resume.pdf
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ) : (
              <Button variant="soft" size="sm" icon="upload">Upload Resume</Button>
            )}
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-3">Contact Details</h4>
            <p className="text-sm text-on-surface-variant mb-0">{p.contact}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
