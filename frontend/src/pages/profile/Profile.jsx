import { useState, useEffect, useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import UserAvatar from '../../components/ui/UserAvatar';

const Profile = ({ embedded = false }) => {
  const { user, displayUser, isGoogleUser, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        department: user.department || '',
      });
      setPreviewUrl('');
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller');
      e.target.value = '';
      return;
    }

    setError('');
    setSuccess('');
    setPhotoLoading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      await userApi.uploadAvatar(file);
      await refreshProfile();
      setSuccess('Profile photo updated');
    } catch (err) {
      setPreviewUrl('');
      setError(err.message);
    } finally {
      setPhotoLoading(false);
      URL.revokeObjectURL(objectUrl);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.avatar && !previewUrl) return;

    setError('');
    setSuccess('');
    setPhotoLoading(true);

    try {
      await userApi.removeAvatar();
      await refreshProfile();
      setPreviewUrl('');
      setSuccess('Profile photo removed');
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await userApi.updateProfile(form);
      await refreshProfile();
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarUser = {
    ...(displayUser || user),
    avatar: previewUrl || displayUser?.avatar || user?.avatar,
  };

  return (
    <div>
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-primary-900">Profile</h1>
          <p className="mt-1 text-sm text-primary-500">Manage your account information</p>
        </div>
      )}

      <div className={embedded ? '' : 'mx-auto max-w-2xl'}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />

        <div className="card p-6">
          <div className="mb-6 flex flex-col gap-4 border-b border-primary-100 pb-6 sm:flex-row sm:items-center">
            <div className={`relative w-fit ${!isGoogleUser ? 'group' : ''}`}>
              <UserAvatar user={avatarUser} size="xl" />
              {!isGoogleUser && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoLoading}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                    aria-label="Change profile photo"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </>
              )}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-primary-900">{user?.fullName}</p>
              <p className="text-sm text-primary-500">{user?.email}</p>
              <p className="text-xs text-primary-400">{user?.roleLabel}</p>

              {isGoogleUser ? (
                <p className="mt-3 text-xs text-primary-500">
                  Profile photo from your Google account
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      loading={photoLoading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse gallery
                    </Button>
                    {(user?.avatar || previewUrl) && (
                      <Button
                        type="button"
                        variant="ghost"
                        loading={photoLoading}
                        onClick={handleRemovePhoto}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Remove photo
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-primary-400">JPEG, PNG, GIF, or WebP. Max 5MB.</p>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            <Input
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
            />

            <div className="pt-2">
              <Button type="submit" loading={loading}>
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
