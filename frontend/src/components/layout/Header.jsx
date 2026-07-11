import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, X, UserPen, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../hooks/useLanguage';
import Sidebar from './Sidebar';
import UserAvatar from '../ui/UserAvatar';

const Header = () => {
  const { signOut, user, displayUser } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useSocket();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate('/login');
  };

  const goToProfile = () => {
    setProfileOpen(false);
    navigate('/settings?tab=profile');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm card shadow-lg sm:w-80">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-900">{t('header.notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">{t('header.markAllRead')}</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">{t('header.noNotifications')}</p>
                  ) : notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => { markRead(n._id); if (n.link) navigate(n.link); setNotifOpen(false); }}
                      className={`cursor-pointer border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                    >
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="rounded-full p-0.5 transition-all hover:ring-2 hover:ring-slate-200"
              aria-label={t('nav.profile')}
            >
              <UserAvatar user={displayUser || user} size="sm" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-w-none sm:w-64">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={displayUser || user} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={goToProfile}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <UserPen className="h-4 w-4 text-slate-500" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('header.signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64">
            <div className="relative h-full">
              <button onClick={() => setMobileOpen(false)} className="absolute right-2 top-4 z-10 rounded-lg p-1 text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
              <Sidebar mobile onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
