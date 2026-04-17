import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { LogOut, SunMoon, Volume2, VolumeX, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cp } from '../lib/cpUi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
  const { authUser, logout, shipments, userRole, highContrastEnabled, setHighContrastEnabled, voiceAlertsEnabled, setVoiceAlertsEnabled } = useAppContext();
  const title = useShellTitle();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const demoMode = useMemo(() => shipments.some((shipment) => shipment.backend.usedFallbackData), [shipments]);

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

  return (
    <div className={`relative z-0 flex min-h-[100dvh] w-full flex-col ${cp.bgPage} ${cp.text} ${highContrastEnabled ? 'high-contrast' : ''}`}>
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)]" style={{ backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 600px 400px at 100% 0%, rgba(223,255,0,0.07), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 500px 400px at 0% 100%, rgba(0,0,0,0.04), transparent 70%)' }} />
      </div>

      {demoMode && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 bg-[#DFFF00] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-black">
          <span>Demo mode active — add API keys to Render to enable live Google Maps, Gemini, and weather signals</span>
          <button type="button" onClick={dismissBanner} className="inline-flex items-center p-1 transition hover:opacity-70" aria-label="Dismiss demo mode banner">
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      <nav className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b-[0.5px] border-black/[0.08] border-t-2 border-t-[#DFFF00] bg-white/80 px-6 backdrop-blur-md">
        <div className="flex h-full items-center gap-8">
          <button type="button" onClick={() => navigate('/dashboard')} className="group flex items-center gap-2.5 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(223,255,0,0.6)]" aria-label={`Open ${title}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black shadow-[0_0_20px_-4px_rgba(223,255,0,0.45)] ring-2 ring-[#DFFF00]/70">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
            </span>
            <span className="font-['DM_Serif_Display'] text-xl leading-tight tracking-tight text-neutral-900">ClearPath</span>
          </button>

          <div className="flex h-full items-center gap-1">
            <NavLink to="/dashboard" end className={({ isActive }) => `flex h-full items-center border-b-2 px-3 text-sm font-medium transition-all duration-200 ${isActive ? 'border-[#DFFF00] text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>
              Dashboard
            </NavLink>
            <NavLink to="/add-shipment" className={({ isActive }) => `flex h-full items-center border-b-2 px-3 text-sm font-medium transition-all duration-200 ${isActive ? 'border-[#DFFF00] text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>
              New shipment
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setHighContrastEnabled(!highContrastEnabled)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-600 transition-all hover:text-black ${highContrastEnabled ? 'ring-2 ring-black' : ''}`}
                  aria-pressed={highContrastEnabled}
                  aria-label={highContrastEnabled ? 'Disable high contrast mode' : 'Enable high contrast mode'}
                >
                  <SunMoon className="h-4 w-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle high contrast</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button
            type="button"
            onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-600 transition-all hover:text-black"
            aria-pressed={voiceAlertsEnabled}
            aria-label={voiceAlertsEnabled ? 'Disable voice alerts' : 'Enable voice alerts'}
          >
            {voiceAlertsEnabled ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
          </button>

          <span className="rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-900 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.45)] backdrop-blur-md">
            {authUser ? `${authUser.role} account` : userRole === 'company' ? 'Company' : 'Supplier'}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </nav>

      <main id="main-content" className="min-h-0 flex-1 overflow-x-hidden">
        <div className={`${cp.container} py-8 pb-12`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
