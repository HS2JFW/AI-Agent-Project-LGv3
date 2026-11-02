import { useState, useEffect, useCallback } from 'react';
import { getBackendUrl, getAuthHeaders } from '../utils/apiConfig';

export function useAppAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('app_auth_token'));
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('app_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('modal') === 'users' || window.location.hash === '#users' || window.location.hash === '#/users';
    } catch (e) {
      return false;
    }
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem('app_auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('app_user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  }, []);

  const handleLoginSuccess = useCallback((user: any) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('app_user', JSON.stringify(user));
    }
    setIsLoggedIn(true);
  }, []);

  // Sync / verify user session with backend on mount
  useEffect(() => {
    const token = localStorage.getItem('app_auth_token') || localStorage.getItem('token');
    if (token) {
      fetch(`${getBackendUrl()}/api/auth/me`, {
        headers: getAuthHeaders(),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
            localStorage.setItem('app_user', JSON.stringify(data));
            setIsLoggedIn(true);
          } else if (res.status === 401) {
            handleLogout();
          }
        })
        .catch(() => {
          // If offline or network error, fallback to cached localStorage user
        });
    }
  }, [handleLogout]);

  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('modal') === 'users' || window.location.hash === '#users' || window.location.hash === '#/users') {
          setIsUserManagementOpen(true);
        }
      } catch (e) {}
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  return {
    isLoggedIn,
    setIsLoggedIn,
    currentUser,
    setCurrentUser,
    isUserManagementOpen,
    setIsUserManagementOpen,
    handleLogout,
    handleLoginSuccess,
  };
}
