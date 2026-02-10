import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

  // Handle animation states
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  // Close modal if already authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
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
    } else {
      // Success - modal will close via useEffect
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ocean-deep/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className={`relative w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#051923] rounded-[2rem] shadow-2xl border border-white/10 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'} p-6 md:p-8 custom-scrollbar`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-ocean-deep/5 dark:border-white/10 p-4">
             <img 
               src="https://i.imgur.com/CQCKjQM.png" 
               alt="Dyesabel Logo" 
               className="w-full h-full object-contain drop-shadow-md"
             />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-ocean-deep dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-ocean-deep/60 dark:text-gray-400 mt-2 text-sm font-medium">Sign in to access your dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ocean-deep dark:text-gray-300 ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50 focus:border-primary-cyan transition-all font-medium placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ocean-deep dark:text-gray-300 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50 focus:border-primary-cyan transition-all font-medium placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ocean-deep dark:hover:text-white transition-colors p-1 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-ocean-deep to-primary-blue hover:from-primary-blue hover:to-primary-cyan text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-cyan/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-lg tracking-wide mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Credentials Info (Remove in production) */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Demo Credentials:</p>
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <p>Admin: admin / admin123</p>
            <p>Chapter Head: chapter1 / chapter123</p>
            <p>Editor: editor / editor123</p>
          </div>
        </div>
      </div>
    </div>
  );
};
