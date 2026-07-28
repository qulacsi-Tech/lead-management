import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { registerMentor } from '../../Api/Api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Label } from '../../components/ui/Field';

export default function ManageMentors() {
  const { mentors, updateEntityStatus, deleteEntity, autoRegisterUser, refreshAdminData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [company, setCompany] = useState('');

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      await registerMentor({
        name,
        email,
        password: 'password123',
        domain: domain || 'Software Engineering',
        company: company || 'Independent Expert',
      });
    } catch {
      // Fallback
    }

    autoRegisterUser({
      name,
      email,
      role: 'mentor',
      domain: domain || 'Software Engineering',
      company: company || 'Independent Expert',
    });

    setName('');
    setEmail('');
    setDomain('');
    setCompany('');
    setIsAddModalOpen(false);
    refreshAdminData();
  };

  const handleToggleStatus = (m) => {
    const nextStatus = m.status === 'Active' ? 'Suspended' : 'Active';
    updateEntityStatus('mentor', m.id, nextStatus);
    if (selectedMentor && selectedMentor.id === m.id) {
      setSelectedMentor({ ...selectedMentor, status: nextStatus });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this mentor?')) {
      deleteEntity('mentor', id);
      if (selectedMentor && selectedMentor.id === id) {
        setSelectedMentor(null);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Manage Mentors</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Registered mentors are auto-approved. Manage domain experts, opportunities published, and mock tests.
          </p>
        </div>
        <Button icon="person_add" onClick={() => setIsAddModalOpen(true)}>
          Add Mentor
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 mb-6 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search by mentor name, domain, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-on-surface-variant font-semibold">Status Filter:</label>
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

      {/* Table */}
      <Card className="p-0 overflow-hidden border border-outline-variant">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant uppercase tracking-wider">
                <th className="py-3.5 px-5">Mentor Name</th>
                <th className="py-3.5 px-5">Domain Expertise</th>
                <th className="py-3.5 px-5">Company / Org</th>
                <th className="py-3.5 px-5">Rating</th>
                <th className="py-3.5 px-5">Tests / Opps</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {filteredMentors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-on-surface-variant text-xs">
                    No mentors found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMentors.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface m-0 text-sm">{m.name}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold m-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-Approved
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs font-medium text-on-surface">
                      <span className="bg-surface-container-high px-2.5 py-1 rounded-lg text-on-surface-variant">
                        {m.domain || 'General Mentorship'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-on-surface-variant font-medium">
                      {m.company || 'Independent'}
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-amber-600">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-amber-500">star</span>
                        {m.rating || '5.0'}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-on-surface-variant font-medium">
                      {m.testsCreated || 0} Tests / {m.opportunitiesPosted || 0} Opps
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={m.status === 'Active' ? 'success' : 'error'}>
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedMentor(m)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="View Profile"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${
                            m.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={m.status === 'Active' ? 'Suspend Mentor' : 'Activate Mentor'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {m.status === 'Active' ? 'block' : 'check_circle'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 text-error hover:bg-error-container/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="Delete Mentor"
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

      {/* Add Mentor Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <div className="p-2">
          <h2 className="text-xl font-bold text-on-surface m-0 mb-1">Add New Mentor</h2>
          <p className="text-xs text-on-surface-variant m-0 mb-6">
            Register a mentor expert. Account will be auto-approved immediately.
          </p>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Mentor Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Evelyn Carter" required />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="evelyn@mentors.com" required />
            </div>
            <div>
              <Label>Domain Expertise</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Artificial Intelligence & ML" />
            </div>
            <div>
              <Label>Company / Organization</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Tech Corp / Google" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Mentor</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Detail View Modal */}
      {selectedMentor && (
        <Modal isOpen={!!selectedMentor} onClose={() => setSelectedMentor(null)}>
          <div className="p-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface m-0">{selectedMentor.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedMentor.status === 'Active' ? 'success' : 'error'}>
                    {selectedMentor.status}
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
                <span className="font-semibold text-on-surface">{selectedMentor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Domain Expertise:</span>
                <span className="font-semibold text-on-surface">{selectedMentor.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Company:</span>
                <span className="font-semibold text-on-surface">{selectedMentor.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Mentor Rating:</span>
                <span className="font-bold text-amber-600">⭐ {selectedMentor.rating || '5.0'} / 5.0</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-outline-variant pt-4">
              <Button
                type="button"
                variant={selectedMentor.status === 'Active' ? 'secondary' : 'primary'}
                onClick={() => handleToggleStatus(selectedMentor)}
              >
                {selectedMentor.status === 'Active' ? 'Suspend Mentor' : 'Activate Mentor'}
              </Button>
              <Button type="button" onClick={() => setSelectedMentor(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
