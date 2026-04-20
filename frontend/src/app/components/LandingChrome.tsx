import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogOut, Menu, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { LanguageSelect } from './LanguageSelect';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, userRole } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full border-b transition-[background,box-shadow,border-color] duration-300 ${
        scrolled || userRole ? 'border-black/10 bg-white/92 py-3.5 shadow-[0_4px_40px_-10px_rgba(0,0,0,0.08)] backdrop-blur-xl' : 'border-black/10 bg-white/88 py-3.5 backdrop-blur-xl'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-[#DFFF00] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>

      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="group flex min-w-0 shrink-0 items-center gap-2 text-left sm:gap-3"
          onClick={() => navigate(userRole ? '/dashboard' : '/')}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black shadow-md ring-2 ring-[#DFFF00]/80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-8 4 16 3-8h4" />
            </svg>
          </div>
          <span className="truncate font-['DM_Serif_Display'] text-lg tracking-wide text-slate-900 sm:text-[22px]">
            ClearPath
          </span>
        </button>

        {!userRole && (
          <div className="hidden min-w-0 flex-1 justify-center px-4 text-slate-600 md:flex">
            <div className="flex max-w-full items-center gap-6 text-[11px] font-mono font-medium uppercase tracking-[0.16em] lg:gap-10">
              <Link to="/#product" className="shrink-0 transition-colors hover:text-black">Overview</Link>
              <Link to="/#criteria" className="shrink-0 transition-colors hover:text-black">Why It Scores</Link>
              <Link to="/#stack" className="shrink-0 transition-colors hover:text-black">Stack</Link>
              <Link to="/#roles" className="shrink-0 transition-colors hover:text-black">Journey</Link>
              <Link to="/contact" className="shrink-0 transition-colors hover:text-black">Contact</Link>
            </div>
          </div>
        )}

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {!userRole && <LanguageSelect variant="navbar" id="header-language" navbarOnDark={false} />}
          {userRole ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-black/15 bg-[#DFFF00]/15 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-black shadow-sm ring-1 ring-[#DFFF00]/30">
                {userRole === 'company' ? 'Company View' : 'Supplier View'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-3.5 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              state={{ role: 'company' }}
              className="inline-flex items-center justify-center rounded-full border border-black bg-[#DFFF00] px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#c8e800]"
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="p-1 -mr-1 text-slate-900"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute left-0 top-full flex w-full flex-col gap-5 border-b border-black/10 bg-white/95 px-6 py-6 shadow-2xl backdrop-blur-xl md:hidden">
          <LanguageSelect variant="inline" id="mobile-language" className="w-full min-w-0" />
          <Link to="/#product" className="border-b border-slate-100 pb-3 font-mono text-xs uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>Overview</Link>
          <Link to="/#criteria" className="border-b border-slate-100 pb-3 font-mono text-xs uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>Why It Scores</Link>
          <Link to="/#stack" className="border-b border-slate-100 pb-3 font-mono text-xs uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>Google Stack</Link>
          <Link to="/#roles" className="border-b border-slate-100 pb-3 font-mono text-xs uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>Journey</Link>
          <Link to="/contact" className="font-mono text-xs uppercase tracking-widest text-slate-600" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-black/10 bg-neutral-100 px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
            <p className="max-w-lg text-[11px] font-mono uppercase leading-relaxed tracking-[0.12em] text-neutral-500 sm:text-xs sm:tracking-[0.15em]">
              <span className="block sm:inline">Solution Challenge 2026 India</span>
              <span className="hidden px-3 text-neutral-300 sm:inline" aria-hidden>|</span>
              <span className="mt-1 block text-neutral-900 sm:mt-0 sm:inline">Smart Supply Chains Track</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
              <button type="button" className="rounded-full border border-black/10 bg-neutral-50 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-600 transition-all duration-200 hover:border-black hover:bg-[#DFFF00]/10 hover:text-black">Privacy</button>
              <button type="button" className="rounded-full border border-black/10 bg-neutral-50 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-600 transition-all duration-200 hover:border-black hover:bg-[#DFFF00]/10 hover:text-black">Terms</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
