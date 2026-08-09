import { useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Select, FormGroup } from '../components/ui/Field';
import { mockSearchResults } from './mockData';
import PageHeader from './PageHeader';

const FILTERS = ['Job', 'Admission', 'Subject', 'Location', 'Preferred Location', 'Experience'];

function ProfileCard({ r, onUnlock, unlocked }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge tone={r.type === 'job' ? 'tertiary' : 'success'}>{r.openFor}</Badge>
        <span className="text-xs font-bold text-primary">{r.credits} Credits</span>
      </div>
      <p className="text-sm font-bold text-on-surface mb-0">
        {unlocked ? r.realName || r.maskedName.replace(/\*/g, 'x') : r.maskedName}
      </p>
      <p className="text-xs text-on-surface-variant mb-2">
        {unlocked ? r.realPhone || r.maskedPhone : r.maskedPhone}
      </p>
      <p className="text-sm text-on-surface mb-2">{r.title}</p>
      <div className="grid grid-cols-2 gap-y-1 text-xs text-on-surface-variant mb-3">
        {r.experience && <span>{r.experience}</span>}
        <span>Preferred: {r.preferredLocation}</span>
        {r.expectedSalary && <span>Salary: {unlocked ? '₹65,000/month' : r.expectedSalary}</span>}
        {r.percent12th && <span>12th %: {unlocked ? '91%' : r.percent12th}</span>}
        {r.jeeScore && <span>JEE Score: {unlocked ? '142' : r.jeeScore}</span>}
        {r.currentCity && <span>Current City: {unlocked ? 'Bhopal' : r.currentCity}</span>}
        {r.hostelRequired && <span>Hostel Required: {r.hostelRequired}</span>}
      </div>
      {unlocked ? (
        <Badge tone="success">Profile Unlocked</Badge>
      ) : (
        <Button size="sm" className="w-full" icon="lock_open" onClick={() => onUnlock(r)}>
          Unlock Profile
        </Button>
      )}
    </Card>
  );
}

export default function SearchConnections() {
  const [filters, setFilters] = useState({});
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [pendingUnlock, setPendingUnlock] = useState(null);
  const credits = 1240 - unlockedIds.reduce((sum, id) => {
    const r = mockSearchResults.find((x) => x.id === id);
    return sum + (r ? r.credits : 0);
  }, 0);

  const results = useMemo(() => mockSearchResults, []);

  const confirmUnlock = () => {
    if (pendingUnlock) setUnlockedIds((ids) => [...ids, pendingUnlock.id]);
    setPendingUnlock(null);
  };

  return (
    <div>
      <PageHeader
        title="Search Connections"
        subtitle="Filter candidates/leads and spend credits to unlock full contact details."
      />

      <Card className="p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-primary">toll</span>
          <span className="font-semibold text-on-surface">Available Credits:</span>
          <Badge tone="primary">{credits}</Badge>
        </div>
      </Card>

      <Card className="p-4 mb-5">
        <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-3">
          {FILTERS.map((f) => (
            <FormGroup key={f} label={f} small>
              <Select
                value={filters[f] || ''}
                onChange={(e) => setFilters((s) => ({ ...s, [f]: e.target.value }))}
              >
                <option value="">Any</option>
                <option value="demo">Demo option</option>
              </Select>
            </FormGroup>
          ))}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((r) => (
          <ProfileCard
            key={r.id}
            r={r}
            unlocked={unlockedIds.includes(r.id)}
            onUnlock={setPendingUnlock}
          />
        ))}
      </div>

      <Modal open={!!pendingUnlock} onClose={() => setPendingUnlock(null)} width={340}>
        {pendingUnlock && (
          <>
            <h3 className="text-base font-bold text-on-surface mb-2">Unlock Profile?</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              This will use <strong>{pendingUnlock.credits} credits</strong> to reveal full contact
              details for {pendingUnlock.maskedName}.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPendingUnlock(null)}>Cancel</Button>
              <Button size="sm" icon="lock_open" onClick={confirmUnlock}>Confirm Unlock</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
