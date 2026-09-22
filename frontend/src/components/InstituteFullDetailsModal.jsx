import { useEffect, useRef, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Input, FormGroup, Select } from './ui/Field';
import StateCitySelect from './ui/StateCitySelect';
import AdsTab from './AdsTab';
import ImageSpecHelp from './ui/ImageSpecHelp';
import { validateImage, specSummary } from '../constants/mediaSpecs';
import { pageDisplayUrl } from '../utils/pageUrl';
import {
  fetchPage,
  updatePage,
  uploadPageMedia,
  resolveAssetUrl,
  addSectionItem,
  deleteSectionItem,
} from '../Api/Api';




import { INSTITUTE_TYPES, AFFILIATION_OPTIONS } from '../constants/taxonomy';

const INITIAL_WHY_CHOOSE_US_OPTIONS = [
  'Experienced & Qualified Faculty',
  'Modern Infrastructure',
  'Advanced Laboratories',
  'Industry-Oriented Curriculum',
  'Strong Placement Support',
  'Internship Opportunities',
  'Research & Innovation',
  'Digital Learning Environment',
  'Student-Centric Education',
  'Personality Development',
  'Career Guidance',
  'Excellent Academic Results',
  'Scholarships & Financial Support',
  'Sports & Extracurricular Activities',
  'Safe & Secure Campus',
  'Hostel Facilities',
  'Library & Digital Resources',
  'Industry Exposure',
  'International Exposure',
  'Entrepreneurship Support',
  'Skill Development Programs',
  'Strong Alumni Network',
  'Regular Seminars & Workshops',
  'Holistic Development',
  'Vibrant Campus Life',
];

const INITIAL_KEY_HIGHLIGHT_OPTIONS = [
  { id: 'faculty', title: 'Experienced Faculty', fieldLabel: 'Faculty Members', placeholder: '250+' },
  { id: 'placement', title: 'Placement Record', fieldLabel: 'Placement Rate', placeholder: '92%' },
  { id: 'industry', title: 'Industry Exposure', fieldLabel: 'Industry Partners', placeholder: '150+' },
  { id: 'alumni', title: 'Alumni Network', fieldLabel: 'Alumni', placeholder: '20,000+' },
  { id: 'campus', title: 'Modern Infrastructure', fieldLabel: 'Campus Area', placeholder: '25 Acres' },
  { id: 'research', title: 'Research & Publications', fieldLabel: 'Research Papers', placeholder: '300+' },
  { id: 'scholarship', title: 'Scholarships', fieldLabel: 'Scholarships Awarded', placeholder: '500+' },
  { id: 'mou', title: 'International Collaborations', fieldLabel: 'MOUs Signed', placeholder: '20+' },
  { id: 'accreditation', title: 'Accreditation', fieldLabel: 'NAAC Grade', placeholder: 'A+' },
  { id: 'awards', title: 'Award-Winning Institute', fieldLabel: 'Awards Won', placeholder: '40+' },
  { id: 'smartclass', title: 'Digital Learning', fieldLabel: 'Smart Classrooms', placeholder: '60+' },
  { id: 'sportsach', title: 'Sports Achievements', fieldLabel: 'State/National Medals', placeholder: '75+' },
  { id: 'startup', title: 'Entrepreneurship Cell', fieldLabel: 'Startups Incubated', placeholder: '18+' },
  { id: 'nss', title: 'Community Service', fieldLabel: 'NSS/NCC Volunteers', placeholder: '400+' },
  { id: 'libres', title: 'Library Resources', fieldLabel: 'Books Available', placeholder: '50,000+' },
  { id: 'labs', title: 'Laboratories', fieldLabel: 'Number of Labs', placeholder: '25' },
  { id: 'hostelcap', title: 'Hostel Facility', fieldLabel: 'Hostel Capacity', placeholder: '1200' },
  { id: 'transport', title: 'Transport Facility', fieldLabel: 'Buses / Routes', placeholder: '30' },
  { id: 'clubs', title: 'Extracurricular Activities', fieldLabel: 'Clubs & Societies', placeholder: '22' },
  { id: 'certs', title: 'Skill Development', fieldLabel: 'Certification Courses', placeholder: '45+' },
];

const INITIAL_FACILITY_DEFAULTS = [
  { id: 'hostel', name: 'Hostel', icon: 'home', fieldLabel: 'Capacity', placeholder: '1200', available: false, value: '' },
  { id: 'library', name: 'Library', icon: 'menu_book', fieldLabel: 'Books', placeholder: '50,000+', available: false, value: '' },
  { id: 'labs', name: 'Laboratories', icon: 'science', fieldLabel: 'Number of Labs', placeholder: '25', available: false, value: '' },
  { id: 'sports', name: 'Sports', icon: 'sports_score', fieldLabel: 'Sports Facilities', placeholder: '12', available: false, value: '' },
  { id: 'transport', name: 'Transport', icon: 'directions_bus', fieldLabel: 'Bus Routes', placeholder: '18', available: false, value: '' },
  { id: 'wifi', name: 'Wi-Fi Campus', icon: 'wifi', fieldLabel: 'Coverage', placeholder: '100%', available: false, value: '' },
  { id: 'medical', name: 'Medical Centre', icon: 'medical_services', fieldLabel: 'Beds', placeholder: '10', available: false, value: '' },
  { id: 'auditorium', name: 'Auditorium', icon: 'domain', fieldLabel: 'Seating Capacity', placeholder: '800', available: false, value: '' },
];

const STANDARD_ABOUT_FIELD_DEFS = [
  { id: 'establishedYear', label: 'Established Year', placeholder: '1998' },
  { id: 'yearsOfExcellence', label: 'Years of Excellence', placeholder: '28', autoCalcAvailable: true },
  { id: 'students', label: 'Students', placeholder: '5000+' },
  { id: 'faculty', label: 'Faculty', placeholder: '250+' },
  { id: 'programs', label: 'Programs', placeholder: '35' },
  { id: 'campusArea', label: 'Campus Area', placeholder: '25 Acres' },
];

const TABS = [
  { key: 'main', label: 'Main & Identity', icon: 'storefront' },
  { key: 'contact', label: 'Contact & Social', icon: 'contact_page' },
  { key: 'about', label: 'About Us', icon: 'school' },
  { key: 'why', label: 'Why Choose Us', icon: 'auto_awesome' },
  { key: 'highlights', label: 'Key Highlights', icon: 'military_tech' },
  { key: 'facilities', label: 'Facilities', icon: 'apartment' },
  { key: 'achievements', label: 'Achievements', icon: 'emoji_events' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
  // Last three, because they are the only tabs that write to their own
  // endpoints rather than to the page's `content` blob — see AdsTab.jsx. Kept
  // as three tabs rather than one scrolling "Ads" screen so an admin working
  // on vacancies is not scrolling past admission notices to reach them.
  { key: 'ads-notice', label: 'Ads · Notice', icon: 'campaign' },
  { key: 'ads-hiring', label: 'Ads · Hiring', icon: 'work' },
  { key: 'papers', label: 'Guess Papers', icon: 'description' },
];

function generateAboutParagraph(state, allFieldDefs, name = 'Our institute') {
  const v = state.values || {};
  const currentYear = new Date().getFullYear();
  const yearsExcellence =
    state.autoCalcYears && v.establishedYear
      ? currentYear - parseInt(v.establishedYear, 10)
      : v.yearsOfExcellence;

  const has = (id) =>
    (state.enabledFields || []).includes(id) && (id === 'yearsOfExcellence' ? yearsExcellence : v[id]);

  const parts = [];
  let opener = `${name}`;
  if (has('establishedYear')) opener += `, established in ${v.establishedYear},`;
  if (has('yearsOfExcellence'))
    opener += ` has completed ${yearsExcellence} years of excellence in education`;
  else opener += ` is committed to academic excellence`;
  parts.push(opener + '.');

  const stats = [];
  if (has('students')) stats.push(`${v.students} students`);
  if (has('faculty')) stats.push(`${v.faculty} experienced faculty members`);
  if (has('programs')) stats.push(`${v.programs} academic programs`);
  if (has('campusArea')) stats.push(`a sprawling campus spread across ${v.campusArea}`);

  // Include custom stats
  allFieldDefs.forEach((def) => {
    if (!STANDARD_ABOUT_FIELD_DEFS.some((s) => s.id === def.id) && has(def.id)) {
      stats.push(`${v[def.id]} ${def.label.toLowerCase()}`);
    }
  });

  if (stats.length) {
    const last = stats[stats.length - 1];
    const rest = stats.slice(0, -1);
    const joined = rest.length ? `${rest.join(', ')} and ${last}` : last;
    parts.push(`We are proud to host ${joined}, shaping careers and building futures.`);
  }

  if (parts.length === 1 && !has('establishedYear')) {
    return "Select stats above to generate your institute's introduction paragraph automatically.";
  }
  return parts.join(' ');
}

/**
 * The full institute CMS editor.
 *
 * Renders in one of two shells:
 *   variant="modal" (default) — a 90vw overlay, used from the Institute Console.
 *   variant="page"            — plain in-flow content filling its route, used by
 *                               the Main Admin's /admin/pages/:pageId screen.
 *
 * Client feedback, 01 Sep 2026: "the eye button for extra info change it to a
 * separate page for adding extra info instead of a modal." The form has seven
 * tabs and a live preview — more than an overlay should carry, and a modal has
 * no URL, so an admin could not link to or reload an institute mid-edit.
 *
 * In page mode `onClose` is a Back action rather than a dismiss, so the header
 * shows an arrow instead of an ×.
 */
export default function InstituteFullDetailsModal({
  open,
  onClose,
  institute,
  onSaveSuccess,
  variant = 'modal',
}) {
  const [tab, setTab] = useState('main');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Coaching');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [banners, setBanners] = useState([]);

  // Contact
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', youtube: '', linkedin: '' });

  // About Us
  const [customAboutDefs, setCustomAboutDefs] = useState([]);
  const [newStatLabel, setNewStatLabel] = useState('');
  const [newStatValue, setNewStatValue] = useState('');

  const [aboutState, setAboutState] = useState({
    enabledFields: ['establishedYear', 'yearsOfExcellence', 'students', 'faculty', 'campusArea'],
    autoCalcYears: true,
    values: {
      establishedYear: '1998',
      yearsOfExcellence: '28',
      students: '5000+',
      faculty: '250+',
      programs: '35',
      campusArea: '25 Acres',
    },
  });

  // Why Choose Us
  const [whyChooseOptions, setWhyChooseOptions] = useState(INITIAL_WHY_CHOOSE_US_OPTIONS);
  const [whyChoose, setWhyChoose] = useState(INITIAL_WHY_CHOOSE_US_OPTIONS.slice(0, 6));
  const [newCustomReason, setNewCustomReason] = useState('');

  // Key Highlights
  const [highlightOptions, setHighlightOptions] = useState(INITIAL_KEY_HIGHLIGHT_OPTIONS);
  const [highlights, setHighlights] = useState([
    { id: 'faculty', title: 'Experienced Faculty', fieldLabel: 'Faculty Members', value: '250+' },
    { id: 'placement', title: 'Placement Record', fieldLabel: 'Placement Rate', value: '92%' },
    { id: 'industry', title: 'Industry Exposure', fieldLabel: 'Industry Partners', value: '150+' },
    { id: 'alumni', title: 'Alumni Network', fieldLabel: 'Alumni', value: '20,000+' },
  ]);
  const [newHlTitle, setNewHlTitle] = useState('');
  const [newHlFieldLabel, setNewHlFieldLabel] = useState('');
  const [newHlValue, setNewHlValue] = useState('');

  // Facilities
  const [facilities, setFacilities] = useState(INITIAL_FACILITY_DEFAULTS);
  const [newFacName, setNewFacName] = useState('');
  const [newFacFieldLabel, setNewFacFieldLabel] = useState('');
  const [newFacValue, setNewFacValue] = useState('');

  // Achievements
  const [achievements, setAchievements] = useState([
    { id: 'ach-1', title: 'Highest Placement', prefix: '₹', value: '24', suffix: ' LPA' },
    { id: 'ach-2', title: 'Average Placement', prefix: '₹', value: '7.5', suffix: ' LPA' },
    { id: 'ach-3', title: 'Placement Rate', prefix: '', value: '92', suffix: '%' },
    { id: 'ach-4', title: 'Recruiters', prefix: '', value: '180', suffix: '+' },
  ]);

  // Gallery
  const [gallery, setGallery] = useState([]);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Combine standard and custom About Us fields
  const allAboutFieldDefs = [...STANDARD_ABOUT_FIELD_DEFS, ...customAboutDefs];

  const populateFormState = (data) => {
    if (!data) return;

    setName(data.name || '');
    setType(data.type || 'Coaching');
    setSlug(data.slug || '');
    setTagline(data.tagline || '');
    setIsEnabled(data.is_enabled !== false);
    setLogoUrl(data.logo_url || data.logoUrl || '');
    setBanners(Array.isArray(data.banners) ? data.banners : []);

    setAddress(data.address || '');
    setCity(data.city || '');
    setStateName(data.state || '');
    setWebsite(data.website || '');
    setPhone(data.contact || data.phone || '');
    setEmail(data.email || '');
    setAffiliation(data.affiliation || '');

    if (data.social_links || data.socialLinks) {
      setSocialLinks({
        facebook: '',
        instagram: '',
        youtube: '',
        linkedin: '',
        ...(data.social_links || data.socialLinks),
      });
    }

    const content = data.content || {};

    if (content.customAboutDefs && Array.isArray(content.customAboutDefs)) {
      setCustomAboutDefs(content.customAboutDefs);
    }

    if (content.aboutState) {
      setAboutState(content.aboutState);
    } else if (content.aboutStats) {
      setAboutState((prev) => ({
        ...prev,
        values: { ...prev.values, ...content.aboutStats },
      }));
    }

    if (Array.isArray(content.whyChooseUs)) {
      setWhyChoose(content.whyChooseUs);
      setWhyChooseOptions((prev) => {
        const set = new Set([...prev, ...content.whyChooseUs]);
        return [...set];
      });
    }

    if (Array.isArray(content.keyHighlights)) {
      setHighlights(content.keyHighlights);
      setHighlightOptions((prev) => {
        const ids = new Set(prev.map((x) => x.id));
        const customToAdd = content.keyHighlights.filter((kh) => !ids.has(kh.id));
        return [...prev, ...customToAdd];
      });
    }

    if (Array.isArray(content.facilities)) {
      setFacilities((prev) => {
        const existingMap = new Map(prev.map((f) => [f.id, f]));
        content.facilities.forEach((cf) => {
          const id = cf.id || cf.key;
          if (existingMap.has(id)) {
            existingMap.set(id, { ...existingMap.get(id), available: true, value: cf.value || cf.fieldValue || '' });
          } else {
            existingMap.set(id, {
              id: id,
              name: cf.label || cf.name || 'Custom Facility',
              icon: cf.icon || 'domain',
              fieldLabel: cf.fieldLabel || cf.field || 'Capacity',
              available: true,
              value: cf.value || '',
            });
          }
        });
        return [...existingMap.values()];
      });
    }

    if (Array.isArray(content.achievements)) {
      setAchievements(
        content.achievements.map((a, idx) => ({
          id: a.id || `ach-${idx}`,
          title: a.title || a.label || '',
          prefix: a.prefix || '',
          value: a.value || '',
          suffix: a.suffix || '',
        }))
      );
    }

    if (Array.isArray(data.gallery)) {
      setGallery(data.gallery);
    }
  };

  // Load initial state from prop & immediately fetch fresh page data from API
  useEffect(() => {
    if (!open || !institute) return;

    // 1. Populate form immediately with prop data
    populateFormState(institute);

    // 2. Fetch fresh DB state via GET /api/pages/{id}
    const targetId = institute.id || institute.slug;
    if (targetId) {
      let isMounted = true;
      fetchPage(targetId)
        .then((freshPage) => {
          if (isMounted && freshPage) {
            populateFormState(freshPage);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch fresh page data:', err);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [institute, open]);


  if (!open || !institute) return null;

  /**
   * Upload one image and take the stored URL from the response.
   *
   * POST /pages/{id}/media returns the updated **Page**, not `{ url }`. The
   * three handlers here each tested `uploaded?.url` — always undefined — and
   * fell through to `URL.createObjectURL(file)`. That put a `blob:` URL into
   * state, and Save Changes then wrote that blob URL to the database,
   * overwriting the `/uploads/...` path the upload had just stored. The blob
   * dies with the tab, so the logo was invisible on the live page ever after.
   * Client feedback 22 Sep 2026, row 2: "Not visible on live page."
   *
   * The same fix landed in pages/InstitutePageEditor.jsx; this editor is the
   * Platform Admin's copy of the same screen and had the identical defect.
   *
   * There is no local-preview fallback any more, on purpose: if the upload
   * failed, the honest outcome is an error, not a picture that looks saved and
   * is not.
   */
  const uploadImage = async (kind, file) => {
    setMediaError('');
    const invalid = await validateImage(file, kind);
    if (invalid) {
      setMediaError(invalid);
      return null;
    }
    if (!institute.id) {
      setMediaError('This page is not saved yet — reload and try again.');
      return null;
    }
    try {
      return await uploadPageMedia(institute.id, kind, file);
    } catch (err) {
      console.warn(`Upload ${kind} error:`, err);
      setMediaError(err?.message || `Could not upload that ${kind}. Please try again.`);
      return null;
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const updated = await uploadImage('logo', file);
    if (updated) setLogoUrl(updated.logo_url || '');
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const updated = await uploadImage('banner', file);
    if (updated) setBanners(updated.banners || []);
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const updated = await uploadImage('gallery', file);
    if (updated) setGallery(updated.gallery || []);
  };

  // Dynamic Adders with API synchronization
  const addCustomAboutStat = async () => {
    if (!newStatLabel.trim()) return;
    const newId = `custom_stat_${Date.now()}`;
    const newDef = { id: newId, label: newStatLabel.trim(), placeholder: 'e.g. 100+' };
    setCustomAboutDefs((prev) => [...prev, newDef]);
    setAboutState((s) => ({
      ...s,
      enabledFields: [...(s.enabledFields || []), newId],
      values: { ...s.values, [newId]: newStatValue.trim() || 'Available' },
    }));
    if (institute?.id) {
      try {
        await addSectionItem(institute.id, 'customAboutDefs', newDef);
      } catch (err) {
        console.warn('Error saving custom about stat API:', err);
      }
    }
    setNewStatLabel('');
    setNewStatValue('');
  };

  const addCustomWhyReason = async () => {
    if (!newCustomReason.trim()) return;
    const val = newCustomReason.trim();
    if (!whyChooseOptions.includes(val)) {
      setWhyChooseOptions((prev) => [...prev, val]);
    }
    if (!whyChoose.includes(val)) {
      setWhyChoose((prev) => [...prev, val]);
    }
    if (institute?.id) {
      try {
        await addSectionItem(institute.id, 'whyChooseUs', { value: val });
      } catch (err) {
        console.warn('Error saving custom reason API:', err);
      }
    }
    setNewCustomReason('');
  };

  const addCustomHighlight = async () => {
    if (!newHlTitle.trim()) return;
    const newId = `hl_${Date.now()}`;
    const newHl = {
      id: newId,
      title: newHlTitle.trim(),
      fieldLabel: newHlFieldLabel.trim() || 'Value',
      value: newHlValue.trim() || '100+',
    };
    setHighlightOptions((prev) => [...prev, { id: newId, title: newHl.title, fieldLabel: newHl.fieldLabel, placeholder: '100+' }]);
    setHighlights((prev) => [...prev, newHl]);
    if (institute?.id) {
      try {
        await addSectionItem(institute.id, 'keyHighlights', newHl);
      } catch (err) {
        console.warn('Error saving highlight API:', err);
      }
    }
    setNewHlTitle('');
    setNewHlFieldLabel('');
    setNewHlValue('');
  };

  const addCustomFacility = async () => {
    if (!newFacName.trim()) return;
    const newId = `fac_${Date.now()}`;
    const newFac = {
      id: newId,
      name: newFacName.trim(),
      icon: 'domain',
      fieldLabel: newFacFieldLabel.trim() || 'Capacity',
      available: true,
      value: newFacValue.trim() || '100+',
    };
    setFacilities((prev) => [...prev, newFac]);
    if (institute?.id) {
      try {
        await addSectionItem(institute.id, 'facilities', newFac);
      } catch (err) {
        console.warn('Error saving facility API:', err);
      }
    }
    setNewFacName('');
    setNewFacFieldLabel('');
    setNewFacValue('');
  };

  const removeAchievementWithApi = async (id) => {
    removeAchievement(id);
    if (institute?.id) {
      try {
        await deleteSectionItem(institute.id, 'achievements', id);
      } catch (err) {
        console.warn('Error deleting achievement API:', err);
      }
    }
  };




  const saveAll = async () => {
    setSaving(true);
    setError('');
    setSavedSuccess(false);

    const generatedIntro = generateAboutParagraph(aboutState, allAboutFieldDefs, name);

    const payload = {
      name,
      type,
      tagline,
      is_enabled: isEnabled,
      logo_url: logoUrl,
      banners,
      address,
      city,
      state: stateName,
      website,
      contact: phone,
      affiliation,
      about: generatedIntro,
      social_links: socialLinks,
      gallery,
      content: {
        customAboutDefs,
        aboutState,
        aboutStats: aboutState.values,
        whyChooseUs: whyChoose,
        keyHighlights: highlights,
        facilities: facilities
          .filter((f) => f.available)
          .map((f) => ({ id: f.id, key: f.id, label: f.name, fieldLabel: f.fieldLabel, value: f.value, icon: f.icon })),
        achievements,
      },
    };

    try {
      if (institute.id) {
        const updated = await updatePage(institute.id, payload);
        if (updated) {
          populateFormState(updated);
          if (onSaveSuccess) onSaveSuccess(updated);
        }
      } else {
        if (onSaveSuccess) onSaveSuccess(payload);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save institute details.');
    } finally {
      setSaving(false);
    }

  };

  const toggleWhyChoose = (item) => {
    setWhyChoose((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const toggleHighlight = (opt) => {
    setHighlights((prev) => {
      const exists = prev.some((h) => h.id === opt.id);
      if (exists) return prev.filter((h) => h.id !== opt.id);
      return [...prev, { id: opt.id, title: opt.title, fieldLabel: opt.fieldLabel, value: '' }];
    });
  };

  const setHighlightVal = (id, value) => {
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, value } : h)));
  };

  const updateFacility = (id, patch) => {
    setFacilities((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addAchievement = () => {
    setAchievements((prev) => [
      ...prev,
      { id: `ach-${Date.now()}`, title: '', prefix: '', value: '', suffix: '' },
    ]);
  };

  const removeAchievement = (id) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAchievement = (id, patch) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const affiliationChoices = AFFILIATION_OPTIONS[type] || [];

  const asPage = variant === 'page';

  if (!open) return null;

  // Built as an element, not a wrapper component: a component defined inline
  // here would be a fresh type on every render, remounting the whole form and
  // dropping focus on each keystroke.
  const body = (
      <div
        className={`flex flex-col bg-surface-container-lowest overflow-hidden ${
          asPage ? 'flex-1 min-h-0' : 'h-full rounded-2xl'
        }`}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-surface-container border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
              {logoUrl ? <img src={resolveAssetUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[20px]">account_balance</span>}
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface m-0 leading-tight">{name || 'Institute Information Manager'}</h2>
              <p className="text-xs text-on-surface-variant m-0">
                {slug ? pageDisplayUrl({ slug, type, city }) : 'Manage complete institute CMS profile'} · <Badge tone="primary" className="ml-1">{type}</Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={showPreview ? 'primary' : 'outline'}
              icon="visibility"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
            </Button>
            <Button size="sm" onClick={saveAll} disabled={saving} icon="save">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <button
              onClick={onClose}
              title={asPage ? 'Back to Institute Pages' : 'Close'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-[20px]">
                {asPage ? 'arrow_back' : 'close'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-surface-container-lowest border-b border-outline-variant flex items-center gap-1 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap bg-transparent ${
                tab === t.key
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {savedSuccess && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-700 px-6 py-2 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            All changes saved successfully!
          </div>
        )}

        {error && (
          <div className="bg-error-container/40 border-b border-error/30 text-error px-6 py-2 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-hidden grid" style={{ gridTemplateColumns: showPreview ? '1fr 400px' : '1fr' }}>
          <div className="p-6 overflow-y-auto space-y-6">
            {/* TAB 1: MAIN & IDENTITY */}
            {tab === 'main' && (
              <div className="max-w-3xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Institute Name">
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </FormGroup>
                  <FormGroup label="Institute Type">
                    <Select value={type} onChange={(e) => setType(e.target.value)}>
                      {INSTITUTE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </FormGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Vanity Slug">
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. stanford-tech" />
                  </FormGroup>
                  <FormGroup label="Tagline">
                    <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Where Ambition Meets Achievement" />
                  </FormGroup>
                </div>

                {mediaError && (
                  <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{mediaError}</p>
                )}

                <FormGroup label={`Logo Image — ${specSummary('logo')}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden shrink-0 bg-surface-container-low">
                      {logoUrl ? (
                        <img src={resolveAssetUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                      )}
                    </div>
                    <div>
                      <Button size="sm" variant="outline" type="button" onClick={() => logoInputRef.current?.click()}>
                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      <div className="mt-2">
                        <ImageSpecHelp kind="logo" />
                      </div>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                  </div>
                </FormGroup>

                <FormGroup label={`Banner Images (up to 3) — ${specSummary('banner')}`}>
                  <div className="flex flex-wrap gap-3">
                    {banners.map((url, i) => (
                      <div key={i} className="relative w-36 h-20 rounded-xl overflow-hidden border border-outline-variant">
                        <img src={resolveAssetUrl(url)} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBanners((b) => b.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-on-surface/70 text-white flex items-center justify-center cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                    {banners.length < 3 && (
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-36 h-20 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary flex flex-col items-center justify-center text-on-surface-variant cursor-pointer gap-1 bg-transparent"
                      >
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                        <span className="text-[10px]">Add banner</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-2">
                    <ImageSpecHelp kind="banner" />
                  </div>
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                </FormGroup>
              </div>
            )}

            {/* TAB 2: CONTACT & SOCIAL */}
            {tab === 'contact' && (
              <div className="max-w-3xl space-y-6">
                <FormGroup label="Address">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full campus address" />
                </FormGroup>

                <StateCitySelect
                  className="grid grid-cols-2 gap-4"
                  state={stateName}
                  city={city}
                  onChange={({ state: nextState, city: nextCity }) => {
                    setStateName(nextState);
                    setCity(nextCity);
                  }}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormGroup label="Phone / Contact">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210" />
                  </FormGroup>
                  <FormGroup label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admissions@institute.edu" />
                  </FormGroup>
                  <FormGroup label="Website">
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.institute.edu" />
                  </FormGroup>
                </div>

                {affiliationChoices.length > 0 && (
                  <FormGroup label="Affiliation / Board">
                    <Select value={affiliation} onChange={(e) => setAffiliation(e.target.value)}>
                      <option value="">Select Affiliation</option>
                      {affiliationChoices.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}

                <div className="border-t border-outline-variant pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-on-surface m-0">Social Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Facebook URL" value={socialLinks.facebook || ''} onChange={(e) => setSocialLinks((s) => ({ ...s, facebook: e.target.value }))} />
                    <Input placeholder="Instagram URL" value={socialLinks.instagram || ''} onChange={(e) => setSocialLinks((s) => ({ ...s, instagram: e.target.value }))} />
                    <Input placeholder="YouTube URL" value={socialLinks.youtube || ''} onChange={(e) => setSocialLinks((s) => ({ ...s, youtube: e.target.value }))} />
                    <Input placeholder="LinkedIn URL" value={socialLinks.linkedin || ''} onChange={(e) => setSocialLinks((s) => ({ ...s, linkedin: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ABOUT US */}
            {tab === 'about' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-on-surface m-0 mb-1">About Us — Institute Statistics</h3>
                  <p className="text-xs text-on-surface-variant m-0">
                    Select stats to display and fill numbers. You can also add custom stat options below.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allAboutFieldDefs.map((f) => {
                    const on = (aboutState.enabledFields || []).includes(f.id);
                    const isAutoCalc = f.id === 'yearsOfExcellence' && aboutState.autoCalcYears;
                    const currentYear = new Date().getFullYear();
                    const autoYears = aboutState.values.establishedYear
                      ? Math.max(0, currentYear - parseInt(aboutState.values.establishedYear, 10) || 0)
                      : '';

                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-xl border transition-colors ${on ? 'border-primary bg-primary-container/10' : 'border-outline-variant'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-on-surface">{f.label}</span>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => {
                              setAboutState((s) => {
                                const list = s.enabledFields || [];
                                return {
                                  ...s,
                                  enabledFields: list.includes(f.id) ? list.filter((x) => x !== f.id) : [...list, f.id],
                                };
                              });
                            }}
                          />
                        </div>
                        {on && (
                          <Input
                            value={isAutoCalc ? String(autoYears) : aboutState.values[f.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAboutState((s) => ({
                                ...s,
                                values: { ...s.values, [f.id]: val },
                              }));
                            }}
                            placeholder={f.placeholder}
                            disabled={isAutoCalc}
                          />
                        )}
                        {f.autoCalcAvailable && on && (
                          <label className="flex items-center gap-1.5 mt-2 text-[11px] text-on-surface-variant cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aboutState.autoCalcYears}
                              onChange={(e) => setAboutState((s) => ({ ...s, autoCalcYears: e.target.checked }))}
                            />
                            Auto-calc from Established Year
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom About Stat Form */}
                <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary-container/5 space-y-3">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Custom About Us Stat Option
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Stat Label (e.g. Research Papers)"
                      value={newStatLabel}
                      onChange={(e) => setNewStatLabel(e.target.value)}
                    />
                    <Input
                      placeholder="Stat Value (e.g. 450+)"
                      value={newStatValue}
                      onChange={(e) => setNewStatValue(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" type="button" icon="add" onClick={addCustomAboutStat}>
                      Add Custom Stat Option
                    </Button>
                  </div>
                </div>

                <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Auto-Generated Intro Paragraph
                  </span>
                  <p className="text-xs text-on-surface leading-relaxed m-0 italic">
                    {generateAboutParagraph(aboutState, allAboutFieldDefs, name)}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: WHY CHOOSE US */}
            {tab === 'why' && (
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface m-0">Why Choose Us</h3>
                    <p className="text-xs text-on-surface-variant m-0">Select points or add custom options if not listed.</p>
                  </div>
                  <Badge tone="primary">{whyChoose.length} selected</Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {whyChooseOptions.map((item) => {
                    const selected = whyChoose.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleWhyChoose(item)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}{item}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Reason */}
                <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary-container/5 space-y-3">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Custom Reason Option
                  </span>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. AI-Assisted Personal Mentorship"
                      value={newCustomReason}
                      onChange={(e) => setNewCustomReason(e.target.value)}
                    />
                    <Button size="sm" type="button" icon="add" onClick={addCustomWhyReason}>
                      Add Option
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KEY HIGHLIGHTS */}
            {tab === 'highlights' && (
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface m-0">Key Highlights</h3>
                    <p className="text-xs text-on-surface-variant m-0">Select categories or add custom ones.</p>
                  </div>
                  <Badge tone="primary">{highlights.length} selected</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {highlightOptions.map((opt) => {
                    const active = highlights.some((h) => h.id === opt.id);
                    const current = highlights.find((h) => h.id === opt.id);

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border transition-colors ${active ? 'border-primary bg-primary-container/10' : 'border-outline-variant'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-on-surface">{opt.title}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleHighlight(opt)}
                          />
                        </div>
                        {active && (
                          <Input
                            value={current?.value || ''}
                            onChange={(e) => setHighlightVal(opt.id, e.target.value)}
                            placeholder={opt.placeholder}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Highlight Form */}
                <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary-container/5 space-y-3">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Custom Highlight Option
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Title e.g. Global MOUs"
                      value={newHlTitle}
                      onChange={(e) => setNewHlTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Field Label e.g. Countries"
                      value={newHlFieldLabel}
                      onChange={(e) => setNewHlFieldLabel(e.target.value)}
                    />
                    <Input
                      placeholder="Value e.g. 15+"
                      value={newHlValue}
                      onChange={(e) => setNewHlValue(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" type="button" icon="add" onClick={addCustomHighlight}>
                      Add Custom Highlight Option
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: FACILITIES */}
            {tab === 'facilities' && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-on-surface m-0">Campus Facilities</h3>
                  <p className="text-xs text-on-surface-variant m-0">Enable standard or add custom campus facilities.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {facilities.map((f) => (
                    <div
                      key={f.id}
                      className={`p-3 rounded-xl border transition-colors ${f.available ? 'border-primary bg-primary-container/10' : 'border-outline-variant'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">{f.icon || 'domain'}</span>
                          {f.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={f.available}
                          onChange={() => updateFacility(f.id, { available: !f.available })}
                        />
                      </div>
                      {f.available && (
                        <Input
                          value={f.value}
                          onChange={(e) => updateFacility(f.id, { value: e.target.value })}
                          placeholder={f.placeholder || 'Value'}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Custom Facility Form */}
                <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary-container/5 space-y-3">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Custom Facility Option
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Facility Name (e.g. Robotics Lab)"
                      value={newFacName}
                      onChange={(e) => setNewFacName(e.target.value)}
                    />
                    <Input
                      placeholder="Label (e.g. 3D Printers)"
                      value={newFacFieldLabel}
                      onChange={(e) => setNewFacFieldLabel(e.target.value)}
                    />
                    <Input
                      placeholder="Value (e.g. 12 Sets)"
                      value={newFacValue}
                      onChange={(e) => setNewFacValue(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" type="button" icon="add" onClick={addCustomFacility}>
                      Add Custom Facility Option
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: ACHIEVEMENTS */}
            {tab === 'achievements' && (
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface m-0">Achievements & Placements</h3>
                    <p className="text-xs text-on-surface-variant m-0">Dynamic achievement stat cards.</p>
                  </div>
                  <Button size="sm" icon="add" onClick={addAchievement}>Add Achievement</Button>
                </div>

                <div className="space-y-3">
                  {achievements.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-3 rounded-xl border border-outline-variant bg-surface-container-low">
                      <Input
                        placeholder="Title e.g. Highest Placement"
                        value={a.title}
                        onChange={(e) => updateAchievement(a.id, { title: e.target.value })}
                      />
                      <div className="w-16">
                        <Input
                          placeholder="Prefix"
                          value={a.prefix}
                          onChange={(e) => updateAchievement(a.id, { prefix: e.target.value })}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          placeholder="Value"
                          value={a.value}
                          onChange={(e) => updateAchievement(a.id, { value: e.target.value })}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          placeholder="Suffix"
                          value={a.suffix}
                          onChange={(e) => updateAchievement(a.id, { suffix: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAchievementWithApi(a.id)}
                        className="text-error hover:bg-error-container/20 p-2 rounded-lg cursor-pointer border-none bg-transparent"
                      >

                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABS 9-11: ADS — admission notices, vacancies and study
                material. Self-saving; deliberately not part of `saveAll`. */}
            {tab === 'ads-notice' && <AdsTab pageId={institute?.id} pageName={institute?.name} section="admission" />}
            {tab === 'ads-hiring' && <AdsTab pageId={institute?.id} pageName={institute?.name} section="job" />}
            {tab === 'papers' && <AdsTab pageId={institute?.id} pageName={institute?.name} section="paper" />}

            {/* TAB 8: GALLERY */}
            {tab === 'gallery' && (
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface m-0">Campus Gallery</h3>
                    <p className="text-xs text-on-surface-variant m-0 mb-1">
                      Upload photos with captions. {specSummary('gallery')}.
                    </p>
                    <ImageSpecHelp kind="gallery" />
                  </div>
                  <Button size="sm" icon="add_photo_alternate" onClick={() => galleryInputRef.current?.click()}>
                    Add Photo
                  </Button>
                  <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                </div>

                {mediaError && (
                  <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{mediaError}</p>
                )}

                <div className="grid grid-cols-3 gap-4">
                  {gallery.map((g, idx) => (
                    <div key={g.id || idx} className="relative rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low group">
                      <img src={resolveAssetUrl(g.url)} alt={g.caption || 'Gallery'} className="w-full h-32 object-cover" />
                      <input
                        type="text"
                        placeholder="Caption..."
                        value={g.caption || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGallery((list) => list.map((item, i) => (i === idx ? { ...item, caption: val } : item)));
                        }}
                        className="w-full px-2 py-1.5 text-xs border-t border-outline-variant bg-surface-container-lowest text-on-surface outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setGallery((list) => list.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-on-surface/70 text-white flex items-center justify-center cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LIVE PREVIEW SIDE PANEL */}
          {showPreview && (
            <div className="border-l border-outline-variant bg-surface-container-low p-4 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">visibility</span> Public Page Preview
                </span>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant space-y-3">
                <div className="text-center space-y-1">
                  <h4 className="text-base font-bold text-on-surface m-0">{name || 'Institute Name'}</h4>
                  {tagline && <p className="text-xs text-on-surface-variant italic m-0">{tagline}</p>}
                </div>

                <div className="border-t border-outline-variant pt-2 text-xs text-on-surface space-y-2">
                  <p className="font-semibold text-primary m-0">About Us</p>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed m-0">
                    {generateAboutParagraph(aboutState, allAboutFieldDefs, name)}
                  </p>
                </div>

                {whyChoose.length > 0 && (
                  <div className="border-t border-outline-variant pt-2 space-y-1">
                    <p className="text-xs font-semibold text-primary m-0">Why Choose Us</p>
                    <div className="flex flex-wrap gap-1">
                      {whyChoose.map((item) => (
                        <span key={item} className="text-[10px] bg-primary-container/30 text-primary px-2 py-0.5 rounded-full font-medium">
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {highlights.filter((h) => h.value).length > 0 && (
                  <div className="border-t border-outline-variant pt-2 space-y-1">
                    <p className="text-xs font-semibold text-primary m-0">Highlights</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {highlights.filter((h) => h.value).map((h) => (
                        <div key={h.id} className="bg-primary text-on-primary rounded-lg p-2 text-center">
                          <p className="text-sm font-bold m-0">{h.value}</p>
                          <p className="text-[9px] opacity-80 m-0">{h.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (asPage) return <div className="flex-1 w-full min-h-0 flex flex-col">{body}</div>;

  return (
    <Modal open={open} onClose={onClose} width="90vw" height="90vh" className="p-0 flex flex-col">
      {body}
    </Modal>
  );
}
