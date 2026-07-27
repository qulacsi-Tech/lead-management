import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Label } from '../ui/Field';
import { isValidEmail, required } from '../../utils/validate';

export default function InstituteRegisterModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { autoRegisterUser } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [course, setCourse] = useState('Cybersecurity & Data Science');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!required(name)) nextErrors.name = 'Enter institute name.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter official institute email.';
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      // Auto-approve institute registration in DataContext
      autoRegisterUser({
        name: name.trim(),
        email,
        role: 'institute',
        city: city || 'Chicago',
        course: course || 'Higher Education & Tech',
        phone: phone || '+1 312-555-0142',
      });

      await register({ name: name.trim(), email, password, role: 'institute' });
      onClose();
      navigate('/institute');
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Unable to create institute account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} width={540}>
      <div className="p-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface m-0">Institute Partner Registration</h2>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Register an academic institution (Instant Auto-Approval enabled)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <Label>Institute / Academy Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apex Institute of Technology" error={errors.name} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Official Admissions Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admissions@apextech.edu" error={errors.email} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Admissions Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 312-555-0142" />
            </div>
            <div>
              <Label>Campus City / Location</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chicago" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Primary Programs Offered</Label>
              <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Cybersecurity, Data Science, MBA" />
            </div>
            <div>
              <Label>Website URL (Optional)</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://apextech.edu" />
            </div>
          </div>

          {errors.form && <p className="text-error text-xs m-0">{errors.form}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering…' : 'Register & Access Institute Portal'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
