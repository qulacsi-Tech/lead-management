import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea, FormGroup } from '../components/ui/Field';
import { findPageByAdminEmail } from './mockData';
import PageHeader from './PageHeader';
import { useAuth } from '../context/AuthContext';

export default function PostJobVacancy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myPage = findPageByAdminEmail(user?.email);
  const [form, setForm] = useState({
    position: '',
    subject: '',
    experience: '',
    qualification: '',
    applyBefore: '',
    description: '',
  });
  const [posted, setPosted] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!myPage) {
    return (
      <div>
        <PageHeader title="You don't have an Institute Page yet" subtitle="Create one before posting a Job Vacancy." />
        <Button onClick={() => navigate('/create-page')}>Create Institute Page</Button>
      </div>
    );
  }

  if (posted) {
    return (
      <div>
        <PageHeader title="Job Vacancy Posted" />
        <Card className="p-6 text-center">
          <span className="material-symbols-outlined text-secondary text-[48px]">check_circle</span>
          <h3 className="text-lg font-bold text-on-surface mt-2">"{form.position}" vacancy is live on your page</h3>
          <Button className="mt-4" onClick={() => navigate('/page')}>Back to Institute Page</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Post Job Vacancy Notification"
        subtitle="Position / Subject / Experience / Qualification / Apply Before / Description"
      />
      <Card className="p-5 max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            myPage.opportunities.unshift({
              id: `op-${Date.now()}`,
              type: 'job',
              ...form,
              reach: 0,
              views: 0,
              ranking: myPage.opportunities.length + 1,
            });
            setPosted(true);
          }}
        >
          <FormGroup label="Position">
            <Input required value={form.position} onChange={set('position')} placeholder="e.g. Physics Faculty" />
          </FormGroup>
          <FormGroup label="Subject">
            <Input required value={form.subject} onChange={set('subject')} placeholder="e.g. Physics" />
          </FormGroup>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormGroup label="Experience">
              <Input value={form.experience} onChange={set('experience')} placeholder="e.g. 3+ years" />
            </FormGroup>
            <FormGroup label="Qualification">
              <Input value={form.qualification} onChange={set('qualification')} placeholder="e.g. M.Sc Physics" />
            </FormGroup>
          </div>
          <FormGroup label="Apply Before">
            <Input type="date" required value={form.applyBefore} onChange={set('applyBefore')} />
          </FormGroup>
          <FormGroup label="Description">
            <Textarea rows={4} value={form.description} onChange={set('description')} placeholder="Role details, batch info, campus location, etc." />
          </FormGroup>
          <Button type="submit" icon="work">Publish Vacancy</Button>
        </form>
      </Card>
    </div>
  );
}
