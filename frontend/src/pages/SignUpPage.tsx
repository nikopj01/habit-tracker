import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.signUp({ email, password });
      
      // Store token and redirect to profile setup
      localStorage.setItem('accessToken', response.accessToken);
      
      if (response.requiresProfileSetup) {
        // Create temporary user object for auth context
        const tempUser = {
          id: response.userId,
          email: response.email,
          nickname: '',
          createdAt: new Date().toISOString()
        };
        login(response.accessToken, tempUser);
        navigate('/profile-setup');
      } else {
        // If profile already exists, fetch user data
        const user = await authService.getProfile();
        login(response.accessToken, user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden cyber-grid bg-[var(--bg-primary)] px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-10 dark:opacity-20" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl floating" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-md w-full">
        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-4 shadow-neon-purple">
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold gradient-text">
              Create Account
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Start your habit tracking journey today
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
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[var(--border-color)] rounded-xl 
                    bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                    placeholder-[var(--text-tertiary)]
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                    transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[var(--border-color)] rounded-xl 
                    bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                    placeholder-[var(--text-tertiary)]
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                    transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                Password must be at least 8 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl
                bg-gradient-to-r from-purple-500 to-pink-600
                text-white font-semibold
                shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link 
                to="/signin" 
                className="font-semibold text-purple-500 hover:text-purple-400 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
