import { useState, useEffect } from 'react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-24 w-24 text-2xl',
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';

  if (user?.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user?.fullName || 'Profile'}
        referrerPolicy="no-referrer"
        className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 font-medium text-white ring-2 ring-white ${className}`}>
      {initials}
    </div>
  );
};

export default UserAvatar;
