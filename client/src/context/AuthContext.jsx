import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success) {
            setUser(res.user);
          }
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password, role = 'VIEWER') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.success) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const quickLogin = async (role) => {
    const credentials =
      role === 'ADMIN'
        ? { email: 'admin@enterprise.ai', password: 'Admin@12345' }
        : { email: 'viewer@enterprise.ai', password: 'Viewer@12345' };

    try {
      return await login(credentials.email, credentials.password);
    } catch (err) {
      // If demo user doesn't exist yet, auto-register
      const name = role === 'ADMIN' ? 'Sarah Chen (Admin)' : 'Alex Rivera (Viewer)';
      return await register(name, credentials.email, credentials.password, role);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    quickLogin,
    isAdmin: user?.role === 'ADMIN',
    isViewer: user?.role === 'VIEWER',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
