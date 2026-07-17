import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const saved = localStorage.getItem('cc_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  function storeSession(token, userData) {
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, storeSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
