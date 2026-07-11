import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import AuthLayout from '../../components/layout/AuthLayout';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset link sent. Check your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.resetPassword')} subtitle="Enter your email to receive a reset link">
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="auth-label" htmlFor="email">{t('auth.email')}</label>
          <input id="email" type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
        </div>
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <Spinner size="sm" /> : t('auth.sendReset')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.rememberPassword')}{' '}
        <Link to="/login" className="auth-link">{t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
