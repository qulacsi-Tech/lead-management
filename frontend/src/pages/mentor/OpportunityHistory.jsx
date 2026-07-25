import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';

const TONE_CLASSES = {
  success: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-fixed text-primary',
  neutral: 'bg-surface-container-highest text-on-surface-variant',
};

const PAST_ITEMS = [
  { title: 'Data Science Lecturer', meta: 'Posted 2 days ago · 14 Applicants', status: 'Active', icon: 'check_circle', tone: 'success' },
  { title: 'Senior Physics Mentor', meta: 'Closed last week · Position Filled', status: 'Closed', icon: 'cancel', tone: 'neutral' },
  { title: 'Chemistry Lab Assistant', meta: 'Closed 3 weeks ago · Position Filled', status: 'Closed', icon: 'cancel', tone: 'neutral' },
  { title: 'Guest Lecture: Data Ethics', meta: 'Closed 1 month ago · 42 Attendees', status: 'Closed', icon: 'cancel', tone: 'neutral' },
];

function statusMeta(status) {
  if (status === 'verified') return { label: 'Verified', tone: 'success', icon: 'check_circle' };
  if (status === 'converted') return { label: 'Converted', tone: 'success', icon: 'check_circle' };
  if (status === 'hot' || status === 'interested') return { label: 'Under Review', tone: 'primary', icon: 'pending' };
  return { label: 'Pending', tone: 'primary', icon: 'pending' };
}

export default function OpportunityHistory() {
  const { displayName } = useAuth();
  const { leadsFor } = useData();
  const referrals = leadsFor(displayName);

  return (
    <div className="max-w-4xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-primary m-0">Opportunity Status History</h2>
        <p className="text-on-surface-variant m-0 mt-1">Full history of your job posts and college referrals.</p>
      </div>

      {referrals.length > 0 && (
        <Card className="overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide m-0">Your College Referrals</h3>
          </div>
          {referrals.map((r) => {
            const meta = statusMeta(r.status);
            return (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${TONE_CLASSES[meta.tone]}`}>
                    <span className="material-symbols-outlined">{meta.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold m-0">{r.name} · {r.course}</p>
                    <p className="text-xs text-on-surface-variant m-0">Submitted {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${TONE_CLASSES[meta.tone]}`}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wide m-0">Job Postings</h3>
        </div>
        {PAST_ITEMS.map((item) => (
          <div key={item.title} className="px-6 py-4 flex items-center justify-between border-t border-outline-variant">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${TONE_CLASSES[item.tone]}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold m-0">{item.title}</p>
                <p className="text-xs text-on-surface-variant m-0">{item.meta}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${TONE_CLASSES[item.tone]}`}>
              {item.status}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
