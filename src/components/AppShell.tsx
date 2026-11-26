import type { ReactNode } from 'react';
import { ArrowLeft, ClipboardList, Home, Settings, ShieldAlert } from 'lucide-react';
import { LANGUAGES, UI_COPY } from '../data/i18n';
import type { LanguageCode, PageRoute } from '../types/complaint';

interface AppShellProps {
  currentPage: PageRoute;
  language: LanguageCode;
  isDemoMode: boolean;
  onNavigate: (page: PageRoute) => void;
  onLanguageChange: (lang: LanguageCode) => void;
  onBack?: () => void;
  children: ReactNode;
}

export function AppShell({
  currentPage,
  language,
  isDemoMode,
  onNavigate,
  onLanguageChange,
  onBack,
  children,
}: AppShellProps) {
  const t = UI_COPY[language];
  const isSubFlow =
    currentPage === 'listening' ||
    currentPage === 'clarification' ||
    currentPage === 'location' ||
    currentPage === 'confirmation' ||
    currentPage === 'success' ||
    currentPage === 'tracking';

  const navItems: Array<{ id: PageRoute; label: string; Icon: typeof Home }> = [
    { id: 'home', label: t.navHome, Icon: Home },
    { id: 'complaints', label: t.navComplaints, Icon: ClipboardList },
    { id: 'settings', label: t.navSettings, Icon: Settings },
  ];

  const activeNav: PageRoute =
    currentPage === 'tracking'
      ? 'complaints'
      : currentPage === 'complaints' || currentPage === 'settings'
        ? currentPage
        : 'home';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F1] text-[#1E2525]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#F8F6F1]/90 backdrop-blur-md border-b border-[#E6E2D9]/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {isSubFlow && onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="p-2 -ml-2 rounded-xl hover:bg-[#EAE6DD] text-[#1E2525] transition cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              {/* Custom SpeakUp Brand Logo */}
              <span className="w-9 h-9 rounded-xl bg-[#3F7375] text-white flex items-center justify-center shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="18" x2="12" y2="21" />
                </svg>
              </span>
              <span className="font-bold text-lg tracking-tight text-[#1E2525]">
                {t.appName}
              </span>
            </button>

            {isDemoMode && (
              <span
                title="Running with local demo storage and mock AI fallback"
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E9F1F1] text-[#2F595B] border border-[#3F7375]/20"
              >
                <ShieldAlert className="w-3 h-3" />
                {t.demoModeBadge}
              </span>
            )}
          </div>

          {/* Language Selection Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="header-language-select" className="sr-only">
              Select language
            </label>
            <select
              id="header-language-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="rounded-xl border border-[#DDD8CE] bg-white px-3 py-2 text-sm font-semibold text-[#1E2525] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeLabel} {lang.code !== 'en' ? `(${lang.label})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-28">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E6E2D9]"
      >
        <div className="max-w-2xl mx-auto px-4 h-18 flex items-center justify-around">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-2xl min-w-[84px] transition cursor-pointer ${
                  isActive
                    ? 'text-[#3F7375] bg-[#E9F1F1]'
                    : 'text-[#5B6666] hover:text-[#1E2525] hover:bg-[#F8F6F1]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.9} />
                <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
