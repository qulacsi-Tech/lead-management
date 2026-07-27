import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { registerInstitute, fetchStates, fetchDistricts, fetchBlocks } from '../../Api/Api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Label, Select } from '../ui/Field';
import { isValidEmail, required } from '../../utils/validate';

export default function InstituteRegisterModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { loginFromToken } = useAuth();
  const { autoRegisterUser } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');

  // Geo dropdown data states
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch states list & reset fields when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setState('');
    setDistrict('');
    setBlock('');
    setCity('');
    setWebsite('');
    setErrors({});

    let isMounted = true;
    setLoadingStates(true);
    fetchStates()
      .then((data) => {
        if (isMounted) setStatesList(data || []);
      })
      .catch(() => {
        if (isMounted) setStatesList([]);
      })
      .finally(() => {
        if (isMounted) setLoadingStates(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Fetch districts when state changes
  useEffect(() => {
    setDistrict('');
    setBlock('');
    setDistrictsList([]);
    setBlocksList([]);
    if (!state) return;

    let isMounted = true;
    setLoadingDistricts(true);
    fetchDistricts(state)
      .then((data) => {
        if (isMounted) setDistrictsList(data || []);
      })
      .catch(() => {
        if (isMounted) setDistrictsList([]);
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });
    return () => {
      isMounted = false;
    };
  }, [state]);

  // Fetch blocks when district changes
  useEffect(() => {
    setBlock('');
    setBlocksList([]);
    if (!state || !district) return;

    let isMounted = true;
    setLoadingBlocks(true);
    fetchBlocks(state, district)
      .then((data) => {
        if (isMounted) setBlocksList(data || []);
      })
      .catch(() => {
        if (isMounted) setBlocksList([]);
      })
      .finally(() => {
        if (isMounted) setLoadingBlocks(false);
      });
    return () => {
      isMounted = false;
    };
  }, [state, district]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!required(name)) nextErrors.name = 'Enter institute name.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter official institute email.';
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (!state) nextErrors.state = 'Select a state.';
    if (!district) nextErrors.district = 'Select a district.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      // Call backend registration endpoint with state, district, block
      const tokenData = await registerInstitute({
        name: name.trim(),
        email,
        password,
        phone: phone || undefined,
        state: state || undefined,
        district: district || undefined,
        block: block || undefined,
        city: city || district || undefined,
        website: website || undefined,
      });

      // Mirror into local DataContext for Admin module display
      autoRegisterUser({
        name: name.trim(),
        email,
        role: 'institute',
        state: state || 'N/A',
        district: district || 'N/A',
        block: block || 'N/A',
        city: city || district || 'N/A',
        phone: phone || 'N/A',
      });

      loginFromToken(tokenData);
      onClose();
      navigate('/institute');
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Unable to create institute account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} width={580}>
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

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3.5">
          <div>
            <Label>Institute / Academy Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apex Institute of Technology" error={errors.name} autoComplete="off" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Official Admissions Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admissions@apextech.edu" error={errors.email} autoComplete="off" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} autoComplete="new-password" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Admissions Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div>
              <Label>Website URL (Optional)</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://apextech.edu" />
            </div>
          </div>

          {/* Location Hierarchy: State -> District -> Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>State / UT</Label>
              <Select
                value={state}
                onChange={(e) => setState(e.target.value)}
                error={errors.state}
                disabled={loadingStates}
                required
              >
                <option value="">{loadingStates ? 'Loading states…' : '-- Select State --'}</option>
                {statesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>District</Label>
              <Select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                error={errors.district}
                disabled={!state || loadingDistricts}
                required
              >
                <option value="">
                  {!state ? '-- Select State First --' : loadingDistricts ? 'Loading districts…' : '-- Select District --'}
                </option>
                {districtsList.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Block / Mandal / Taluka</Label>
              <Select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                disabled={!district || loadingBlocks}
              >
                <option value="">
                  {!district ? '-- Select District First --' : loadingBlocks ? 'Loading blocks…' : '-- Select Block --'}
                </option>
                {blocksList.map((bk) => (
                  <option key={bk} value={bk}>
                    {bk}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Campus City / Town / Address (Optional)</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Salt Lake Sector V" />
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
