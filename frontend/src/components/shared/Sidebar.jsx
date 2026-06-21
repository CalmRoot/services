import { Link, useLocation } from 'react-router-dom';
import { Home, SmilePlus, ClipboardList, Users, Calendar, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

/* ═══ Leaf Logo SVG ═══ */
const LeafLogo = () => (
  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
    <path d="M18 4C18 4 8 10 8 20C8 26 12 32 18 32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
    <path d="M18 4C18 4 28 10 28 20C28 26 24 32 18 32" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M18 12V32" stroke="currentColor" strokeWidth="2"/>
    <path d="M18 18L13 14" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <path d="M18 22L23 18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const userLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Mood Tracker', path: '/mood', icon: SmilePlus },
    { name: 'Assessments', path: '/assessments', icon: ClipboardList },
    { name: 'Find Therapist', path: '/therapists', icon: Users },
    { name: 'My Sessions', path: '/sessions', icon: Calendar },
  ];

  const therapistLinks = [
    { name: 'Dashboard', path: '/therapist/dashboard', icon: Home },
    { name: 'Sessions', path: '/therapist/sessions', icon: Calendar },
    { name: 'Availability', path: '/therapist/availability', icon: ClipboardList },
  ];

  const links = user?.role === 'therapist' ? therapistLinks : userLinks;

  return (
    <div className="w-64 min-h-screen text-white flex flex-col fixed left-0 top-0 z-40" style={{ background: 'linear-gradient(180deg, #1A3A2A, #0D2B1A)' }}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <span className="text-cr-primary-light"><LeafLogo /></span>
        <span className="text-xl font-heading font-bold tracking-tight text-white">
          Calm<span className="text-cr-primary-light">Root</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-cr-primary text-white shadow-md shadow-cr-primary/30'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-cr-primary-light/60'}`} />
              <span className="font-medium text-sm">{link.name}</span>
            </Link>
          );
        })}
        
        {user?.role === 'user' && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-sage-chat'))}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-white/70 hover:bg-white/8 hover:text-white w-full text-left"
          >
            <MessageCircle className="w-5 h-5 text-cr-primary-light/60" />
            <span className="font-medium text-sm">Chat with Sage</span>
          </button>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs text-white/40 font-mono">Theme</span>
          <ThemeToggle />
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.name}</span>
            <span className="text-xs text-white/40 truncate">{user?.email}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
