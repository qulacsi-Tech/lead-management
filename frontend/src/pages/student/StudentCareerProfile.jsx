import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Label } from '../../components/ui/Field';

const initialForm = {
  fullName: 'Ananya Sharma',
  dob: '2007-04-12',
  mobile: '9876543210',
  parentMobile: '9876500000',
  gender: 'Female',
  city: 'Pune',
  state: 'Maharashtra',
  className: 'Class 12',
  stream: 'PCM (Science)',
  school: 'Delhi Public School, Pune',
  tenth: '92',
  eleventh: '88',
  twelfthStatus: 'studying',
  exam: 'JEE Main',
  examStatus: 'preparing',
  examScore: '', examPercentile: '', examRank: '', examYear: '',
  examMonth: 'May', examYearExpected: '2026',
  course: 'B.Tech Computer Science',
  collegeType: 'Govt',
  cities: ['New Delhi', 'Mumbai'],
  budget: '5 - 10 Lakhs',
  hostel: true,
  timeline: 'After Exam Results',
  consentTrue: true,
  consentShare: true,
  consentTerms: true,
};

function Section({ icon, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary text-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h3 className="font-display text-xl font-semibold text-primary m-0">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ViewField({ label, value }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{label}</span>
      <p className="text-[15px] text-on-surface m-0 font-medium">{value || '—'}</p>
    </div>
  );
}

export default function StudentCareerProfile() {
  const [mode, setMode] = useState('view');
  const [f, setF] = useState(initialForm);
  const [draft, setDraft] = useState(initialForm);
  const [cityInput, setCityInput] = useState('');

  const startEdit = () => { setDraft(f); setMode('edit'); };
  const cancelEdit = () => setMode('view');
  const save = (e) => {
    e.preventDefault();
    setF(draft);
    setMode('view');
  };
  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const addCity = (e) => {
    if (e.key === 'Enter' && cityInput.trim()) {
      e.preventDefault();
      setField('cities', [...draft.cities, cityInput.trim()]);
      setCityInput('');
    }
  };
  const removeCity = (idx) => setField('cities', draft.cities.filter((_, i) => i !== idx));

  const examDetail =
    f.examStatus === 'appeared'
      ? [f.examScore && `Score ${f.examScore}`, f.examPercentile && `${f.examPercentile}%ile`, f.examRank && `Rank ${f.examRank}`]
          .filter(Boolean)
          .join(' · ') || '—'
      : f.examStatus === 'preparing'
      ? `Expected ${f.examMonth} ${f.examYearExpected}`
      : '—';

  if (mode === 'view') {
    return (
      <div className="max-w-5xl mx-auto px-10 py-8 box-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-primary m-0">Student Career Profile</h2>
            <p className="text-on-surface-variant m-0 mt-2">
              Your comprehensive profile for tailored academic pathways and career guidance.
            </p>
          </div>
          <Button icon="edit" onClick={startEdit}>Edit Profile</Button>
        </div>

        <div className="inline-flex items-center gap-2 text-primary bg-primary-fixed px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
          <span className="material-symbols-outlined text-base">info</span>Profile ID: #ADM-2024-0892
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <Section icon="person" title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ViewField label="Full Name" value={f.fullName} />
                <ViewField label="Date of Birth" value={f.dob} />
                <ViewField label="Mobile Number" value={f.mobile} />
                <ViewField label="Parent Mobile" value={f.parentMobile} />
                <ViewField label="Gender" value={f.gender} />
                <ViewField label="Location" value={[f.city, f.state].filter(Boolean).join(', ')} />
              </div>
            </Section>
          </Card>

          <Card className="p-6">
            <Section icon="school" title="Academic Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ViewField label="Current Class" value={f.className} />
                <ViewField label="Stream" value={f.stream} />
                <ViewField label="School" value={f.school} />
                <ViewField label="10th Grade %" value={f.tenth ? `${f.tenth}%` : ''} />
                <ViewField label="11th Grade %" value={f.eleventh ? `${f.eleventh}%` : ''} />
                <ViewField label="12th Status" value={f.twelfthStatus === 'passed' ? 'Passed' : 'Studying'} />
              </div>
            </Section>
          </Card>

          <Card className="p-6">
            <Section icon="assignment" title="Entrance Exam Details">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ViewField label="Target Exam" value={f.exam} />
                <ViewField label="Status" value={f.examStatus === 'appeared' ? 'Appeared / Qualified' : 'Preparing / Going to Appear'} />
                <ViewField label="Detail" value={examDetail} />
              </div>
            </Section>
          </Card>

          <Card className="p-6">
            <Section icon="explore" title="Career Preference">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ViewField label="Preferred Course" value={f.course} />
                <ViewField label="College Type" value={f.collegeType} />
                <ViewField label="Annual Budget" value={f.budget} />
                <ViewField label="Preferred Cities" value={f.cities.join(', ')} />
                <ViewField label="Hostel Required" value={f.hostel ? 'Yes' : 'No'} />
              </div>
            </Section>
          </Card>

          <Card className="p-6">
            <Section icon="event_available" title="Admission Timeline">
              <p className="text-[15px] m-0">{f.timeline || '—'}</p>
            </Section>
          </Card>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="max-w-5xl mx-auto px-10 py-8 pb-32 box-border">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold text-primary m-0">Edit Career Profile</h2>
        <p className="text-on-surface-variant m-0 mt-2">Update your details below, then save your changes.</p>
      </div>

      <Card className="p-8">
        <form onSubmit={save} className="flex flex-col gap-12">
          <Section icon="person" title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Label>Full Name</Label>
                <Input value={draft.fullName} onChange={(e) => setField('fullName', e.target.value)} />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={draft.dob} onChange={(e) => setField('dob', e.target.value)} />
              </div>
              <div>
                <Label>Mobile Number</Label>
                <Input value={draft.mobile} onChange={(e) => setField('mobile', e.target.value)} />
              </div>
              <div>
                <Label>Parent Mobile</Label>
                <Input value={draft.parentMobile} onChange={(e) => setField('parentMobile', e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={draft.gender} onChange={(e) => setField('gender', e.target.value)}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Input value={draft.city} onChange={(e) => setField('city', e.target.value)} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={draft.state} onChange={(e) => setField('state', e.target.value)} />
              </div>
            </div>
          </Section>
          <hr className="border-outline-variant" />

          <Section icon="school" title="Academic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label>Current Class</Label>
                <Select value={draft.className} onChange={(e) => setField('className', e.target.value)}>
                  <option>Class 11</option>
                  <option>Class 12</option>
                  <option>Dropper / Repeater</option>
                </Select>
              </div>
              <div>
                <Label>Stream</Label>
                <Select value={draft.stream} onChange={(e) => setField('stream', e.target.value)}>
                  <option>PCM (Science)</option>
                  <option>PCB (Science)</option>
                  <option>Commerce</option>
                  <option>Humanities</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>School Name</Label>
                <Input value={draft.school} onChange={(e) => setField('school', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>10th Grade (%)</Label>
                <Input type="number" value={draft.tenth} onChange={(e) => setField('tenth', e.target.value)} />
              </div>
              <div>
                <Label>11th Grade (%) <span className="text-[11px] text-on-surface-variant">(Optional)</span></Label>
                <Input type="number" value={draft.eleventh} onChange={(e) => setField('eleventh', e.target.value)} />
              </div>
              <div>
                <Label>12th Status</Label>
                <div className="flex items-center gap-4 pt-2.5">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="twelfth" checked={draft.twelfthStatus === 'studying'} onChange={() => setField('twelfthStatus', 'studying')} />
                    Studying
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="twelfth" checked={draft.twelfthStatus === 'passed'} onChange={() => setField('twelfthStatus', 'passed')} />
                    Passed
                  </label>
                </div>
              </div>
            </div>
          </Section>
          <hr className="border-outline-variant" />

          <Section icon="assignment" title="Entrance Exam Details">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Target Exam</Label>
                  <Select value={draft.exam} onChange={(e) => setField('exam', e.target.value)}>
                    <option>JEE Main</option>
                    <option>NEET UG</option>
                    <option>CUET</option>
                    <option>CLAT</option>
                    <option>BITSAT</option>
                  </Select>
                </div>
                <div>
                  <Label>Current Status</Label>
                  <Select value={draft.examStatus} onChange={(e) => setField('examStatus', e.target.value)}>
                    <option value="none">Select Status</option>
                    <option value="preparing">Preparing / Going to Appear</option>
                    <option value="appeared">Appeared / Qualified</option>
                  </Select>
                </div>
              </div>
              {draft.examStatus === 'appeared' && (
                <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><Label small>Score</Label><Input value={draft.examScore} onChange={(e) => setField('examScore', e.target.value)} /></div>
                  <div><Label small>Percentile</Label><Input value={draft.examPercentile} onChange={(e) => setField('examPercentile', e.target.value)} /></div>
                  <div><Label small>AIR / Rank</Label><Input value={draft.examRank} onChange={(e) => setField('examRank', e.target.value)} /></div>
                  <div><Label small>Result Year</Label><Input value={draft.examYear} onChange={(e) => setField('examYear', e.target.value)} /></div>
                </div>
              )}
              {draft.examStatus === 'preparing' && (
                <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant">
                  <Label>Expected Exam Month/Year</Label>
                  <div className="flex gap-4">
                    <Select className="w-auto" value={draft.examMonth} onChange={(e) => setField('examMonth', e.target.value)}>
                      <option>May</option><option>June</option>
                    </Select>
                    <Select className="w-auto" value={draft.examYearExpected} onChange={(e) => setField('examYearExpected', e.target.value)}>
                      <option>2026</option><option>2027</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </Section>
          <hr className="border-outline-variant" />

          <Section icon="explore" title="Career Preference">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Preferred Course</Label>
                <Input value={draft.course} onChange={(e) => setField('course', e.target.value)} />
              </div>
              <div>
                <Label>College Type</Label>
                <div className="flex gap-2">
                  {['Govt', 'Private', 'Any'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setField('collegeType', t)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold cursor-pointer ${
                        draft.collegeType === t
                          ? 'border-2 border-primary bg-primary-fixed text-primary'
                          : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Preferred States/Cities</Label>
                <div className="flex flex-wrap gap-2 p-3 border border-outline-variant rounded-lg min-h-[50px] bg-surface-container-lowest items-center">
                  {draft.cities.map((city, i) => (
                    <span key={city + i} className="inline-flex items-center gap-1 bg-primary-fixed text-primary px-2 py-1 rounded text-sm">
                      {city}
                      <button type="button" onClick={() => removeCity(i)} className="bg-transparent border-none cursor-pointer flex text-primary p-0">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  ))}
                  <input
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={addCity}
                    placeholder="Type city and enter..."
                    className="flex-1 border-none outline-none text-sm min-w-[120px] bg-transparent"
                  />
                </div>
              </div>
              <div>
                <Label>Annual Budget (₹)</Label>
                <Select value={draft.budget} onChange={(e) => setField('budget', e.target.value)}>
                  <option>Under 2 Lakhs</option>
                  <option>2 - 5 Lakhs</option>
                  <option>5 - 10 Lakhs</option>
                  <option>Above 10 Lakhs</option>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                <span className="text-sm font-semibold">Hostel Required?</span>
                <button
                  type="button"
                  onClick={() => setField('hostel', !draft.hostel)}
                  className={`w-11 h-6 rounded-full relative transition-colors border-none cursor-pointer ${
                    draft.hostel ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: draft.hostel ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </div>
          </Section>
          <hr className="border-outline-variant" />

          <Section icon="event_available" title="Admission Timeline">
            <div className="max-w-sm">
              <Label>When are you planning to take admission?</Label>
              <Select value={draft.timeline} onChange={(e) => setField('timeline', e.target.value)}>
                <option>This Month</option>
                <option>Within 30 Days</option>
                <option>After Exam Results</option>
                <option>Next Academic Year</option>
              </Select>
            </div>
          </Section>

          <section className="p-6 bg-primary/5 rounded-xl border border-primary/15">
            <h3 className="font-display text-xl font-semibold text-primary mb-4">Consent &amp; Verification</h3>
            <div className="flex flex-col gap-4">
              <label className="flex gap-3 cursor-pointer text-sm">
                <input type="checkbox" className="mt-0.5" checked={draft.consentTrue} onChange={() => setField('consentTrue', !draft.consentTrue)} />
                I hereby declare that all the information provided above is true to the best of my knowledge and belief.
              </label>
              <label className="flex gap-3 cursor-pointer text-sm">
                <input type="checkbox" className="mt-0.5" checked={draft.consentShare} onChange={() => setField('consentShare', !draft.consentShare)} />
                I consent to sharing my profile with accredited educational institutions for counseling purposes.
              </label>
              <label className="flex gap-3 cursor-pointer text-sm">
                <input type="checkbox" className="mt-0.5" checked={draft.consentTerms} onChange={() => setField('consentTerms', !draft.consentTerms)} />
                I agree to the Academy's Terms &amp; Conditions and Privacy Policy.
              </label>
            </div>
          </section>
        </form>
      </Card>

      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant py-4 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] box-border z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap ml-64">
          <div className="flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-base">schedule</span>Last saved: 2 mins ago
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
            <Button onClick={save}>Save Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
