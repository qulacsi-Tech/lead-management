import { useCallback, useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable, { RowAction } from '../../components/ui/DataTable';
import { Input, Textarea, Select, Label, FormGroup } from '../../components/ui/Field';
import { useInstitute } from '../../context/InstituteContext';
import {
  fetchPageCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../../Api/Api';
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  upsertCourse,
  removeCourse,
} from '../mockData';

const emptyCourse = {
  id: '', name: '', category: COURSE_CATEGORIES[0], level: COURSE_LEVELS[0],
  duration: '', fees: '', intake: '', eligibility: '', description: '',
  specializations: [], status: 'Draft', admissionOpen: false,
};

const TABS = ['All', 'Published', 'Draft'];

export default function ManageCourses() {
  const { page, commit } = useInstitute();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [specInput, setSpecInput] = useState('');
  const [courses, setCourses] = useState([]);

  const loadCourses = useCallback(async () => {
    if (!page?.id) return;
    try {
      const res = await fetchPageCourses(page.id);
      if (Array.isArray(res)) setCourses(res);
      else setCourses(page?.courses || []);
    } catch (err) {
      console.warn('Failed to fetch courses:', err);
      setCourses(page?.courses || []);
    }
  }, [page?.id, page?.courses]);


  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  if (!page) return null;

  const displayCourses = courses.length > 0 ? courses : (page.courses || []);

  const filtered = displayCourses.filter((c) => {
    const matchesTab = tab === 'All' || c.status === tab;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || (c.name || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const set = (key) => (e) => setEditing((f) => ({ ...f, [key]: e.target.value }));

  const openCreate = () => { setEditing({ ...emptyCourse }); setSpecInput(''); };
  const openEdit = (course) => { setEditing({ ...course }); setSpecInput(''); };

  const addSpecialization = () => {
    const value = specInput.trim();
    if (!value) return;
    setEditing((f) => ({
      ...f,
      specializations: f.specializations?.includes(value) ? f.specializations : [...(f.specializations || []), value],
    }));
    setSpecInput('');
  };

  const save = async (e) => {
    e?.preventDefault();
    if (page?.id) {
      try {
        const payload = {
          name: editing.name,
          category: editing.category,
          level: editing.level,
          duration: editing.duration,
          fees: editing.fees,
          intake: editing.intake,
          eligibility: editing.eligibility,
          description: editing.description,
          specializations: editing.specializations || [],
          status: editing.status || 'Draft',
          admission_open: !!editing.admissionOpen,
        };
        if (editing.id) {
          await updateCourse(page.id, editing.id, payload);
        } else {
          await createCourse(page.id, payload);
        }
        await loadCourses();
      } catch (err) {
        console.warn('Failed to save course to server:', err);
      }
    }
    commit(() => upsertCourse(page, { ...editing, updatedAt: new Date().toISOString().slice(0, 10) }));
    setEditing(null);
  };

  const saveAndPublish = async () => {
    if (page?.id) {
      try {
        const payload = {
          name: editing.name,
          category: editing.category,
          level: editing.level,
          duration: editing.duration,
          fees: editing.fees,
          intake: editing.intake,
          eligibility: editing.eligibility,
          description: editing.description,
          specializations: editing.specializations || [],
          status: 'Published',
          admission_open: !!editing.admissionOpen,
        };
        if (editing.id) {
          await updateCourse(page.id, editing.id, payload);
        } else {
          await createCourse(page.id, payload);
        }
        await loadCourses();
      } catch (err) {
        console.warn('Failed to save & publish course:', err);
      }
    }
    commit(() => upsertCourse(page, {
      ...editing, status: 'Published', updatedAt: new Date().toISOString().slice(0, 10),
    }));
    setEditing(null);
  };

  const toggleStatus = async (course) => {
    const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
    if (page?.id && course.id) {
      try {
        await updateCourse(page.id, course.id, { status: newStatus });
        await loadCourses();
      } catch (err) {
        console.warn('Failed to toggle course status:', err);
      }
    }
    commit(() => upsertCourse(page, {
      ...course,
      status: newStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
    }));
  };

  const remove = async (course) => {
    if (window.confirm(`Remove "${course.name}" from this institute's courses?`)) {
      if (page?.id && course.id) {
        try {
          await deleteCourse(page.id, course.id);
          await loadCourses();
        } catch (err) {
          console.warn('Failed to delete course from server:', err);
        }
      }
      commit(() => removeCourse(page, course.id));
    }
  };


  const columns = [
    {
      key: 'name',
      label: 'Course',
      render: (c) => (
        <div>
          <p className="font-bold text-on-surface m-0 text-sm">{c.name}</p>
          <p className="text-[11px] text-on-surface-variant m-0">{c.category} · {c.level}</p>
        </div>
      ),
    },
    { key: 'duration', label: 'Duration', render: (c) => <span className="text-xs text-on-surface">{c.duration || '—'}</span> },
    { key: 'fees', label: 'Fees', render: (c) => <span className="text-xs text-on-surface">{c.fees ? `₹${c.fees}` : '—'}</span> },
    { key: 'intake', label: 'Intake', render: (c) => <span className="text-xs text-on-surface">{c.intake || '—'}</span> },
    {
      key: 'admission',
      label: 'Admission',
      render: (c) => (
        <Badge tone={c.admissionOpen ? 'success' : 'neutral'}>{c.admissionOpen ? 'Open' : 'Closed'}</Badge>
      ),
    },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'updated', label: 'Updated', render: (c) => <span className="text-xs text-on-surface-variant">{c.updatedAt || '—'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <RowAction icon="visibility" title="View details" onClick={() => setViewing(c)} />
          <RowAction icon="edit" title="Edit course" onClick={() => openEdit(c)} />
          <RowAction
            icon={c.status === 'Published' ? 'unpublished' : 'publish'}
            title={c.status === 'Published' ? 'Unpublish' : 'Publish'}
            tone={c.status === 'Published' ? 'warn' : 'good'}
            onClick={() => toggleStatus(c)}
          />
          <RowAction icon="delete" title="Remove course" tone="danger" onClick={() => remove(c)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Courses</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Your institute's academic catalogue. Published courses appear on your public page and in
            enquiry forms; drafts stay private to you.
          </p>
        </div>
        <Button icon="add" onClick={openCreate}>Add Course</Button>
      </div>

      <Card className="p-4 mb-6 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
          <input
            type="text"
            placeholder="Search by course name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
                tab === t ? 'bg-surface-container-lowest text-primary shadow-xs' : 'bg-transparent text-on-surface-variant'
              }`}
            >
              {t}
              {t !== 'All' && (
                <span className="ml-1 opacity-60">{courses.filter((c) => c.status === t).length}</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={
          courses.length === 0 ? (
            <EmptyState
              icon="menu_book"
              title="No courses yet"
              description="Add the programmes your institute offers. They power your public page, admission notices and the enquiry form."
              actionLabel="Add your first course"
              onAction={openCreate}
            />
          ) : (
            <EmptyState compact icon="search_off" title="No courses match this filter" />
          )
        }
      />

      {/* Create / Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} width={560}>
        {editing && (
          <>
            <h2 className="text-lg font-bold text-on-surface m-0 mb-1">
              {editing.id ? 'Edit Course' : 'Add Course'}
            </h2>
            <p className="text-xs text-on-surface-variant m-0 mb-5">
              Saved as a draft unless you publish it — drafts are never shown on your public page.
            </p>
            <form onSubmit={save} className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
              <FormGroup label="Course Name">
                <Input required value={editing.name} onChange={set('name')} placeholder="e.g. JEE Main & Advanced" />
              </FormGroup>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Category">
                  <Select value={editing.category} onChange={set('category')}>
                    {COURSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Level / Program Type">
                  <Select value={editing.level} onChange={set('level')}>
                    {COURSE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </Select>
                </FormGroup>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormGroup label="Duration">
                  <Input value={editing.duration} onChange={set('duration')} placeholder="2 Years" />
                </FormGroup>
                <FormGroup label="Fees (₹)">
                  <Input value={editing.fees} onChange={set('fees')} placeholder="1,80,000" />
                </FormGroup>
                <FormGroup label="Intake">
                  <Input value={editing.intake} onChange={set('intake')} placeholder="120" />
                </FormGroup>
              </div>

              <FormGroup label="Eligibility">
                <Input value={editing.eligibility} onChange={set('eligibility')} placeholder="e.g. Class 10 pass, PCM stream" />
              </FormGroup>

              <FormGroup label="Specializations">
                <div className="flex gap-2">
                  <Input
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialization(); } }}
                    placeholder="Type a specialization and press Enter"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSpecialization}>Add</Button>
                </div>
                {editing.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editing.specializations.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 text-xs bg-surface-container-high px-2.5 py-1 rounded-lg text-on-surface-variant">
                        {s}
                        <button
                          type="button"
                          onClick={() => setEditing((f) => ({ ...f, specializations: f.specializations.filter((x) => x !== s) }))}
                          className="bg-transparent border-none cursor-pointer p-0 flex items-center text-on-surface-variant"
                          aria-label={`Remove ${s}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </FormGroup>

              <FormGroup label="Description">
                <Textarea rows={3} value={editing.description} onChange={set('description')} placeholder="What this course covers, who it suits, how it runs" />
              </FormGroup>

              <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.admissionOpen}
                  onChange={(e) => setEditing((f) => ({ ...f, admissionOpen: e.target.checked }))}
                  className="cursor-pointer"
                />
                Admissions currently open for this course
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" variant="soft">Save as Draft</Button>
                <Button type="button" onClick={saveAndPublish} disabled={!editing.name}>
                  {editing.status === 'Published' ? 'Save & Keep Published' : 'Save & Publish'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Detail view */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} width={480}>
        {viewing && (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface m-0">{viewing.name}</h2>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">{viewing.category} · {viewing.level}</p>
              </div>
              <StatusBadge status={viewing.status} />
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 grid grid-cols-2 gap-3 mb-4 border border-outline-variant text-xs">
              <div><span className="text-on-surface-variant">Duration</span><p className="font-semibold text-on-surface m-0">{viewing.duration || '—'}</p></div>
              <div><span className="text-on-surface-variant">Fees</span><p className="font-semibold text-on-surface m-0">{viewing.fees ? `₹${viewing.fees}` : '—'}</p></div>
              <div><span className="text-on-surface-variant">Intake</span><p className="font-semibold text-on-surface m-0">{viewing.intake || '—'}</p></div>
              <div><span className="text-on-surface-variant">Admissions</span><p className="font-semibold text-on-surface m-0">{viewing.admissionOpen ? 'Open' : 'Closed'}</p></div>
              <div className="col-span-2"><span className="text-on-surface-variant">Eligibility</span><p className="font-semibold text-on-surface m-0">{viewing.eligibility || '—'}</p></div>
            </div>

            {viewing.specializations?.length > 0 && (
              <div className="mb-4">
                <Label small>Specializations</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {viewing.specializations.map((s) => <Badge key={s} tone="tertiary">{s}</Badge>)}
                </div>
              </div>
            )}

            {viewing.description && (
              <div className="mb-4">
                <Label small>Description</Label>
                <p className="text-sm text-on-surface-variant m-0">{viewing.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              <Button onClick={() => { openEdit(viewing); setViewing(null); }} icon="edit">Edit</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
