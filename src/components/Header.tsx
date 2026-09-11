import React, { useState, useRef, useEffect } from 'react';
import { ViewId } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PhoneCall, 
  User, 
  Menu, 
  X, 
  Home, 
  ClipboardList, 
  Activity, 
  Bot, 
  BookOpen, 
  LayoutDashboard, 
  History, 
  Wind,
  ShieldCheck,
  LogIn,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  onOpenCrisis: () => void;
  onOpenGrounding?: () => void;
  onOpenAuth?: () => void;
}

const NAV_LINKS: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'assessment', label: 'Screening', icon: ClipboardList },
  { id: 'symptoms', label: 'Symptoms', icon: Activity },
  { id: 'chat', label: 'Saathi', icon: Bot },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: History },
];

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onNavigate, 
  onOpenCrisis, 
  onOpenGrounding,
  onOpenAuth 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, profile, loading, displayName, avatarUrl, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view: ViewId) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const isNavActive = (id: ViewId) => {
    if (currentView === id) return true;
    if (id === 'assessment' && ['consent', 'safety', 'intro', 'assessment', 'results'].includes(currentView)) {
      return true;
    }
    return false;
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-xs">
      <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 text-left group focus:outline-none"
            title="Aasra - Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-sky-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform text-white">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9A9 9 0 0 1 3 11a9 9 0 0 1 9-9z" fill="currentColor" fillOpacity="0.15" />
                <path d="M12 3a8 8 0 0 0-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8a8 8 0 0 0-8-8z" />
                <path d="M8 12c1.33-2 2.67-2 4 0s2.67 2 4 0" />
                <path d="M9 16c1-1 2-1 3 0s2 1 3 0" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg sm:text-xl text-gray-950 tracking-tight leading-none font-display">
                Aasra
              </span>
              <span className="text-[11px] text-gray-500 font-medium hidden xl:inline-block mt-0.5">
                Clinical Screener &amp; Trauma Support
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0 overflow-hidden">
          {NAV_LINKS.map((item) => {
            const active = isNavActive(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Emergency Tools */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenGrounding && (
            <button
              onClick={onOpenGrounding}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-all border border-teal-200/80 shadow-2xs"
              title="Quick 5-4-3-2-1 Grounding Practice"
            >
              <Wind className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span className="hidden md:inline">Grounding</span>
            </button>
          )}

          <button
            onClick={onOpenCrisis}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-all border border-red-200 shadow-2xs active:scale-95 cursor-pointer"
            title="India Mental Health Helplines: Tele-MANAS 14416 & Emergency 112"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span className="whitespace-nowrap">Crisis: 14416</span>
          </button>

          {/* User Profile / Auth State */}
          <div className="relative" ref={userMenuRef}>
            {loading ? (
              // Neutral skeleton while checking session — prevents flashing "Sign In"
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-all cursor-pointer shadow-2xs text-xs font-semibold"
                title="Account Menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-teal-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline max-w-[120px] truncate">
                  {displayName || profile?.display_name || user.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 hidden sm:inline" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Sign In</span>
              </button>
            )}

            {/* User Dropdown Menu */}
            {userMenuOpen && user && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {displayName || profile?.display_name || 'Patient'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-500" />
                  <span>My Clinical Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('history')}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <History className="w-4 h-4 text-gray-500" />
                  <span>Screening History</span>
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-2xl border-b border-gray-200 px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Auth Bar */}
          <div className="mb-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-teal-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {(displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {displayName || profile?.display_name || 'Patient'}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-gray-600">Save clinical progress</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition-colors cursor-pointer shadow-2xs"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {NAV_LINKS.map((item) => {
              const active = isNavActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                    active
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              HIPAA &amp; GDPR Aligned
            </span>
            {onOpenGrounding && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenGrounding();
                }}
                className="text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Grounding Tool</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
