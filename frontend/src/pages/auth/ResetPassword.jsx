import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import AuthLayout from '../../components/layout/AuthLayout';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword, session } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!session) { setError('Invalid or expired reset link. Please request a new one.'); return; }
    setLoading(true);
    try {
      await updatePassword(password);
      navigate('/login', { state: { message: 'Password updated successfully. Please sign in.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set new password" subtitle="Enter your new password below">
      <Alert type="error" message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="auth-label" htmlFor="password">{t('auth.newPassword')}</label>
          <input id="password" type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required />
        </div>
        <div>
          <label className="auth-label" htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
          <input id="confirmPassword" type="password" className="auth-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <Spinner size="sm" /> : t('auth.updatePassword')}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
