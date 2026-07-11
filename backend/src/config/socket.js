const { Server } = require('socket.io');
const { supabase } = require('./supabase');
const { frontendUrl, nodeEnv } = require('./env');
const userRepository = require('../modules/user/repositories/user.repository');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return next(new Error('Invalid token'));

      const user = await userRepository.findBySupabaseId(data.user.id);
      if (!user || !user.isActive) return next(new Error('User not found or inactive'));

      socket.supabaseId = data.user.id;
      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.supabaseId}`);

    socket.emit('connected', { userId: socket.userId });

    socket.on('disconnect', () => {});
  });

  if (nodeEnv === 'development') {
    console.log('Socket.io initialized');
  }

  return io;
};

const getIO = () => io;

const emitToUser = (supabaseId, event, data) => {
  if (io) io.to(`user:${supabaseId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser };
