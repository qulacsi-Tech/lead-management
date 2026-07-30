import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import { fetchMyInstituteProfile, updateMyInstituteProfile, fetchUnlockedEnquiries, ApiError } from '../../Api/Api';

const BADGE_DEFS = [
  { key: 'first', icon: 'military_tech', title: 'First Lead Unlocked', earned: (s) => s.purchasedCount >= 1 },
  { key: 'power', icon: 'bolt', title: 'Power Buyer (10+)', earned: (s) => s.purchasedCount >= 10 },
  { key: 'hot', icon: 'local_fire_department', title: 'Hot Streak', earned: (s) => s.hotCount >= 1 },
];

export default function InstituteProfile() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, u] = await Promise.all([fetchMyInstituteProfile(), fetchUnlockedEnquiries()]);
        setProfile(p);
        setPurchased(u);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const f = isEditing ? draft : profile;
  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const startEditing = () => {
    setDraft({ ...profile, programsText: profile.programs || '' });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMyInstituteProfile({
        name: draft.name,
        phone: draft.phone,
        city: draft.city,
        website: draft.website,
        about: draft.about,
        programs: draft.programsText,
      });
      setProfile(updated);
      setIsEditing(false);
      push({ type: 'success', message: 'Profile updated.' });
    } catch (err) {
      push({ type: 'error', message: err instanceof ApiError ? err.message : 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl w-full mx-auto px-10 py-8"><p className="text-on-surface-variant text-sm">Loading...</p></div>;
  }

  if (error && !profile) {
    return (
      <div className="max-w-7xl w-full mx-auto px-10 py-8">
        <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      </div>
    );
  }

  const programsList = (profile.programs || '').split(',').map((s) => s.trim()).filter(Boolean);
  const hotCount = purchased.filter((p) => p.is_hot).length;
  const memberSince = profile.created_at ? new Date(profile.created_at).getFullYear() : '—';
  const badgeState = { purchasedCount: purchased.length, hotCount };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-5">
          <Card className="relative overflow-hidden">
            <div className="h-56 relative bg-gradient-to-br from-primary-container to-primary">
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </div>
            <div className="pt-20 px-10 pb-8 relative">
              <div className="absolute -top-16 left-10 w-32 h-32 bg-surface-container-lowest rounded-2xl shadow-lg border-4 border-surface-container-lowest flex items-center justify-center text-primary font-extrabold text-2xl">
                {(f.name || 'IN').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex justify-between items-end gap-6 flex-wrap">
                {isEditing ? (
                  <div className="flex flex-col gap-2 flex-1 min-w-[260px] max-w-lg">
                    <Input value={draft.name || ''} onChange={(e) => setField('name', e.target.value)} placeholder="Institute name" className="text-lg font-bold" />
                    <div className="flex gap-2">
                      <Input value={draft.city || ''} onChange={(e) => setField('city', e.target.value)} placeholder="City" />
                      <Input value={draft.phone || ''} onChange={(e) => setField('phone', e.target.value)} placeholder="Phone" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="font-display text-2xl font-bold m-0 flex items-center gap-2">
                      {f.name}
                    </h1>
                    <div className="flex items-center gap-5 mt-2 text-on-surface-variant text-sm">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {[f.city, f.district, f.state].filter(Boolean).join(', ') || 'Location not set'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2.5">
                  {!isEditing ? (
                    <Button pill icon="edit" onClick={startEditing}>Edit Profile</Button>
                  ) : (
                    <>
                      <Button variant="outline" pill onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button variant="secondary" pill icon="check" disabled={saving} onClick={handleSave}>
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-xl font-semibold mb-4">About the Institute</h2>
            {isEditing ? (
              <Textarea rows={5} value={draft.about || ''} onChange={(e) => setField('about', e.target.value)} className="w-full" placeholder="Tell students about your institute..." />
            ) : (
              <p className="text-on-surface-variant leading-relaxed text-base m-0">
                {f.about || 'No description added yet. Click Edit Profile to add one.'}
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                [String(purchased.length), 'Leads Unlocked'],
                [String(hotCount), 'Hot Leads'],
                [String(profile.credits ?? 0), 'Credits Left'],
                [String(memberSince), 'Member Since'],
              ].map(([val, label]) => (
                <div key={label} className="bg-surface-container-low rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-primary">{val}</div>
                  <div className="text-[11px] text-on-surface-variant uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold m-0">Programs Offered</h2>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={draft.programsText || ''}
                  onChange={(e) => setField('programsText', e.target.value)}
                  placeholder="Comma-separated, e.g. MBA, Data Science, B.Tech"
                />
              ) : programsList.length === 0 ? (
                <p className="text-sm text-on-surface-variant m-0">No programs added yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {programsList.map((c) => (
                    <div key={c} className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl">
                      <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined">menu_book</span>
                      </div>
                      <p className="text-sm font-semibold m-0 flex-1 min-w-0">{c}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold m-0">Location &amp; Contact</h2>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">location_on</span>{[f.city, f.district, f.state].filter(Boolean).join(', ') || 'Not set'}</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">call</span>{f.phone || 'Not set'}</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">mail</span>{f.email}</div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">language</span>
                    <Input value={draft.website || ''} onChange={(e) => setField('website', e.target.value)} placeholder="Website URL" className="flex-1" />
                  </div>
                ) : (
                  f.website && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-primary">language</span>{f.website}</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-7 bg-gradient-to-br from-primary to-primary-container text-white border-none flex flex-col gap-5 sticky top-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] uppercase tracking-widest opacity-75">Wallet</span>
                <h3 className="text-lg font-bold mt-1">{profile.credits ?? 0} Credits</h3>
              </div>
              <span className="material-symbols-outlined text-3xl text-secondary-container">account_balance_wallet</span>
            </div>
            <p className="text-sm opacity-80 m-0">Used to unlock student enquiry contact details in Buy Leads.</p>
            <button
              onClick={() => navigate('/institute/buy-leads')}
              className="w-full py-3.5 bg-white text-primary rounded-lg font-bold text-sm cursor-pointer border-none flex items-center justify-center gap-2"
            >
              Go to Buy Leads<span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-semibold mb-4">Achievement Badges</h4>
            <div className="flex flex-wrap gap-3">
              {BADGE_DEFS.map((b) => {
                const earned = b.earned(badgeState);
                return (
                  <div
                    key={b.key}
                    title={b.title}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      earned ? 'bg-primary-fixed text-primary' : 'border-2 border-dashed border-outline-variant text-on-surface-variant opacity-50'
                    }`}
                  >
                    <span className="material-symbols-outlined">{b.icon}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
