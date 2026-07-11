import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { notificationApi } from '../lib/api';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll({ limit: 20 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
  }, []);

  const connectSocket = useCallback(async (accessToken) => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    disconnectSocket();
    await fetchNotifications();

    const instance = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    instance.on('connect_error', () => setConnected(false));

    instance.on('notification', (notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === notification._id);
        if (exists) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((c) => c + 1);
    });

    instance.on('notification:count', ({ unreadCount: count }) => {
      setUnreadCount(count);
    });

    socketRef.current = instance;
    setSocket(instance);
  }, [disconnectSocket, fetchNotifications]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await connectSocket(session.access_token);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && newSession?.access_token) {
        await connectSocket(newSession.access_token);
      }
      if (event === 'SIGNED_OUT') {
        disconnectSocket();
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{
      socket, connected, notifications, unreadCount,
      markRead, markAllRead, fetchNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
