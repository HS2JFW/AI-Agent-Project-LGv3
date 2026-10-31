import React, { useState } from 'react';
import { Lock, User, LogIn, KeyRound, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LoginScreenProps {
  onLogin: (token?: string, user?: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid username or password');
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('app_auth_token', data.access_token);
        if (data.user) {
          localStorage.setItem('app_user', JSON.stringify(data.user));
        }
        onLogin(data.access_token, data.user);
      } else {
        throw new Error('Authentication succeeded but token was missing.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden relative canvas-dots">
      {/* Top-Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme mode"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode (Ctrl+J)`}
          className="w-8 h-8 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 rotate-0 scale-100 transition-all duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700 rotate-0 scale-100 transition-all duration-300" />
          )}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-sm p-8 space-y-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-1 shadow-xs">
            <Lock className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">System Access</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Authenticate to enter the AI Builder platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-all text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-xs disabled:opacity-50"
                placeholder="Username (e.g. user01)"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-all text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-xs disabled:opacity-50"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-950/40 py-2.5 px-3 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in duration-150">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
