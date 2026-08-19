import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea, FormGroup } from '../components/ui/Field';
import { findPageBySlug, MY_PAGE_SLUG } from './mockData';
import PageHeader from './PageHeader';

export default function PostAdmissionNotice() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    course: '',
    session: '',
    startDate: '',
    endDate: '',
    eligibility: '',
    description: '',
  });
  const [posted, setPosted] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (posted) {
    return (
      <div>
        <PageHeader title="Admission Open Notice Posted" />
        <Card className="p-6 text-center">
          <span className="material-symbols-outlined text-secondary text-[48px]">check_circle</span>
          <h3 className="text-lg font-bold text-on-surface mt-2">"{form.course}" notice is live on your page</h3>
          <Button className="mt-4" onClick={() => navigate('/page')}>Back to Institute Page</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Post Admission Open Notice"
        subtitle="Course / Session / Admission Start Date / Admission End Date / Eligibility / Description"
      />
      <Card className="p-5 max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const page = findPageBySlug(MY_PAGE_SLUG);
            page.opportunities.unshift({
              id: `op-${Date.now()}`,
              type: 'admission',
              ...form,
              reach: 0,
              views: 0,
              ranking: page.opportunities.length + 1,
            });
            setPosted(true);
          }}
        >
          <FormGroup label="Course">
            <Input required value={form.course} onChange={set('course')} placeholder="e.g. JEE Advanced Crash Course" />
          </FormGroup>
          <FormGroup label="Session">
            <Input required value={form.session} onChange={set('session')} placeholder="e.g. 2026-27" />
          </FormGroup>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormGroup label="Admission Start Date">
              <Input type="date" required value={form.startDate} onChange={set('startDate')} />
            </FormGroup>
            <FormGroup label="Admission End Date">
              <Input type="date" required value={form.endDate} onChange={set('endDate')} />
            </FormGroup>
          </div>
          <FormGroup label="Eligibility">
            <Input value={form.eligibility} onChange={set('eligibility')} placeholder="e.g. Class 12 pass / appearing, PCM" />
          </FormGroup>
          <FormGroup label="Description">
            <Textarea rows={4} value={form.description} onChange={set('description')} placeholder="Details students should know" />
          </FormGroup>
          <Button type="submit" icon="campaign">Publish Notice</Button>
        </form>
      </Card>
    </div>
  );
}
