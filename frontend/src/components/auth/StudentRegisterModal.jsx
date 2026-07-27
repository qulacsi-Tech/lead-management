import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { registerStudent } from '../../Api/Api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Label } from '../ui/Field';
import { isValidEmail, required } from '../../utils/validate';

export default function StudentRegisterModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { loginFromToken } = useAuth();
  const { autoRegisterUser } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [course, setCourse] = useState('Cybersecurity');
  const [school, setSchool] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setCity('');
      setCourse('Cybersecurity');
      setSchool('');
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!required(name)) nextErrors.name = 'Enter your full name.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      // Call the real backend registration endpoint
      const tokenData = await registerStudent({
        name: name.trim(),
        email,
        password,
        phone: phone || undefined,
        city: city || undefined,
        target_course: course || undefined,
        current_school: school || undefined,
      });

      // Mirror into local DataContext so Admin module shows the new entry
      autoRegisterUser({
        name: name.trim(),
        email,
        role: 'student',
        city: city || 'N/A',
        course: course || 'N/A',
        phone: phone || 'N/A',
      });

      // Store token + set auth state — no second login call needed
      loginFromToken(tokenData);
      onClose();
      navigate('/student');
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Unable to create student account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} width={540}>
      <div className="p-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface m-0">Student Registration</h2>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Create your student account (Instant Auto-Approval enabled)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3.5">
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Wong" error={errors.name} autoComplete="off" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@example.com" error={errors.email} autoComplete="off" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} autoComplete="new-password" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Mobile Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 206-555-0101" />
            </div>
            <div>
              <Label>City / Location</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Seattle" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Target Course / Degree</Label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs outline-none text-on-surface"
              >
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Data Science">Data Science</option>
                <option value="Clinical Psychology">Clinical Psychology</option>
                <option value="Architectural Design">Architectural Design</option>
                <option value="Business Analytics">Business Analytics</option>
                <option value="Healthcare Administration">Healthcare Administration</option>
              </select>
            </div>
            <div>
              <Label>Current School / College</Label>
              <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="High School / College" />
            </div>
          </div>

          {errors.form && <p className="text-error text-xs m-0">{errors.form}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering…' : 'Register & Access Portal'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
