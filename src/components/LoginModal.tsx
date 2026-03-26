import React, { useEffect, useState } from 'react';
import { X, Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config';
import { LoadingScreen } from './LoadingScreen';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      onLoginSuccess?.();
    }
  }, [isAuthenticated, isOpen, onClose, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
      return;
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <>
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="absolute inset-0 bg-ocean-deep/80 backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
        />

        <div
          className={`relative max-h-[90vh] w-[95%] max-w-md overflow-y-auto rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-[#051923] md:p-8 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'} custom-scrollbar`}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center">
              <img
                src={APP_CONFIG.logoUrl}
                alt="Dyesabel Philippines logo"
                className="h-full w-full rounded-full object-contain drop-shadow-md"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-ocean-deep dark:text-white md:text-3xl">Welcome Back</h2>
            <p className="mt-2 text-sm font-medium text-ocean-deep/60 dark:text-gray-400">Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" size={18} />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-bold text-ocean-deep dark:text-gray-300">Username</label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-blue" size={18} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 font-medium text-ocean-deep transition-all placeholder:font-normal focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-bold text-ocean-deep dark:text-gray-300">Password</label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-blue" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 font-medium text-ocean-deep transition-all placeholder:font-normal focus:border-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary-cyan/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition-colors hover:text-ocean-deep disabled:opacity-50 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-ocean-deep to-primary-blue py-4 text-lg font-bold tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-primary-blue hover:to-primary-cyan hover:shadow-primary-cyan/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {isLoading && (
        <LoadingScreen
          title="Signing You In"
          subtitle="Opening your dashboard"
        />
      )}
    </>
  );
};
