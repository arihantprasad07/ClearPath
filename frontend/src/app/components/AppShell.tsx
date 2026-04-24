import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Settings,
  ShieldAlert,
  SunMoon,
  Truck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useAppContext } from '../context/AppContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { BrandMark } from "./BrandMark";

const sidebarLinks = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { key: "shipments", label: "Shipments", icon: Truck, to: "/dashboard#shipments" },
  { key: "alerts", label: "Risk Alerts", icon: ShieldAlert, to: "/dashboard#alerts" },
  { key: "routes", label: "Routes", icon: Route, to: "/dashboard#map" },
  { key: "analytics", label: "Analytics", icon: BarChart3, to: "/dashboard#timeline" },
  { key: "settings", label: "Settings", icon: Settings, to: "/dashboard#settings" },
] as const;

function roleBadge(stakeholderRole: "shipper" | "transporter" | "receiver" | null) {
  if (stakeholderRole === "transporter") {
    return "border-orange-400/25 bg-orange-400/10 text-orange-200";
  }
  if (stakeholderRole === "receiver") {
    return "border-sky-400/25 bg-sky-400/10 text-sky-200";
  }
  return "border-[#AAFF45]/25 bg-[#AAFF45]/10 text-[#D9FF9B]";
}

function roleBadgeLabel(stakeholderRole: "shipper" | "transporter" | "receiver" | null) {
  if (stakeholderRole === "transporter") return "TRK";
  if (stakeholderRole === "receiver") return "RCV";
  return "SHP";
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    authUser,
    logout,
    shipments,
    stakeholderRole,
    highContrastEnabled,
    setHighContrastEnabled,
    voiceAlertsEnabled,
    setVoiceAlertsEnabled,
  } = useAppContext();
  const { pathname, hash } = location;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const demoMode = useMemo(() => shipments.some((shipment) => shipment.backend.usedFallbackData), [shipments]);
  const visibleSidebarLinks = useMemo(() => {
    if (stakeholderRole === "transporter") {
      return sidebarLinks.filter((link) => ["dashboard", "routes", "analytics", "settings"].includes(link.key));
    }
    if (stakeholderRole === "receiver") {
      return sidebarLinks.filter((link) => ["dashboard", "analytics", "settings"].includes(link.key));
    }
    return sidebarLinks;
  }, [stakeholderRole]);

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

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, hash]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('clearpath-demo-banner-dismissed', 'true');
    } catch {
      // Ignore storage failures.
    }
  };

  return (
    <div className={`relative min-h-[100dvh] bg-[#0A0A0A] text-white ${highContrastEnabled ? 'high-contrast' : ''}`}>
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden dark-grain" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(170,255,69,0.1),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(170,255,69,0.06),transparent_18%),linear-gradient(180deg,#090909_0%,#050505_100%)]" />
      </div>

      {demoMode && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 bg-[#AAFF45] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-black">
          <span>Demo mode active - add your Gemini API key to enable live AI route reasoning on Firebase Hosting</span>
          <button
            type="button"
            onClick={dismissBanner}
            className="inline-flex items-center p-1 transition hover:opacity-70"
            aria-label="Dismiss demo mode banner"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      <div className="flex min-h-[100dvh]">
        <aside className="hidden w-[88px] shrink-0 border-r border-white/8 bg-[#0D0D0D]/95 backdrop-blur-xl lg:flex lg:flex-col lg:items-center lg:justify-between lg:px-3 lg:py-5">
          <div className="flex flex-col items-center gap-6">
            <button type="button" onClick={() => navigate("/dashboard")} className="flex items-center justify-center">
              <BrandMark compact dark />
            </button>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${roleBadge(stakeholderRole)}`}>
              {roleBadgeLabel(stakeholderRole)}
            </span>

            <TooltipProvider>
              <nav className="flex flex-col gap-3">
                {visibleSidebarLinks.map(({ key, label, icon: Icon, to }) => {
                  const active =
                    pathname === "/dashboard" &&
                    ((key === "dashboard" && !hash) ||
                      (key === "shipments" && hash === "#shipments") ||
                      (key === "alerts" && hash === "#alerts") ||
                      (key === "routes" && hash === "#map") ||
                      (key === "analytics" && hash === "#timeline") ||
                      (key === "settings" && hash === "#settings"));

                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <Link
                          to={to}
                          className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 ${
                            active
                              ? "border-[#AAFF45]/40 bg-[#AAFF45]/12 text-[#AAFF45] shadow-[inset_3px_0_0_0_#AAFF45]"
                              : "border-white/8 bg-[#141414] text-white/55 hover:border-[#AAFF45]/30 hover:text-white"
                          }`}
                          aria-label={label}
                        >
                          <span className={`absolute left-0 top-2 h-8 w-[3px] rounded-full ${active ? "bg-[#AAFF45]" : "bg-transparent"}`} />
                          <Icon className="h-4.5 w-4.5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </nav>
            </TooltipProvider>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setHighContrastEnabled(!highContrastEnabled)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/65 transition hover:border-[#AAFF45]/30 hover:text-white ${highContrastEnabled ? "ring-2 ring-[#AAFF45]/55" : ""}`}
              aria-pressed={highContrastEnabled}
              aria-label={highContrastEnabled ? "Disable high contrast mode" : "Enable high contrast mode"}
            >
              <SunMoon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/65 transition hover:border-[#AAFF45]/30 hover:text-white"
              aria-pressed={voiceAlertsEnabled}
              aria-label={voiceAlertsEnabled ? "Disable voice alerts" : "Enable voice alerts"}
            >
              {voiceAlertsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-sm font-semibold text-white">
              {(authUser?.username || "C").slice(0, 1).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/65 transition hover:border-red-400/35 hover:text-red-300"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/8 bg-[#0B0B0B]/88 px-4 py-4 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white"
              aria-label="Open navigation"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <BrandMark compact dark />
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/70"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {mobileSidebarOpen ? (
            <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm lg:hidden">
              <div className="absolute left-0 top-0 h-full w-[280px] border-r border-white/10 bg-[#0D0D0D] p-5">
                <div className="flex items-center justify-between">
                  <BrandMark compact dark />
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${roleBadge(stakeholderRole)}`}>
                    {roleBadgeLabel(stakeholderRole)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white"
                    aria-label="Close navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="mt-8 space-y-3">
                  {visibleSidebarLinks.map(({ key, label, icon: Icon, to }) => (
                    <Link
                      key={key}
                      to={to}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#141414] px-4 py-3 text-sm text-white/75 transition hover:border-[#AAFF45]/35 hover:text-white"
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHighContrastEnabled(!highContrastEnabled)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/70"
                    aria-label="Toggle high contrast"
                  >
                    <SunMoon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/70"
                    aria-label="Toggle voice alerts"
                  >
                    {voiceAlertsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141414] text-white/70"
                    aria-label="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <main id="main-content" className="min-h-0 flex-1 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <motion.div
              key={`${pathname}${hash}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1600px]"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
