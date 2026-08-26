import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Input, FormGroup } from '../components/ui/Field';
import { Textarea } from '../components/ui/Field';
import {
  WHY_CHOOSE_US_OPTIONS,
  KEY_HIGHLIGHTS_OPTIONS,
  FACILITIES_OPTIONS,
  CAMPUS_LIFE_OPTIONS,
  ABOUT_US_STAT_FIELDS,
  buildAboutParagraph,
} from './pageBuilderContent';
import { useInstitute } from '../context/InstituteContext';
import { updatePage, uploadPageMedia } from '../Api/Api';
import InstituteFullDetailsModal from '../components/InstituteFullDetailsModal';



const TABS = [
  { key: 'main', label: 'Main', icon: 'storefront' },
  { key: 'about', label: 'About Us', icon: 'info' },
  { key: 'contact', label: 'Contact & Social', icon: 'contact_page' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
  { key: 'why', label: 'Why Choose Us', icon: 'stars' },
  { key: 'highlights', label: 'Key Highlights', icon: 'insights' },
  { key: 'facilities', label: 'Facilities', icon: 'apartment' },
  { key: 'campus', label: 'Campus Life', icon: 'diversity_3' },
  { key: 'achievements', label: 'Achievements', icon: 'military_tech' },
];

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/yourinstitute' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourinstitute' },
  { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@yourinstitute' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/company/yourinstitute' },
];

// A simple pick-any-N chip list — used by Why Choose Us and Campus Life,
// which (unlike Key Highlights/Facilities) don't carry a per-item number.
function ChipMultiSelect({ options, selected, onChange, suggestedMax }) {
  const toggle = (opt) => {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  };
  return (
    <div>
      {suggestedMax && (
        <p className="text-xs text-on-surface-variant mb-2">
          {selected.length} selected {suggestedMax ? `(suggested: ${suggestedMax})` : ''}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer text-left ${
              selected.includes(opt)
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Pick-and-fill-a-number — used by Key Highlights and Facilities: each
// option, once selected, reveals its own numeric/detail field.
function NumberedPicker({ options, selected, onChange, checkboxLabel = 'Available' }) {
  const isSelected = (key) => selected.some((s) => s.key === key);
  const valueFor = (key) => selected.find((s) => s.key === key)?.value || '';

  const toggle = (key) => {
    if (isSelected(key)) onChange(selected.filter((s) => s.key !== key));
    else onChange([...selected, { key, value: '' }]);
  };
  const setValue = (key, value) => onChange(selected.map((s) => (s.key === key ? { ...s, value } : s)));

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const active = isSelected(opt.key);
        return (
          <div
            key={opt.key}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              active ? 'border-primary bg-primary-container/20' : 'border-outline-variant'
            }`}
          >
            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 shrink-0" checked={active} onChange={() => toggle(opt.key)} />
              <span className="text-sm text-on-surface font-medium truncate">{opt.label}</span>
            </label>
            {active && (
              <div className="w-40 shrink-0">
                <Input
                  value={valueFor(opt.key)}
                  onChange={(e) => setValue(opt.key, e.target.value)}
                  placeholder={opt.placeholder || checkboxLabel}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * INSTITUTE-OWNED. The "Select & Fill" content builder for the institute's own
 * public page — reached from the Institute Console at /institute/profile.
 * Which institute this edits comes from InstituteContext, never from the URL.
 */
export default function InstitutePageEditor() {
  const navigate = useNavigate();
  const { page, commit } = useInstitute();
  if (!page) return null;
  // Keyed on slug so switching the managed institute remounts with its own data.
  return <InstitutePageEditorForm key={page.slug} page={page} navigate={navigate} commit={commit} />;
}

function InstitutePageEditorForm({ page, navigate, commit }) {
  const [main, setMain] = useState({ name: page.name, tagline: page.tagline, banners: page.banners, logoUrl: page.logoUrl });
  const [contact, setContact] = useState({
    address: page.address || '',
    website: page.website || '',
    contact: page.contact || '',
    about: page.about || '',
  });
  const [socialLinks, setSocialLinks] = useState(page.socialLinks || {});
  const [gallery, setGallery] = useState(page.gallery || []);
  const galleryInputRef = useRef(null);
  const [aboutStats, setAboutStats] = useState(page.content.aboutStats);
  const [whyChooseUs, setWhyChooseUs] = useState(page.content.whyChooseUs);
  const [keyHighlights, setKeyHighlights] = useState(page.content.keyHighlights);
  const [facilities, setFacilities] = useState(page.content.facilities);
  const [campusLife, setCampusLife] = useState(page.content.campusLife);
  const [achievements, setAchievements] = useState(page.content.achievements);
  const [tab, setTab] = useState('main');
  const [savedAt, setSavedAt] = useState(0);
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const setStat = (key) => (e) => setAboutStats((s) => ({ ...s, [key]: e.target.value }));
  const setAchievement = (key) => (e) => setAchievements((a) => ({ ...a, [key]: e.target.value }));

  const addBanner = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (page?.id) {
      try {
        const uploaded = await uploadPageMedia(page.id, 'banner', file);
        if (uploaded?.url) {
          setMain((m) => ({ ...m, banners: [...m.banners, uploaded.url].slice(0, 3) }));
          return;
        }
      } catch (err) {
        console.warn('Upload banner error:', err);
      }
    }
    const url = URL.createObjectURL(file);
    setMain((m) => ({ ...m, banners: [...m.banners, url].slice(0, 3) }));
  };

  const setLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (page?.id) {
      try {
        const uploaded = await uploadPageMedia(page.id, 'logo', file);
        if (uploaded?.url) {
          setMain((m) => ({ ...m, logoUrl: uploaded.url }));
          return;
        }
      } catch (err) {
        console.warn('Upload logo error:', err);
      }
    }
    setMain((m) => ({ ...m, logoUrl: URL.createObjectURL(file) }));
  };

  const addGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (page?.id) {
      try {
        const uploaded = await uploadPageMedia(page.id, 'gallery', file);
        if (uploaded?.url) {
          setGallery((g) => [...g, { id: `img-${Date.now()}`, url: uploaded.url, caption: '' }]);
          return;
        }
      } catch (err) {
        console.warn('Upload gallery error:', err);
      }
    }
    setGallery((g) => [...g, { id: `img-${Date.now()}`, url: URL.createObjectURL(file), caption: '' }]);
  };

  const save = async () => {
    if (page?.id) {
      try {
        await updatePage(page.id, {
          name: main.name,
          tagline: main.tagline,
          banners: main.banners,
          logo_url: main.logoUrl,
          address: contact.address,
          website: contact.website,
          contact: contact.contact,
          about: contact.about,
          social_links: socialLinks,
          gallery: gallery,
          content: { aboutStats, whyChooseUs, keyHighlights, facilities, campusLife, achievements },
        });
      } catch (err) {
        console.warn('Failed to update page on server:', err);
      }
    }
    commit(() => {
      Object.assign(page, {
        name: main.name, tagline: main.tagline, banners: main.banners, logoUrl: main.logoUrl,
        address: contact.address, website: contact.website, contact: contact.contact, about: contact.about,
        socialLinks, gallery,
      });
      Object.assign(page.content, { aboutStats, whyChooseUs, keyHighlights, facilities, campusLife, achievements });
    });
    setSavedAt(Date.now());
  };


  const [fullModalOpen, setFullModalOpen] = useState(false);


  const SaveBar = (
    <div className="flex items-center gap-3 mt-5">
      <Button size="sm" onClick={save}>Save Changes</Button>
      <Button size="sm" variant="outline" onClick={() => navigate(`/${page.slug}`)}>Preview Page</Button>
      <Button size="sm" variant="soft" icon="open_in_full" onClick={() => setFullModalOpen(true)}>
        Full CMS Manager (90%×90%)
      </Button>
      {savedAt > 0 && (
        <span className="text-xs text-secondary font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span> Saved
        </span>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Profile &amp; Branding</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-2xl">
            Your institute's public content. Select &amp; Fill — pick from predefined options and we
            build the page layout for you.
          </p>
        </div>
        <Button size="sm" variant="primary" icon="open_in_full" onClick={() => setFullModalOpen(true)}>
          Open Full CMS Editor (90%×90%)
        </Button>
      </div>


      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-3">Main Part</h4>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <FormGroup label="Institute Name">
              <Input value={main.name} onChange={(e) => setMain((m) => ({ ...m, name: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Tagline">
              <Input
                value={main.tagline}
                onChange={(e) => setMain((m) => ({ ...m, tagline: e.target.value }))}
                placeholder="e.g. Where Ambition Meets Achievement"
              />
            </FormGroup>
          </div>
          <FormGroup label="Logo (square, recommended 512×512px)">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary flex items-center justify-center text-on-surface-variant cursor-pointer overflow-hidden shrink-0"
              >
                {main.logoUrl ? (
                  <img src={main.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                )}
              </button>
              <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                {main.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={setLogo} />
          </FormGroup>
          <FormGroup label="Banner Images (2–3, recommended 1600×500px, under 2MB each)">
            <div className="flex flex-wrap gap-3 mb-2">
              {main.banners.map((src, i) => (
                <div key={i} className="relative w-32 h-20 rounded-lg overflow-hidden border border-outline-variant">
                  <img src={src} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMain((m) => ({ ...m, banners: m.banners.filter((_, idx) => idx !== i) }))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-on-surface/60 text-white flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
              {main.banners.length < 3 && (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-32 h-20 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                </button>
              )}
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={addBanner} />
          </FormGroup>
          {SaveBar}
        </Card>
      )}

      {tab === 'about' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">About Us</h4>
          <p className="text-xs text-on-surface-variant mb-4">
            Fill in what applies — we'll write the paragraph for you. Years of Excellence is calculated automatically from the Established Year.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            {ABOUT_US_STAT_FIELDS.map((f) => (
              <FormGroup key={f.key} label={f.label}>
                <Input value={aboutStats[f.key] || ''} onChange={setStat(f.key)} placeholder={f.placeholder} />
              </FormGroup>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">Preview</p>
            <p className="text-sm text-on-surface mb-0">
              {buildAboutParagraph(main.name, aboutStats) || 'Fill in a few fields above to see the generated paragraph.'}
            </p>
          </div>
          {SaveBar}
        </Card>
      )}

      {tab === 'contact' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Contact &amp; Social</h4>
          <p className="text-xs text-on-surface-variant mb-4">
            Shown in the Details panel on your public page and used by the enquiry form.
          </p>
          <div className="space-y-4 mb-5">
            <FormGroup label="Address">
              <Input
                value={contact.address}
                onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))}
                placeholder="MG Road, Indore, Madhya Pradesh"
              />
            </FormGroup>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Website">
                <Input
                  value={contact.website}
                  onChange={(e) => setContact((c) => ({ ...c, website: e.target.value }))}
                  placeholder="www.example.in"
                />
              </FormGroup>
              <FormGroup label="Contact Number">
                <Input
                  value={contact.contact}
                  onChange={(e) => setContact((c) => ({ ...c, contact: e.target.value }))}
                  placeholder="+91-XXXXXXXXXX"
                />
              </FormGroup>
            </div>
            <FormGroup label="Short description (fallback if About Us stats are empty)">
              <Textarea
                rows={3}
                value={contact.about}
                onChange={(e) => setContact((c) => ({ ...c, about: e.target.value }))}
                placeholder="One or two lines about the institute"
              />
            </FormGroup>
          </div>

          <h4 className="text-sm font-bold text-on-surface mb-3 pt-3 border-t border-outline-variant">
            Social Links
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map((f) => (
              <FormGroup key={f.key} label={f.label}>
                <Input
                  value={socialLinks[f.key] || ''}
                  onChange={(e) => setSocialLinks((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              </FormGroup>
            ))}
          </div>
          {SaveBar}
        </Card>
      )}

      {tab === 'gallery' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Gallery</h4>
          <p className="text-xs text-on-surface-variant mb-4">
            Campus and classroom photos shown as a grid on your public page. Add a caption to each.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {gallery.map((img, i) => (
              <div key={img.id} className="rounded-xl border border-outline-variant overflow-hidden">
                <div className="relative h-24">
                  <img src={img.url} alt={img.caption || `Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setGallery((g) => g.filter((x) => x.id !== img.id))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-on-surface/60 text-white flex items-center justify-center cursor-pointer border-none"
                    aria-label="Remove image"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
                <input
                  value={img.caption}
                  onChange={(e) =>
                    setGallery((g) => g.map((x) => (x.id === img.id ? { ...x, caption: e.target.value } : x)))
                  }
                  placeholder="Caption"
                  className="w-full bg-surface-container-low border-none px-2 py-1.5 text-[11px] text-on-surface outline-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="h-24 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary flex flex-col items-center justify-center text-on-surface-variant cursor-pointer gap-1"
            >
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <span className="text-[11px]">Add photo</span>
            </button>
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={addGalleryImage} />
          {SaveBar}
        </Card>
      )}

      {tab === 'why' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Why Choose Us</h4>
          <p className="text-xs text-on-surface-variant mb-4">Select around 6 — these render as cards on your page.</p>
          <ChipMultiSelect options={WHY_CHOOSE_US_OPTIONS} selected={whyChooseUs} onChange={setWhyChooseUs} suggestedMax={6} />
          {SaveBar}
        </Card>
      )}

      {tab === 'highlights' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Key Highlights</h4>
          <p className="text-xs text-on-surface-variant mb-4">Select the relevant ones and fill in your numbers.</p>
          <NumberedPicker options={KEY_HIGHLIGHTS_OPTIONS} selected={keyHighlights} onChange={setKeyHighlights} />
          {SaveBar}
        </Card>
      )}

      {tab === 'facilities' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Facilities</h4>
          <p className="text-xs text-on-surface-variant mb-4">Check what's available and add the detail for each.</p>
          <NumberedPicker options={FACILITIES_OPTIONS} selected={facilities} onChange={setFacilities} />
          {SaveBar}
        </Card>
      )}

      {tab === 'campus' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Campus Life</h4>
          <p className="text-xs text-on-surface-variant mb-4">Select what's part of campus life at your institute.</p>
          <ChipMultiSelect options={CAMPUS_LIFE_OPTIONS} selected={campusLife} onChange={setCampusLife} />
          {SaveBar}
        </Card>
      )}

      {tab === 'achievements' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-1">Achievements & Placement</h4>
          <p className="text-xs text-on-surface-variant mb-4">Fill in your numbers — we'll render them as stat cards.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormGroup label="Highest Placement (₹ LPA)">
              <Input value={achievements.highestPlacement} onChange={setAchievement('highestPlacement')} placeholder="e.g. 24" />
            </FormGroup>
            <FormGroup label="Average Placement (₹ LPA)">
              <Input value={achievements.averagePlacement} onChange={setAchievement('averagePlacement')} placeholder="e.g. 7.5" />
            </FormGroup>
            <FormGroup label="Placement Rate (%)">
              <Input value={achievements.placementRate} onChange={setAchievement('placementRate')} placeholder="e.g. 92" />
            </FormGroup>
            <FormGroup label="Recruiters">
              <Input value={achievements.recruiters} onChange={setAchievement('recruiters')} placeholder="e.g. 180+" />
            </FormGroup>
          </div>
          {SaveBar}
        </Card>
      )}

      <div className="mt-4">
        <Badge tone="neutral">Institute type: {page.type} — content options adjust by type in a later pass</Badge>
      </div>

      {fullModalOpen && (
        <InstituteFullDetailsModal
          open={fullModalOpen}
          onClose={() => setFullModalOpen(false)}
          institute={page}
          onSaveSuccess={() => commit()}
        />
      )}
    </div>
  );
}

