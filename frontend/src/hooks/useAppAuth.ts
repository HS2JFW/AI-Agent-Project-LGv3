import { useState, useEffect, useCallback } from 'react';

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
    localStorage.removeItem('app_user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  }, []);

  const handleLoginSuccess = useCallback((user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  }, []);

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

