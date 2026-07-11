const userRepository = require('../repositories/user.repository');
const activityService = require('../../activity/services/activity.service');
const AppError = require('../../../shared/errors/AppError');
const { ROLE_PERMISSIONS } = require('../../../shared/constants/permissions');
const { ROLE_LABELS, ROLES } = require('../../../shared/constants/roles');
const { adminEmails } = require('../../../config/env');
const { uploadFile, deleteFile, getSignedUrl, isConfigured } = require('../../../config/storage');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const isStorageKey = (avatar) => avatar && !avatar.startsWith('http');

const getAdminEmailList = () =>
  (adminEmails || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const ensureAdminAccess = async (user) => {
  if (!user) return user;

  const shouldBeAdmin = getAdminEmailList().includes(user.email.toLowerCase());
  if (!shouldBeAdmin || user.role === ROLES.ADMIN) return user;

  return userRepository.updateById(user._id, { role: ROLES.ADMIN });
};

const getMetadataValue = (user, key) => {
  if (!user?.metadata) return '';
  if (typeof user.metadata.get === 'function') return user.metadata.get(key) || '';
  return user.metadata[key] || '';
};

const getAuthProvider = (supabaseUser) => {
  if (!supabaseUser) return 'email';
  const identities = supabaseUser.identities || [];
  if (identities.some((identity) => identity.provider === 'google')) return 'google';
  if (supabaseUser.app_metadata?.provider === 'google') return 'google';
  return 'email';
};

const getGoogleAvatarUrl = (supabaseUser) => {
  const meta = supabaseUser?.user_metadata || {};
  const identity = (supabaseUser?.identities || []).find((item) => item.provider === 'google');
  const identityData = identity?.identity_data || {};

  return (
    meta.avatar_url
    || meta.picture
    || identityData.avatar_url
    || identityData.picture
    || ''
  );
};

const syncGoogleProfile = async (user, supabaseUser) => {
  if (!user || !supabaseUser) return user;

  const authProvider = getAuthProvider(supabaseUser);
  const updates = {};
  const storedProvider = getMetadataValue(user, 'authProvider');

  if (authProvider === 'google') {
    if (storedProvider !== 'google') {
      updates['metadata.authProvider'] = 'google';
    }

    const googleAvatar = getGoogleAvatarUrl(supabaseUser);
    if (googleAvatar) {
      if (isStorageKey(user.avatar)) {
        try {
          await deleteFile(user.avatar);
        } catch {}
      }

      if (user.avatar !== googleAvatar) {
        updates.avatar = googleAvatar;
      }
    }
  } else if (!storedProvider) {
    updates['metadata.authProvider'] = authProvider;
  }

  if (!Object.keys(updates).length) return user;
  return userRepository.updateById(user._id, updates);
};

const resolveAvatarUrl = async (avatar) => {
  if (!avatar) return '';
  if (!isStorageKey(avatar)) return avatar;
  if (!isConfigured()) return '';
  try {
    return await getSignedUrl(avatar, 60 * 60 * 24 * 7);
  } catch {
    return '';
  }
};

const formatUserResponse = async (user) => ({
  id: user._id,
  supabaseId: user.supabaseId,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  phone: user.phone,
  avatar: await resolveAvatarUrl(user.avatar),
  authProvider: getMetadataValue(user, 'authProvider') || 'email',
  role: user.role,
  roleLabel: ROLE_LABELS[user.role],
  department: user.department,
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified,
  lastLoginAt: user.lastLoginAt,
  permissions: ROLE_PERMISSIONS[user.role] || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const userService = {
  createProfile: async (supabaseUser, profileData, req) => {
    const existing = await userRepository.findBySupabaseId(supabaseUser.id);
    if (existing) {
      let synced = await syncGoogleProfile(existing, supabaseUser);
      synced = await ensureAdminAccess(synced);
      return await formatUserResponse(synced);
    }

    const emailExists = await userRepository.findByEmail(supabaseUser.email);
    if (emailExists) {
      throw new AppError('Email already registered', 409);
    }

    const meta = supabaseUser.user_metadata || {};
    const authProvider = getAuthProvider(supabaseUser);
    const firstName = profileData.firstName?.trim()
      || meta.given_name
      || meta.first_name
      || meta.full_name?.split(' ')[0]
      || meta.name?.split(' ')[0]
      || 'User';
    const lastName = profileData.lastName?.trim()
      || meta.family_name
      || meta.last_name
      || meta.full_name?.split(' ').slice(1).join(' ')
      || meta.name?.split(' ').slice(1).join(' ')
      || '';
    const avatar = authProvider === 'google' ? getGoogleAvatarUrl(supabaseUser) : '';
    const totalUsers = await userRepository.count();
    let role = profileData.role || ROLES.SALES_REP;
    if (totalUsers === 0 || getAdminEmailList().includes(supabaseUser.email.toLowerCase())) {
      role = ROLES.ADMIN;
    }

    const user = await userRepository.create({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      firstName,
      lastName,
      phone: profileData.phone || '',
      avatar,
      role,
      department: profileData.department || '',
      isEmailVerified: supabaseUser.email_confirmed_at ? true : false,
      metadata: { authProvider },
    }).catch(async (err) => {
      if (err?.code === 11000) {
        const duplicate = await userRepository.findBySupabaseId(supabaseUser.id);
        if (duplicate) return duplicate;
      }
      throw err;
    });

    await activityService.log({
      userId: user._id,
      action: 'create',
      module: 'user',
      description: `User profile created for ${user.email}`,
      targetId: user._id.toString(),
      targetType: 'user',
      req,
    });

    return await formatUserResponse(user);
  },

  syncSession: async (supabaseUser, req) => {
    let user = await userRepository.findBySupabaseId(supabaseUser.id);

    if (!user) {
      return userService.createProfile(supabaseUser, {}, req);
    }

    user = await syncGoogleProfile(user, supabaseUser);
    user = await ensureAdminAccess(user);

    user = await userRepository.updateById(user._id, {
      lastLoginAt: new Date(),
      isEmailVerified: supabaseUser.email_confirmed_at ? true : user.isEmailVerified,
    });

    await activityService.log({
      userId: user._id,
      action: 'login',
      module: 'auth',
      description: `User logged in: ${user.email}`,
      req,
    });

    return await formatUserResponse(user);
  },

  getProfile: async (userId, supabaseUser = null) => {
    let user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (supabaseUser) {
      user = await syncGoogleProfile(user, supabaseUser);
      user = await ensureAdminAccess(user);
    }

    return await formatUserResponse(user);
  },

  uploadProfileAvatar: async (userId, file, req) => {
    if (!file) {
      throw new AppError('No image file provided', 400);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400);
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new AppError('Image must be 5MB or smaller', 400);
    }
    if (!isConfigured()) {
      throw new AppError('File storage is not configured', 503);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (getMetadataValue(user, 'authProvider') === 'google' || getAuthProvider(req.supabaseUser) === 'google') {
      throw new AppError('Google accounts use the profile photo from your Google account', 400);
    }

    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const key = `avatars/${userId}/${Date.now()}.${ext}`;

    if (isStorageKey(user.avatar)) {
      try {
        await deleteFile(user.avatar);
      } catch {}
    }

    await uploadFile(key, file.buffer, file.mimetype, true);

    const updated = await userRepository.updateById(userId, { avatar: key });

    await activityService.log({
      userId: req.user._id,
      action: 'update',
      module: 'user',
      description: `Profile photo updated for ${updated.email}`,
      targetId: updated._id.toString(),
      targetType: 'user',
      req,
    });

    return await formatUserResponse(updated);
  },

  removeProfileAvatar: async (userId, req) => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (getMetadataValue(user, 'authProvider') === 'google' || getAuthProvider(req.supabaseUser) === 'google') {
      throw new AppError('Google accounts use the profile photo from your Google account', 400);
    }

    if (isStorageKey(user.avatar)) {
      try {
        await deleteFile(user.avatar);
      } catch {}
    }

    const updated = await userRepository.updateById(userId, { avatar: '' });

    await activityService.log({
      userId: req.user._id,
      action: 'update',
      module: 'user',
      description: `Profile photo removed for ${updated.email}`,
      targetId: updated._id.toString(),
      targetType: 'user',
      req,
    });

    return await formatUserResponse(updated);
  },

  updateProfile: async (userId, updateData, req) => {
    const allowedFields = ['firstName', 'lastName', 'phone', 'department'];
    const filtered = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filtered[field] = updateData[field];
      }
    });

    const user = await userRepository.updateById(userId, filtered);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await activityService.log({
      userId: req.user._id,
      action: 'update',
      module: 'user',
      description: `Profile updated for ${user.email}`,
      targetId: user._id.toString(),
      targetType: 'user',
      metadata: { fields: Object.keys(filtered) },
      req,
    });

    return await formatUserResponse(user);
  },

  getAllUsers: async (filters = {}, options = {}) => {
    const query = {};

    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [users, total] = await userRepository.findAll(query, options);

    return {
      users: await Promise.all(users.map((u) => formatUserResponse(u))),
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages: Math.ceil(total / (options.limit || 10)),
      },
    };
  },

  updateUser: async (targetUserId, updateData, req) => {
    const allowedFields = ['firstName', 'lastName', 'phone', 'role', 'department', 'isActive'];
    const filtered = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filtered[field] = updateData[field];
      }
    });

    if (filtered.role) {
      if (targetUserId === req.user._id.toString()) {
        throw new AppError('You cannot change your own role', 400);
      }

      if (filtered.role === ROLES.ADMIN && req.user.role !== ROLES.ADMIN) {
        throw new AppError('Only administrators can assign the admin role', 403);
      }

      if (req.user.role === ROLES.MANAGER && filtered.role === ROLES.ADMIN) {
        throw new AppError('Managers cannot assign the admin role', 403);
      }
    }

    const user = await userRepository.updateById(targetUserId, filtered);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await activityService.log({
      userId: req.user._id,
      action: 'update',
      module: 'user',
      description: `User ${user.email} updated by admin`,
      targetId: user._id.toString(),
      targetType: 'user',
      metadata: { fields: Object.keys(filtered) },
      req,
    });

    return await formatUserResponse(user);
  },

  deleteUser: async (targetUserId, req) => {
    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user._id.toString() === req.user._id.toString()) {
      throw new AppError('Cannot delete your own account', 400);
    }

    await userRepository.updateById(targetUserId, { isActive: false });

    await activityService.log({
      userId: req.user._id,
      action: 'deactivate',
      module: 'user',
      description: `User ${user.email} deactivated`,
      targetId: user._id.toString(),
      targetType: 'user',
      req,
    });

    return { message: 'User deactivated successfully' };
  },

  getPermissions: (role) => ROLE_PERMISSIONS[role] || [],
};

module.exports = userService;
