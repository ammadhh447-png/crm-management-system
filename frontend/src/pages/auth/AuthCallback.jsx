import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import BrandLogo from '../../components/ui/BrandLogo';

const AuthCallback = () => {
  const { session, user, loading, syncUserProfile } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || handled.current) return;

    if (session && user) {
      handled.current = true;
      navigate('/dashboard', { replace: true });
      return;
    }

    if (session && !user) {
      handled.current = true;
      syncUserProfile(session.user).then((profile) => {
        if (profile) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', {
            replace: true,
            state: { error: 'Failed to create user profile. Please try again.' },
          });
        }
      });
      return;
    }

    handled.current = true;
    navigate('/login', { replace: true });
  }, [loading, session, user, navigate, syncUserProfile]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-50 to-white px-6">
      <BrandLogo size="lg" variant="light" fullName />
      <Spinner size="lg" />
      <p className="text-sm text-slate-500">Completing sign in to CRM Management System...</p>
    </div>
  );
};

export default AuthCallback;
