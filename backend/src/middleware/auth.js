const { supabase } = require('../config/supabase');
const AppError = require('../shared/errors/AppError');
const userRepository = require('../modules/user/repositories/user.repository');

const verifySupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError('Invalid or expired token', 401);
    }

    req.supabaseUser = data.user;
    req.accessToken = token;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError('Authentication failed', 401));
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError('Invalid or expired token', 401);
    }

    const user = await userRepository.findBySupabaseId(data.user.id);
    if (!user || !user.isActive) {
      throw new AppError('User account not found or inactive', 401);
    }

    req.supabaseUser = data.user;
    req.user = user;
    req.accessToken = token;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError('Authentication failed', 401));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      const user = await userRepository.findBySupabaseId(data.user.id);
      if (user && user.isActive) {
        req.supabaseUser = data.user;
        req.user = user;
        req.accessToken = token;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { verifySupabaseToken, authenticate, optionalAuth };
