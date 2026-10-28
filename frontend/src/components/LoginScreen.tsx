import React, { useState } from 'react';
import { Lock, User, LogIn, KeyRound, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (token?: string, user?: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex flex-col h-screen w-screen items-center justify-center bg-cyber-dark text-cyber-text font-sans overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-neon/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-10 space-y-8 bg-cyber-panel rounded-2xl border border-cyber-border shadow-2xl backdrop-blur-sm">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyber-neon/10 border border-cyber-neon/20 mb-2 shadow-neon-glow">
            <Lock className="w-8 h-8 text-cyber-neon" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">System Access</h2>
          <p className="text-sm text-gray-400">Authenticate via secure API to access the agent platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-cyber-neon">
                <User className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-neon transition-colors" />
              </div>
              <input
                type="text"
                required
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-4 py-3 bg-[#0c0c0e] border border-cyber-border rounded-xl focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon transition-all text-white placeholder-gray-600 outline-none disabled:opacity-50"
                placeholder="Username (e.g. user01)"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-cyber-neon">
                <KeyRound className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-neon transition-colors" />
              </div>
              <input
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-4 py-3 bg-[#0c0c0e] border border-cyber-border rounded-xl focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon transition-all text-white placeholder-gray-600 outline-none disabled:opacity-50"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cyber-neon text-cyber-dark hover:bg-opacity-90 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Authenticate</span>
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
