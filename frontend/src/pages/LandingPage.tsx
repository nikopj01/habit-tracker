import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden cyber-grid bg-[var(--bg-primary)]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-10 dark:opacity-20" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl floating" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl floating" style={{ animationDelay: '4s' }} />

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-neon-cyan dark:shadow-neon-cyan pulse-glow">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/50 to-purple-600/50 rounded-2xl blur-xl opacity-50 -z-10" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="gradient-text tracking-tight">Habit Tracker</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-4 max-w-2xl mx-auto">
          Build better habits, track your progress, and achieve your goals
        </p>
        <p className="text-base text-[var(--text-tertiary)] mb-12 max-w-xl mx-auto">
          A futuristic habit tracking platform designed to help you stay consistent and motivated
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/signin')}
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl
              shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
              transform hover:scale-105 transition-all duration-300
              overflow-hidden btn-glow"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="group px-8 py-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-xl
              border border-[var(--border-color)] hover:border-cyan-400/50
              shadow-lg hover:shadow-xl
              transform hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              Create Account
              <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </span>
          </button>
        </div>

        {/* Features preview */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: 'Track Progress',
              description: 'Visual analytics and heatmaps to see your consistency'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              ),
              title: 'Build Streaks',
              description: 'Maintain daily streaks and break personal records'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ),
              title: 'Stay Motivated',
              description: 'Gamified experience with effort scores and achievements'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card p-6 rounded-2xl card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-cyan-600 dark:text-cyan-400">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
    </div>
  );
};

export default LandingPage;
