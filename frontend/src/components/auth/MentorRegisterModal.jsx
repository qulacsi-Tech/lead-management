import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { registerMentor } from '../../Api/Api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Label } from '../ui/Field';
import { isValidEmail, required } from '../../utils/validate';

export default function MentorRegisterModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { loginFromToken } = useAuth();
  const { autoRegisterUser } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [domain, setDomain] = useState('Artificial Intelligence & ML');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('5+ Years');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setDomain('Artificial Intelligence & ML');
      setCompany('');
      setExperience('5+ Years');
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
      const tokenData = await registerMentor({
        name: name.trim(),
        email,
        password,
        phone: phone || undefined,
        domain: domain || undefined,
        company: company || undefined,
        experience_level: experience || undefined,
      });

      // Mirror into local DataContext so Admin module shows the new entry
      autoRegisterUser({
        name: name.trim(),
        email,
        role: 'mentor',
        domain: domain || 'N/A',
        company: company || 'N/A',
        phone: phone || 'N/A',
      });

      loginFromToken(tokenData);
      onClose();
      navigate('/mentor');
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Unable to create mentor account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} width={540}>
      <div className="p-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface m-0">Mentor Expert Registration</h2>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Join as an industry mentor (Instant Auto-Approval enabled)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3.5">
          <div>
            <Label>Mentor Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Evelyn Carter" error={errors.name} autoComplete="off" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="evelyn@mentors.com" error={errors.email} autoComplete="off" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} autoComplete="new-password" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Phone / WhatsApp</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0188" />
            </div>
            <div>
              <Label>Domain Specialization</Label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs outline-none text-on-surface"
              >
                <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                <option value="Cybersecurity & Infrastructure">Cybersecurity & Infrastructure</option>
                <option value="Product Design & UX">Product Design & UX</option>
                <option value="Data Science & Engineering">Data Science & Engineering</option>
                <option value="Business Strategy & Management">Business Strategy & Management</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Current Company / Organization</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Tech Corp / Google" />
            </div>
            <div>
              <Label>Experience Level</Label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs outline-none text-on-surface"
              >
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
                <option value="10+ Years Executive">10+ Years Executive</option>
              </select>
            </div>
          </div>

          {errors.form && <p className="text-error text-xs m-0">{errors.form}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering…' : 'Register & Access Mentor Portal'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
