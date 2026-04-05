import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { Contrast, LayoutGrid, Plus, LogOut, Volume2, VolumeX, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cp } from '../lib/cpUi';

function useShellTitle(): string {
  const { pathname } = useLocation();
  const { id } = useParams();
  const { shipments, userRole } = useAppContext();
  const isCompany = userRole === 'company';

  if (pathname === '/dashboard') {
    return isCompany ? 'Incoming shipments' : 'Outgoing shipments';
  }
  if (pathname === '/add-shipment') {
    return isCompany ? 'Request shipment' : 'Register shipment';
  }
  if (pathname.startsWith('/shipment/') && id) {
    const s = shipments.find((x) => x.id === id);
    return s?.name ?? 'Shipment';
  }
  return 'ClearPath';
}

export default function AppShell() {
  const navigate = useNavigate();
  const { authUser, demoMode, logout, userRole, highContrastEnabled, setHighContrastEnabled, voiceAlertsEnabled, setVoiceAlertsEnabled } = useAppContext();
  const title = useShellTitle();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    try {
      setBannerDismissed(sessionStorage.getItem('clearpath-demo-banner-dismissed') === 'true');
    } catch {
      setBannerDismissed(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('clearpath-demo-banner-dismissed', 'true');
    } catch {
      // Ignore storage failures.
    }
  };

  const navItem =
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900';
  const navActive =
    'bg-neutral-900 font-semibold text-white shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45)] ring-1 ring-[#DFFF00]/45 hover:bg-neutral-900 hover:text-white';

  return (
    <div className={`flex min-h-[100dvh] min-h-screen w-full ${cp.text} ${cp.bgPage} ${highContrastEnabled ? 'high-contrast' : ''}`}>
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-200 bg-white"
        aria-label="App navigation"
      >
        <div className="border-b border-neutral-200 px-4 py-5">
          <button type="button" onClick={() => navigate('/dashboard')} className="flex w-full items-center gap-2.5 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black shadow-[0_0_20px_-4px_rgba(223,255,0,0.45)] ring-2 ring-[#DFFF00]/70">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
            </span>
            <span>
              <span className="block font-['DM_Serif_Display'] text-lg leading-tight tracking-tight text-neutral-900">ClearPath</span>
              <span className="mt-0.5 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Operations</span>
            </span>
          </button>
        </div>
        <div className="mx-3 mt-3 rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] px-4 py-4 text-left">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Demo quality</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Real backend, AI-backed reasoning, multilingual alerts, and operator approvals in one judging flow.
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink to="/dashboard" end className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            <LayoutGrid className="h-5 w-5 shrink-0 text-current" strokeWidth={1.75} aria-hidden />
            Dashboard
          </NavLink>
          <NavLink to="/add-shipment" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            <Plus className="h-5 w-5 shrink-0 text-current" strokeWidth={1.75} aria-hidden />
            New shipment
          </NavLink>
        </nav>
        <div className="border-t border-neutral-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 transition-all duration-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-64">
        {demoMode && !bannerDismissed ? (
          <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-100 px-6 py-2 text-xs text-amber-950">
            <span>Demo mode — connect API keys to enable live Google Maps, Gemini, and weather signals</span>
            <button type="button" onClick={dismissBanner} className="inline-flex items-center rounded-full border border-amber-300 p-1 text-amber-900 transition hover:bg-amber-200" aria-label="Dismiss demo mode banner">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : null}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white/65 px-6 shadow-[0_10px_36px_-22px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <h1 className="font-['DM_Serif_Display'] text-left text-xl font-normal tracking-tight text-neutral-900">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHighContrastEnabled(!highContrastEnabled)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-900 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.45)] backdrop-blur-md"
              aria-pressed={highContrastEnabled}
              aria-label={highContrastEnabled ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            >
              <Contrast className="h-3.5 w-3.5" aria-hidden />
              High Contrast
            </button>
            <button
              type="button"
              onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-900 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.45)] backdrop-blur-md"
              aria-pressed={voiceAlertsEnabled}
              aria-label={voiceAlertsEnabled ? 'Disable voice alerts' : 'Enable voice alerts'}
            >
              {voiceAlertsEnabled ? <Volume2 className="h-3.5 w-3.5" aria-hidden /> : <VolumeX className="h-3.5 w-3.5" aria-hidden />}
              Voice
            </button>
            <span className="rounded-full border border-[#DFFF00]/45 bg-white/70 px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-900 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.45)] backdrop-blur-md">
              {authUser ? `${authUser.role} account` : userRole === 'company' ? 'Company' : 'Supplier'}
            </span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden bg-neutral-100">
          <div className={`${cp.container} py-8 pb-12`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
