import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifie la session au démarrage
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const email = await authService.getCurrentUser();
      if (email && email !== 'Guest') {
        const info = await authService.getUserInfo(email);
        setUser({ email, ...info });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    await authService.login(email, password);
    const currentEmail = await authService.getCurrentUser();
    const info = await authService.getUserInfo(currentEmail);
    setUser({ email: currentEmail, ...info });
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};