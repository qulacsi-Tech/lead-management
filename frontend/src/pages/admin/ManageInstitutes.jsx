import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { registerInstitute, updateAdminInstitute, ApiError } from '../../Api/Api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Label } from '../../components/ui/Field';

export default function ManageInstitutes() {
  const { institutes, loading, error, updateEntityStatus, deleteEntity, refreshAdminData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [editing, setEditing] = useState(null); // institute whose account is being edited

  // Form states for adding new institute
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit form — `password` stays blank unless the admin is resetting it.
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (inst) => {
    setEditError('');
    setEditForm({
      name: inst.name || '',
      email: inst.email || '',
      phone: inst.phone === 'N/A' ? '' : inst.phone || '',
      city: inst.city === 'N/A' ? '' : inst.city || '',
      programs: (inst.courses || []).join(', '),
      password: '',
    });
    setEditing(inst);
  };

  const setEdit = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');

    // Only send what actually changed, so an untouched field is never
    // rewritten — and an empty password box means "keep the current one"
    // rather than "blank the password".
    const patch = {};
    if (editForm.name !== editing.name) patch.name = editForm.name;
    if (editForm.email !== editing.email) patch.email = editForm.email;
    if (editForm.phone !== (editing.phone === 'N/A' ? '' : editing.phone || '')) patch.phone = editForm.phone;
    if (editForm.city !== (editing.city === 'N/A' ? '' : editing.city || '')) patch.city = editForm.city;
    if (editForm.programs !== (editing.courses || []).join(', ')) patch.programs = editForm.programs;
    if (editForm.password) patch.password = editForm.password;

    if (Object.keys(patch).length === 0) {
      setEditSaving(false);
      setEditing(null);
      return;
    }

    try {
      await updateAdminInstitute(editing.id, patch);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Could not save those changes.');
      setEditSaving(false);
      return;
    }
    setEditSaving(false);
    setEditing(null);
    setSelectedInstitute(null);
    await refreshAdminData();
  };

  const filteredInstitutes = institutes.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    setSaving(true);
    setFormError('');
    try {
      await registerInstitute({
        name,
        email,
        password,
        phone,
        city,
        programs: course,
      });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create the institute.');
      setSaving(false);
      return;
    }
    setSaving(false);

    setName('');
    setEmail('');
    setPassword('');
    setCity('');
    setPhone('');
    setCourse('');
    setIsAddModalOpen(false);
    await refreshAdminData();
  };

  const handleToggleStatus = (inst) => {
    const nextStatus = inst.status === 'Active' ? 'Suspended' : 'Active';
    updateEntityStatus('institute', inst.id, nextStatus);
    if (selectedInstitute && selectedInstitute.id === inst.id) {
      setSelectedInstitute({ ...selectedInstitute, status: nextStatus });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this institute?')) {
      deleteEntity('institute', id);
      if (selectedInstitute && selectedInstitute.id === id) {
        setSelectedInstitute(null);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Manage Institutes</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Registered institutes are automatically approved and listed here. You can edit or adjust their access status.
          </p>
        </div>
        <Button icon="add" onClick={() => setIsAddModalOpen(true)}>
          Add Institute
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="p-4 mb-6 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-on-surface-variant font-semibold">Status:</label>
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            {['All', 'Active', 'Suspended'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'bg-transparent text-on-surface-variant'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table List */}
      <Card className="p-0 overflow-hidden border border-outline-variant">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant uppercase tracking-wider">
                <th className="py-3.5 px-5">Institute Name</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">City</th>
                <th className="py-3.5 px-5">Courses</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-on-surface-variant text-xs">
                    Loading institutes…
                  </td>
                </tr>
              ) : filteredInstitutes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-on-surface-variant text-xs">
                    {error || 'No institutes found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredInstitutes.map((inst) => (
                  <tr key={inst.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold">
                          <span className="material-symbols-outlined">account_balance</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface m-0 text-sm">{inst.name}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold m-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-Approved
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-on-surface-variant">
                      <p className="m-0 font-medium text-on-surface">{inst.email}</p>
                      <p className="m-0 text-[11px]">{inst.phone || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-5 text-xs font-medium text-on-surface">{inst.city}</td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-1">
                        {(inst.courses || []).slice(0, 2).map((c, i) => (
                          <span key={i} className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant font-medium">
                            {c}
                          </span>
                        ))}
                        {(inst.courses || []).length > 2 && (
                          <span className="text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded-full text-on-surface-variant font-bold">
                            +{inst.courses.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <Badge tone={inst.status === 'Active' ? 'success' : 'error'}>
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInstitute(inst)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button
                          onClick={() => openEdit(inst)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="Edit account & credentials"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(inst)}
                          className={`p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${
                            inst.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={inst.status === 'Active' ? 'Suspend Institute' : 'Activate Institute'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {inst.status === 'Active' ? 'block' : 'check_circle'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(inst.id)}
                          className="p-1.5 text-error hover:bg-error-container/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="Delete Institute"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add New Institute Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} width={440}>
        <div className="p-2">
          <h2 className="text-xl font-bold text-on-surface m-0 mb-1">Add New Institute</h2>
          <p className="text-xs text-on-surface-variant m-0 mb-6">
            Manually register a partner institute. It will automatically be approved.
          </p>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Institute Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stanford Academy of Tech" required />
            </div>
            <div>
              <Label>Email Address (sign-in id)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admissions@institute.edu" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <p className="text-[11px] text-on-surface-variant mt-1 mb-0">
                The institute admin signs in with the email above and this password. Share it with
                them directly — it cannot be read back here afterwards, only reset.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Seattle" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0199" />
              </div>
            </div>
            <div>
              <Label>Primary Course Offered</Label>
              <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Cybersecurity & AI" />
            </div>
            {formError && (
              <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{formError}</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>Add Institute</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Institute Details Modal */}
      {selectedInstitute && (
        <Modal open={!!selectedInstitute} onClose={() => setSelectedInstitute(null)} width={440}>
          <div className="p-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary font-bold">
                <span className="material-symbols-outlined text-2xl">account_balance</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface m-0">{selectedInstitute.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone={selectedInstitute.status === 'Active' ? 'success' : 'error'}>
                    {selectedInstitute.status}
                  </Badge>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-Approved
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-3 mb-6 border border-outline-variant text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Email Address:</span>
                <span className="font-semibold text-on-surface">{selectedInstitute.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phone Number:</span>
                <span className="font-semibold text-on-surface">{selectedInstitute.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Location City:</span>
                <span className="font-semibold text-on-surface">{selectedInstitute.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Registered Date:</span>
                <span className="font-semibold text-on-surface">
                  {selectedInstitute.registeredAt ? new Date(selectedInstitute.registeredAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <Label>Courses Offered</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(selectedInstitute.courses || []).map((c, i) => (
                  <span key={i} className="text-xs bg-primary-fixed/40 text-primary font-semibold px-3 py-1 rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-outline-variant pt-4">
              <Button
                type="button"
                variant={selectedInstitute.status === 'Active' ? 'secondary' : 'primary'}
                onClick={() => handleToggleStatus(selectedInstitute)}
              >
                {selectedInstitute.status === 'Active' ? 'Suspend Access' : 'Activate Access'}
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" icon="edit" onClick={() => openEdit(selectedInstitute)}>
                  Edit
                </Button>
                <Button type="button" onClick={() => setSelectedInstitute(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Account & credentials editor. Email is the institute's sign-in id and
          the password box resets it outright, so both are handled here rather
          than in the read-only detail view. */}
      {editing && editForm && (
        <Modal open={!!editing} onClose={() => setEditing(null)} width={440}>
          <div className="p-2">
            <h2 className="text-xl font-bold text-on-surface m-0 mb-1">Edit Institute</h2>
            <p className="text-xs text-on-surface-variant m-0 mb-6">
              Update {editing.name}&apos;s details or reset the credentials they sign in with.
            </p>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <Label>Institute Name</Label>
                <Input value={editForm.name} onChange={setEdit('name')} required />
              </div>
              <div>
                <Label>Email Address (sign-in id)</Label>
                <Input type="email" value={editForm.email} onChange={setEdit('email')} required />
                <p className="text-[11px] text-on-surface-variant mt-1 mb-0">
                  Changing this changes the address they log in with.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={editForm.city} onChange={setEdit('city')} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={setEdit('phone')} />
                </div>
              </div>
              <div>
                <Label>Courses Offered</Label>
                <Input value={editForm.programs} onChange={setEdit('programs')} placeholder="Comma separated" />
              </div>
              <div className="pt-3 border-t border-outline-variant">
                <Label>Reset Password</Label>
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={setEdit('password')}
                  placeholder="Leave blank to keep the current password"
                  minLength={8}
                />
                <p className="text-[11px] text-on-surface-variant mt-1 mb-0">
                  Existing passwords cannot be displayed — only replaced. Fill this in only to set a
                  new one (at least 8 characters), then pass it on to the institute.
                </p>
              </div>

              {editError && (
                <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{editError}</p>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
