import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!nickname.trim()) {
      setError('Nickname is required');
      setIsLoading(false);
      return;
    }

    try {
      const user = await authService.setNickname({ nickname: nickname.trim() });
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        login(token, user);
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set nickname. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden cyber-grid bg-[var(--bg-primary)] px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-10 dark:opacity-20" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl floating" />
      <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-md w-full">
        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Progress indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-neon-cyan pulse-glow">
                2
              </div>
              <div className="w-16 h-1 bg-[var(--border-color)] rounded-full" />
              <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-tertiary)] text-sm font-bold">
                3
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-neon-cyan">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold gradient-text">
              Set Up Your Profile
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              What should we call you?
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Nickname
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="nickname"
                  type="text"
                  required
                  maxLength={50}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[var(--border-color)] rounded-xl 
                    bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                    placeholder-[var(--text-tertiary)]
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                    transition-all duration-300"
                  placeholder="Enter your nickname"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {nickname.length}/50
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                This is how we'll address you in the app
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl
                bg-gradient-to-r from-cyan-500 to-blue-600
                text-white font-semibold
                shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                transform hover:scale-[1.02] transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                btn-glow overflow-hidden"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Tips */}
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">
                Choose a nickname that represents you! This will be displayed on your dashboard and shared with friends if you add them later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
