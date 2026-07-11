import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import AuthLayout from '../../components/layout/AuthLayout';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const Signup = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const data = await signUp(form.email, form.password, { firstName: form.firstName, lastName: form.lastName, phone: form.phone, department: form.department });
      if (data.user && !data.session) {
        setSuccess('Account created. Please check your email to verify your account.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', props = {}) => (
    <div>
      <label className="auth-label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="auth-input" value={form[name]} onChange={handleChange} {...props} />
    </div>
  );

  return (
    <AuthLayout title={t('auth.createAccount')} subtitle="Fill in your details to get started" compact>
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <form onSubmit={handleSubmit} className="auth-form-compact space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {field('firstName', 'First name', 'text', { required: true })}
          {field('lastName', 'Last name', 'text', { required: true })}
        </div>
        {field('email', t('auth.email'), 'email', { placeholder: 'you@company.com', required: true })}
        <div className="grid grid-cols-2 gap-3">
          {field('phone', 'Phone', 'tel')}
          {field('department', 'Department')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('password', t('auth.password'), 'password', { placeholder: 'Min 8 chars', required: true })}
          {field('confirmPassword', t('auth.confirmPassword'), 'password', { required: true })}
        </div>
        <button type="submit" className="auth-btn auth-btn-compact" disabled={loading}>
          {loading ? <Spinner size="sm" /> : t('auth.createAccount')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="auth-link">{t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
