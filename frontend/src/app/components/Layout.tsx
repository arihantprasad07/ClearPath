import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navbar, Footer } from './LandingChrome';
import { useAppContext } from '../context/AppContext';
import AppShell from './AppShell';
import { cp } from '../lib/cpUi';

export default function Layout() {
  const { pathname } = useLocation();
  const { authUser, highContrastEnabled, userRole } = useAppContext();

  const isAppRoute =
    (!!authUser || !!userRole) &&
    (pathname === '/dashboard' ||
      pathname === '/add-shipment' ||
      /^\/shipment\/[^/]+$/.test(pathname));

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#DFFF00] focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest">Skip to main content</a>
      {isAppRoute ? (
        <AppShell />
      ) : (
        <div
          className={`relative z-0 flex min-h-[100dvh] min-h-screen w-full max-w-full flex-col overflow-x-hidden text-neutral-950 selection:bg-[#DFFF00]/50 selection:text-black ${cp.bgPage} ${highContrastEnabled ? 'high-contrast' : ''}`}
        >
          <div className={`pointer-events-none fixed inset-0 z-[-1] overflow-hidden ${cp.bgPage}`}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.2]" />
          </div>

          <Navbar />

          <main id="main-content" className="min-w-0 max-w-full flex-1">
            <Outlet />
          </main>

          <Footer />
        </div>
      )}
    </>
  );
}
