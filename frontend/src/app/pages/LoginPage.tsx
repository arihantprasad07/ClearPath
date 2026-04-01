import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { LanguageSelect } from '../components/LanguageSelect';
import { cp } from '../lib/cpUi';
import { loginWithFirebaseEmail, loginWithGooglePopup } from '../lib/firebase';

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
    <div className={`relative flex min-h-[100dvh] w-full max-w-full flex-col items-center justify-center overflow-x-hidden px-4 pb-8 pt-24 sm:px-6 ${cp.bgPage}`}>
      <div className={cp.blobAccent} aria-hidden />
      <div className={cp.blobNeutral} aria-hidden />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${cp.container} max-w-5xl`}>
        <Link to="/" className={`${cp.linkBack} mb-8`}>
          <ArrowLeft size={16} aria-hidden />
          Back to home
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={`${cp.panel} hidden lg:block`}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#DFFF00]/15 blur-3xl" aria-hidden />
            <div className="relative z-10">
              <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-900">
                Live judging demo
              </p>
              <h1 className={`mt-6 font-['DM_Serif_Display'] text-4xl ${cp.text}`}>Enter the operator workflow.</h1>
              <p className={`mt-4 max-w-xl text-base leading-relaxed ${cp.textMuted}`}>
                This login opens the real frontend-backend flow. Judges can create a lane, inspect AI reasoning, preview localized alerts, and approve a reroute inside the working product.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">What this proves</p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                    <li>Real auth session and protected dashboard access.</li>
                    <li>Live shipment creation and refresh through the backend.</li>
                    <li>Explainable AI recommendation plus human approval loop.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] p-5">
                  <div className="flex items-center gap-3 text-neutral-900">
                    <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Demo credentials</span>
                  </div>
                  <p className="mt-3 text-sm text-neutral-700">
                    {firebaseMode ? (
                      'Use your Firebase email login or Google sign-in when Firebase env values are configured.'
                    ) : (
                      <>
                        Use username <strong>admin</strong> and the admin password configured in your backend environment.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={cp.panel}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#DFFF00]/15 blur-3xl" aria-hidden />

            <div className="mb-8 text-center">
              <h1 className={`font-['DM_Serif_Display'] text-3xl ${cp.text}`}>Welcome back</h1>
              <p className={`mt-2 text-sm font-light ${cp.textMuted}`}>
                Sign in to your {role === 'company' ? 'company' : 'supplier'} workspace using the live {firebaseMode ? 'Firebase-authenticated' : 'backend'} session.
              </p>
            </div>

            {firebaseEnabled ? (
              <div className="mb-6 rounded-2xl border border-black/10 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Auth mode</p>
                    <p className="mt-1 text-sm text-neutral-700">{firebaseMode ? 'Firebase primary' : 'Backend password fallback'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFirebaseMode((current) => !current)}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-800 transition hover:border-black"
                  >
                    Switch
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mb-6">
              <label htmlFor="login-language" className={cp.label}>Dashboard language</label>
              <LanguageSelect variant="inline" id="login-language" className="w-full" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-username" className={cp.label}>Username</label>
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
                    className={cp.input}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className={cp.label}>Password</label>
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
                    className={cp.input}
                  />
                </div>
              </div>

              {authError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div> : null}

              <button
                type="submit"
                disabled={isSubmitting || authLoading}
                className={`${cp.btnPrimaryBlock} shadow-[0_3px_0_0_rgba(0,0,0,1)] disabled:cursor-wait disabled:opacity-70`}
              >
                {isSubmitting || authLoading ? 'Signing in...' : firebaseMode ? 'Sign in with Firebase' : 'Sign in'}
              </button>
            </form>

            {firebaseMode ? (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || authLoading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-800 transition hover:border-black hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-70"
              >
                Continue with Google
              </button>
            ) : null}

            <p className={`mt-8 text-center text-xs ${cp.textSubtle}`}>
              Need access for your team?{' '}
              <Link to="/contact" className={`font-medium ${cp.text} underline-offset-4 hover:underline`}>
                Contact sales
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
