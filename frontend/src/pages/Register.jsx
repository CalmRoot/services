import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, UserRound, Stethoscope, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    // Therapist fields
    licenseNumber: '', experienceYears: '', sessionPrice: '', bio: '', languages: ''
  });

  // Emergency contact fields
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '', email: '', relationship: 'Friend', consent: false
  });
  
  const [specializations, setSpecializations] = useState([]);
  const [approachMethods, setApproachMethods] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const specOptions = ['Anxiety', 'Depression', 'Trauma & PTSD', 'Addiction', 'Grief', 'OCD'];
  const approachOptions = ['CBT', 'DBT', 'EMDR', 'Mindfulness', 'Psychoeducation', 'Solution-Focused'];

  const handleToggleArr = (arr, setter, val) => {
    const stringVal = val.toLowerCase().replace(/ /g, '-');
    if (arr.includes(stringVal)) {
      setter(arr.filter(a => a !== stringVal));
    } else {
      setter([...arr, stringVal]);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleEmergencyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmergencyContact(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    // Validate emergency contact consent
    if (emergencyContact.email && !emergencyContact.consent) {
      return setError('Please provide consent to contact your emergency contact');
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: role,
      phone: formData.phone
    };

    // Add emergency contact data if provided
    if (emergencyContact.name || emergencyContact.email) {
      payload.emergencyContactName = emergencyContact.name;
      payload.emergencyContactEmail = emergencyContact.email;
      payload.emergencyContactRelationship = emergencyContact.relationship;
      payload.emergencyContactConsent = emergencyContact.consent;
    }

    if (role === 'therapist') {
      if (!formData.licenseNumber) return setError('License number is required for therapists');
      payload.therapistProfile = {
        licenseNumber: formData.licenseNumber,
        experienceYears: Number(formData.experienceYears) || 0,
        sessionPrice: Number(formData.sessionPrice) || 0,
        bio: formData.bio,
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        specializations,
        approachMethods
      };
    }

    setIsLoading(true);
    const result = await register(payload);
    setIsLoading(false);

    if (result.success) {
      navigate('/login', { state: { registered: true } });
    } else {
      setError(result.message);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-bg/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:bg-[#0D1117] dark:focus:bg-[#161B22]";

  return (
    <div className="flex min-h-screen bg-surface">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 text-white flex-col fixed h-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D2B1A, #1A4A2E, #2D5A3D)' }}>
        <div className="absolute inset-0 grain-overlay" />
        
        <div className="relative z-10 p-12 flex flex-col h-full justify-between">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-20 inline-flex">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" className="text-white">
                <path d="M18 4C18 4 8 10 8 20C8 26 12 32 18 32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
                <path d="M18 4C18 4 28 10 28 20C28 26 24 32 18 32" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M18 12V32" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-2xl font-heading font-bold tracking-tight text-white">
                Calm<span className="text-cr-primary-light">Root</span>
              </span>
            </Link>
            
            <h1 className="text-4xl lg:text-5xl font-heading font-bold tracking-tight mb-6 leading-tight">
              Begin your wellness<br/>journey today.
            </h1>
            
            <div className="space-y-6 mt-12 text-white/80">
              <div className="flex items-center gap-4 text-lg">
                <div className="bg-cr-primary-light/20 p-2 rounded-full"><span className="text-cr-primary-light">✓</span></div>
                <span>Take clinically validated assessments</span>
              </div>
              <div className="flex items-center gap-4 text-lg">
                <div className="bg-cr-primary-light/20 p-2 rounded-full"><span className="text-cr-primary-light">✓</span></div>
                <span>AI-powered mood insights by Sage</span>
              </div>
              <div className="flex items-center gap-4 text-lg">
                <div className="bg-cr-primary-light/20 p-2 rounded-full"><span className="text-cr-primary-light">✓</span></div>
                <span>Book sessions with verified therapists</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - SCROLLABLE FORM */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] px-6 py-12 sm:px-12 xl:px-24 bg-surface min-h-screen">
        <div className="max-w-xl w-full mx-auto">
          <div className="mb-10 lg:mt-8">
            <h2 className="text-3xl font-heading font-bold text-text mb-2">Create Account</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-3 text-danger text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 pb-10">
            {/* ROLE SELECTOR */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`p-4 rounded-xl border text-left transition-all ${role === 'user' ? 'border-primary ring-1 ring-primary bg-bg' : 'border-border bg-surface hover:bg-bg/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-text mb-1">
                  <UserRound className={`w-5 h-5 ${role==='user'?'text-primary':'text-muted'}`} />
                  I need support
                </div>
                <div className="text-xs text-muted">Take assessments, track mood, book therapy</div>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('therapist')}
                className={`p-4 rounded-xl border text-left transition-all ${role === 'therapist' ? 'border-primary ring-1 ring-primary bg-bg' : 'border-border bg-surface hover:bg-bg/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-text mb-1">
                  <Stethoscope className={`w-5 h-5 ${role==='therapist'?'text-primary':'text-muted'}`} />
                  I am a therapist
                </div>
                <div className="text-xs text-muted">Manage sessions, help clients grow</div>
              </button>
            </div>

            {/* COMMON FIELDS */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-2">Email Address</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Password</label>
                  <input required type="password" name="password" value={formData.password} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Confirm Password</label>
                  <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-2">Phone (Optional)</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            {/* ═══════ EMERGENCY CONTACT SECTION ═══════ */}
            {role === 'user' && (
              <div className="rounded-2xl border border-border bg-cr-surface-alt/50 dark:bg-[#161B22] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowEmergency(!showEmergency)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-cr-error" />
                    <div>
                      <span className="font-semibold text-text text-sm">🆘 Emergency Contact</span>
                      <span className="text-xs text-muted ml-2">(Optional but Recommended)</span>
                    </div>
                  </div>
                  {showEmergency ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </button>

                {showEmergency && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50">
                    <p className="text-xs text-muted mt-3">
                      We'll reach out to this person if our AI detects you may need support
                    </p>

                    <div>
                      <label className="block text-sm font-semibold text-text mb-1">Contact Name</label>
                      <input
                        type="text"
                        name="name"
                        value={emergencyContact.name}
                        onChange={handleEmergencyChange}
                        placeholder="Friend or family member's name"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-text mb-1">Contact Email</label>
                      <input
                        type="email"
                        name="email"
                        value={emergencyContact.email}
                        onChange={handleEmergencyChange}
                        placeholder="their@email.com"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-text mb-1">Relationship</label>
                      <select
                        name="relationship"
                        value={emergencyContact.relationship}
                        onChange={handleEmergencyChange}
                        className={inputCls}
                      >
                        <option value="Friend">Friend</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Partner">Partner</option>
                        <option value="Colleague">Colleague</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {emergencyContact.email && (
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-bg dark:bg-[#0D1117] border border-border/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="consent"
                          checked={emergencyContact.consent}
                          onChange={handleEmergencyChange}
                          className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-muted leading-relaxed">
                          ✅ I consent to CalmRoot contacting this person if the AI detects I may need support
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* THERAPIST FIELDS */}
            {role === 'therapist' && (
              <div className="space-y-6 pt-6 border-t border-border">
                <h3 className="text-xl font-heading font-bold text-text">Therapist Details</h3>
                
                <div className="bg-cr-primary-light/10 border border-cr-primary-light/20 p-4 rounded-xl flex gap-3 text-cr-primary text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Your account will be reviewed by our admin team before you can receive session bookings.</p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-text mb-2">License Number <span className="text-danger">*</span></label>
                    <input required type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Years of Experience</label>
                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Session Price (₹)</label>
                    <input type="number" name="sessionPrice" value={formData.sessionPrice} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Specializations</label>
                  <div className="grid grid-cols-2 gap-2">
                    {specOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" 
                          checked={specializations.includes(opt.toLowerCase().replace(/ /g, '-'))}
                          onChange={() => handleToggleArr(specializations, setSpecializations, opt)}
                        /> {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Approach Methods</label>
                  <div className="grid grid-cols-2 gap-2">
                    {approachOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" 
                          checked={approachMethods.includes(opt.toLowerCase().replace(/ /g, '-'))}
                          onChange={() => handleToggleArr(approachMethods, setApproachMethods, opt)}
                        /> {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Languages Spoken (comma separated)</label>
                  <input type="text" name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Hindi" className={inputCls} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Professional Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} maxLength={500} className={`${inputCls} resize-none`} />
                  <div className="text-right text-xs text-muted mt-1">{formData.bio.length} / 500</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl text-white font-bold hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg glow-primary"
              style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center pb-8 text-muted font-medium border-t border-border pt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-cr-primary-dark transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
