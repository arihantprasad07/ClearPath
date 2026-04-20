import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { LanguageSelect } from '../components/LanguageSelect';
import { loginWithFirebaseEmail, loginWithGooglePopup } from '../lib/firebase';

function TinyLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-[9px] font-mono uppercase tracking-[0.22em] ${dark ? 'text-white/60' : 'text-neutral-500'}`}>
      {children}
    </p>
  );
}

function DecoCluster({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <div className="absolute left-0 top-0 h-9 w-9 rounded-full border border-black/10 border-dashed" />
      <div className="absolute left-6 top-6 h-2 w-2 rounded-full bg-[#DFFF00]" />
      <div className="absolute left-9 top-0 text-lg leading-none text-black">*</div>
      <div className="absolute left-10 top-7 h-6 w-6 rotate-45 border border-black/80 bg-black" />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithFirebaseIdToken, authLoading, authError, authUser, firebaseEnabled } = useAppContext();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firebaseMode, setFirebaseMode] = useState(import.meta.env.VITE_AUTH_MODE === 'firebase_primary' && firebaseEnabled);

  const role = location.state?.role === 'supplier' ? 'supplier' : 'company';

  useEffect(() => {
    if (authUser) navigate('/dashboard');
  }, [authUser, navigate]);

  useEffect(() => {
    document.title = 'Sign in - ClearPath';
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (firebaseMode) {
        const credential = await loginWithFirebaseEmail(username.trim(), password);
        const idToken = await credential.user.getIdToken();
        await loginWithFirebaseIdToken(idToken, role);
      } else {
        await login(username.trim(), password, role);
      }
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const credential = await loginWithGooglePopup();
      const idToken = await credential.user.getIdToken();
      await loginWithFirebaseIdToken(idToken, role);
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600 transition-colors hover:text-black">
          <ArrowLeft size={16} aria-hidden />
          Back to home
        </Link>

        <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:items-start">
          <div className="mx-auto w-full max-w-[360px] xl:mx-0">
            <div className="space-y-3">
              <section className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white px-4 pb-4 pt-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)]">
                <DecoCluster className="right-4 top-5 h-12 w-12 opacity-80" />
                <div className="relative z-10">
                  <TinyLabel>Workspace access</TinyLabel>
                  <h1 className="mt-2 text-[25px] font-semibold leading-[1.02] tracking-tight text-neutral-950">
                    Sign in to
                    <br />
                    ClearPath
                  </h1>
                  <p className="mt-3 max-w-[230px] text-[11px] leading-5 text-neutral-500">
                    Enter the same themed operator workflow you saw on the landing page, now tailored to your role and auth mode.
                  </p>
                </div>
              </section>

              <section className="rounded-[18px] border border-[#b6d400] bg-[#DFFF00] p-4">
                <TinyLabel>Role</TinyLabel>
                <p className="mt-3 text-sm font-semibold text-black">{role === 'company' ? 'Company workspace' : 'Transport workspace'}</p>
              </section>

              <section className="rounded-[18px] border border-black/10 bg-white p-4">
                <TinyLabel>Auth mode</TinyLabel>
                <p className="mt-3 text-sm font-semibold text-neutral-950">{firebaseMode ? 'Firebase primary' : 'Backend password fallback'}</p>
              </section>

              <section className="rounded-[18px] border border-black bg-[#181a23] p-4 text-white">
                <TinyLabel dark>What this proves</TinyLabel>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/75">
                  <li>Live disruption detection and route scoring.</li>
                  <li>Role-aware workflows for company and transport teams.</li>
                  <li>Multilingual alerts tied to real decisions.</li>
                </ul>
              </section>

              <section className="rounded-[18px] border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-neutral-700" />
                  <TinyLabel>How to sign in</TinyLabel>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {firebaseMode
                    ? 'Use your Firebase email login or Google sign-in when Firebase env values are configured.'
                    : 'Use username admin and the admin password configured in your backend environment.'}
                </p>
              </section>
            </div>
          </div>

          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-5">
              <div>
                <TinyLabel>Authentication</TinyLabel>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Sign in to your {role === 'company' ? 'shipper' : 'transporter'} workspace using the live {firebaseMode ? 'Firebase-authenticated' : 'backend'} session.
                </p>
              </div>

              {firebaseEnabled ? (
                <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <TinyLabel>Auth mode</TinyLabel>
                      <p className="mt-2 text-sm font-semibold text-neutral-950">{firebaseMode ? 'Firebase primary' : 'Backend password fallback'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFirebaseMode((current) => !current)}
                      className="rounded-full border border-black bg-black px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white"
                    >
                      Switch
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <label htmlFor="login-language" className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">Dashboard language</label>
                <LanguageSelect variant="inline" id="login-language" className="w-full" />
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-username" className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">Username</label>
                  <div className="relative">
                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                    <input
                      id="login-username"
                      required
                      type={firebaseMode ? 'email' : 'text'}
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder={firebaseMode ? 'name@company.com' : 'admin'}
                      autoComplete={firebaseMode ? 'email' : 'username'}
                      className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">Password</label>
                  <div className="relative">
                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                    <input
                      id="login-password"
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={firebaseMode ? 'Enter your password' : 'Enter admin password'}
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                    />
                  </div>
                </div>

                {authError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div> : null}

                <button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-black bg-[#DFFF00] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black transition-all duration-200 hover:bg-[#c8e800] hover:shadow-[0_8px_28px_-6px_rgba(223,255,0,0.45)] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting || authLoading ? 'Signing in...' : firebaseMode ? 'Sign in with Firebase' : 'Sign in'}
                </button>
              </form>

              {firebaseMode ? (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || authLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black bg-[#181a23] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-70"
                >
                  <Sparkles className="h-4 w-4" />
                  Continue with Google
                </button>
              ) : null}

              <p className="text-center text-xs text-neutral-500">
                Need access for your team?{' '}
                <Link to="/contact" className="font-medium text-neutral-950 underline-offset-4 hover:underline">
                  Contact sales
                </Link>
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
