import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-cr-primary/30 group"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0D1117, #161B22)'
          : 'linear-gradient(135deg, #F7F5F0, #EEF2EC)',
        border: `1px solid ${isDark ? '#30363D' : '#D4DDD4'}`,
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {/* Sliding circle */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-lg transition-all duration-400 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] flex items-center justify-center"
        style={{
          left: isDark ? '28px' : '2px',
          background: isDark
            ? 'linear-gradient(135deg, #6BAE7F, #4A7C59)'
            : 'linear-gradient(135deg, #D4AF37, #C4A882)',
        }}
      >
        {isDark ? (
          /* Moon icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          /* Sun icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        )}
      </span>

      {/* Stars (dark mode) */}
      {isDark && (
        <>
          <span className="absolute left-1.5 top-1 w-1 h-1 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '0s' }} />
          <span className="absolute left-3 top-3.5 w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <span className="absolute left-2 top-5 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
