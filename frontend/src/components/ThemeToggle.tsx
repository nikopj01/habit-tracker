import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full transition-all duration-300 ease-in-out
        bg-white/10 dark:bg-slate-800/50 backdrop-blur-md
        border border-slate-200/50 dark:border-slate-700/50
        hover:bg-white/20 dark:hover:bg-slate-700/50
        hover:scale-110 hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon */}
        <svg
          className={`absolute inset-0 w-6 h-6 text-amber-400 transition-all duration-500 transform
            ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        
        {/* Moon Icon */}
        <svg
          className={`absolute inset-0 w-6 h-6 text-indigo-300 transition-all duration-500 transform
            ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
      
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300
          ${theme === 'dark' ? 'bg-indigo-500/30 opacity-100' : 'bg-amber-400/30 opacity-100'}`}
      />
    </button>
  );
};

export default ThemeToggle;
