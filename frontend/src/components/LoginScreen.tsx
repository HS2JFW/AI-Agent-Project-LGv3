import React, { useState } from 'react';
import { Lock, User, LogIn, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'user01' && password.trim() === 'admin') {
      onLogin();
    } else {
      setError('Invalid username or password');
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
          <p className="text-sm text-gray-400">Please authenticate to continue to the process manager.</p>
        </div>

        <div className="space-y-6 mt-8">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-cyber-neon">
                <User className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-neon transition-colors" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-4 py-3 bg-[#0c0c0e] border border-cyber-border rounded-xl focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon transition-all text-white placeholder-gray-600 outline-none"
                placeholder="Username"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-cyber-neon">
                <KeyRound className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-neon transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-4 py-3 bg-[#0c0c0e] border border-cyber-border rounded-xl focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon transition-all text-white placeholder-gray-600 outline-none"
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
            type="button"
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cyber-neon text-cyber-dark hover:bg-opacity-90 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-neon-glow"
          >
            <span>Authenticate</span>
            <LogIn className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
