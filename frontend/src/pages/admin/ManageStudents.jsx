import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { registerStudent } from '../../Api/Api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Label } from '../../components/ui/Field';

export default function ManageStudents() {
  const { students, updateEntityStatus, deleteEntity, autoRegisterUser, refreshAdminData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  const filteredStudents = students.filter((stud) => {
    const matchesSearch =
      stud.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stud.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stud.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stud.course || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || stud.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      await registerStudent({
        name,
        email,
        password: 'password123',
        phone,
        city,
        target_course: course || 'Computer Science',
      });
    } catch {
      // Fallback
    }

    autoRegisterUser({
      name,
      email,
      role: 'student',
      city,
      phone,
      course: course || 'Computer Science',
    });

    setName('');
    setEmail('');
    setCity('');
    setPhone('');
    setCourse('');
    setIsAddModalOpen(false);
    refreshAdminData();
  };

  const handleToggleStatus = (stud) => {
    const nextStatus = stud.status === 'Active' ? 'Suspended' : 'Active';
    updateEntityStatus('student', stud.id, nextStatus);
    if (selectedStudent && selectedStudent.id === stud.id) {
      setSelectedStudent({ ...selectedStudent, status: nextStatus });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      deleteEntity('student', id);
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent(null);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Manage Students</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Registered students are auto-approved upon sign up. Manage student accounts, leads posted, and rewards.
          </p>
        </div>
        <Button icon="person_add" onClick={() => setIsAddModalOpen(true)}>
          Add Student
        </Button>
      </div>

      {/* Search & Filter Card */}
      <Card className="p-4 mb-6 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, course, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-on-surface-variant font-semibold">Filter Status:</label>
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
                <th className="py-3.5 px-5">Student Name</th>
                <th className="py-3.5 px-5">Target Course / City</th>
                <th className="py-3.5 px-5">Contact Email</th>
                <th className="py-3.5 px-5">Leads Posted</th>
                <th className="py-3.5 px-5">Points</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-on-surface-variant text-xs">
                    No students match your filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stud) => (
                  <tr key={stud.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                          <span className="material-symbols-outlined">school</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface m-0 text-sm">{stud.name}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold m-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-Approved
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-on-surface-variant">
                      <p className="m-0 font-semibold text-on-surface">{stud.course}</p>
                      <p className="m-0 text-[11px]">{stud.city}</p>
                    </td>
                    <td className="py-4 px-5 text-xs text-on-surface-variant font-mono">{stud.email}</td>
                    <td className="py-4 px-5 text-xs font-semibold text-on-surface">
                      {stud.leadsPosted || 0} Leads ({stud.verifiedLeads || 0} Verified)
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-amber-600">
                      {stud.points || 0} pts
                    </td>
                    <td className="py-4 px-5">
                      <Badge tone={stud.status === 'Active' ? 'success' : 'error'}>
                        {stud.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedStudent(stud)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="View Profile"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(stud)}
                          className={`p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${
                            stud.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={stud.status === 'Active' ? 'Suspend Student' : 'Activate Student'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {stud.status === 'Active' ? 'block' : 'check_circle'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(stud.id)}
                          className="p-1.5 text-error hover:bg-error-container/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="Delete Student"
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

      {/* Add Student Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} width={440}>
        <div className="p-2">
          <h2 className="text-xl font-bold text-on-surface m-0 mb-1">Register New Student</h2>
          <p className="text-xs text-on-surface-variant m-0 mb-6">
            Add a student to the system. Account will be auto-approved immediately.
          </p>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Student Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Smith" required />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@example.com" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Seattle" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0101" />
              </div>
            </div>
            <div>
              <Label>Target Course / Degree</Label>
              <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Cybersecurity" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Student</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Student Detail Modal */}
      {selectedStudent && (
        <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} width={440}>
          <div className="p-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface m-0">{selectedStudent.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone={selectedStudent.status === 'Active' ? 'success' : 'error'}>
                    {selectedStudent.status}
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
                <span className="font-semibold text-on-surface">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Course Interest:</span>
                <span className="font-semibold text-on-surface">{selectedStudent.course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">City:</span>
                <span className="font-semibold text-on-surface">{selectedStudent.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Reward Points:</span>
                <span className="font-bold text-amber-600">{selectedStudent.points || 0} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Registered Date:</span>
                <span className="font-semibold text-on-surface">
                  {new Date(selectedStudent.registeredAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-outline-variant pt-4">
              <Button
                type="button"
                variant={selectedStudent.status === 'Active' ? 'secondary' : 'primary'}
                onClick={() => handleToggleStatus(selectedStudent)}
              >
                {selectedStudent.status === 'Active' ? 'Suspend Student' : 'Activate Student'}
              </Button>
              <Button type="button" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
