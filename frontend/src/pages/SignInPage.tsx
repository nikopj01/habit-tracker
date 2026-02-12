import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.signIn({ email, password, rememberMe });
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('rememberMe', rememberMe.toString());
      console.log('Access Token:', response.accessToken);
      if (response.requiresProfileSetup) {
        console.log('Redirecting to profile setup...');
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
        console.log('Fetching user profile...');
        const user = await authService.getProfile();
        login(response.accessToken, user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden cyber-grid bg-[var(--bg-primary)] px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-10 dark:opacity-20" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl floating" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-md w-full">
        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-4 shadow-neon-cyan">
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
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold gradient-text">
              Welcome Back
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Sign in to continue your journey
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
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
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
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                    transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] 
                  text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--text-secondary)]">
                Remember me for 30 days
              </label>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-semibold text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Create one
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

export default SignInPage;
