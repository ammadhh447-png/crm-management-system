import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import AuthLayout from '../../components/layout/AuthLayout';

const VerifyEmail = () => {
  const { t } = useLanguage();

  return (
    <AuthLayout title={t('auth.verifyEmail')} subtitle="Check your inbox for a verification link">
      <div className="auth-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <Mail className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          We sent a verification link to your email address. Click the link to activate your account.
        </p>
        <p className="mt-2 text-sm text-slate-500">After verifying, you can sign in to your account.</p>
      </div>
      <Link to="/login" className="auth-btn mt-6 block text-center no-underline">
        {t('auth.goToSignIn')}
      </Link>
    </AuthLayout>
  );
};

export default VerifyEmail;
