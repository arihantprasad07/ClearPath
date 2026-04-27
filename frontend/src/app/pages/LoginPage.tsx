import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "../components/BrandMark";
import { useAppContext } from "../context/AppContext";
import { loginWithFirebaseEmail } from "../lib/firebase";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithFirebaseIdToken, authLoading, authError, authUser, firebaseEnabled, setStakeholderRole } =
    useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firebaseMode] = useState(import.meta.env.VITE_AUTH_MODE === "firebase_primary" && firebaseEnabled);

  useEffect(() => {
    if (authUser && !isSubmitting) navigate("/dashboard");
  }, [authUser, isSubmitting, navigate]);

  useEffect(() => {
    document.title = "Login — ClearPath";
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (firebaseMode) {
        const credential = await loginWithFirebaseEmail(email.trim(), password);
        const idToken = await credential.user.getIdToken();
        await loginWithFirebaseIdToken(idToken, "company");
      } else {
        await login(email.trim(), password, "company");
      }

      setStakeholderRole("shipper");
      toast.success("Signed in successfully", {
        description: "Opening the ClearPath dashboard.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Sign in failed", {
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white text-black">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(223,255,0,0.18),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7f3_48%,#efefe8_100%)]"
        aria-hidden
      />
      <div className="absolute -right-20 top-0 -z-10 h-[32rem] w-[32rem] rounded-full bg-[#DFFF00]/18 blur-[110px]" aria-hidden />
      <div className="absolute -bottom-20 -left-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-black/[0.07] blur-[110px]" aria-hidden />

      <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[0.92fr_minmax(520px,0.88fr)] lg:gap-14">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[2.2rem] border border-black/10 bg-white/88 p-6 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.18)] backdrop-blur sm:p-8 lg:p-9"
          >
            <BrandMark />

            <div className="mt-8 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-700">
                <Sparkles className="h-3.5 w-3.5 text-[#7c8b00]" strokeWidth={2.1} />
                Login to operator workspace
              </div>

              <h1 className="mt-6 max-w-2xl font-['DM_Serif_Display'] text-[2.7rem] leading-[0.98] tracking-tight text-neutral-950 sm:text-5xl">
                Sign in to the ClearPath operator workspace.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg">
                Review disruption risk, confirm route decisions, and keep shipment actions moving from one secure
                workspace.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Prediction window", value: "18-24h" },
                { label: "Route options", value: "3" },
                { label: "Action time", value: "<30s" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-5 shadow-sm">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">{metric.label}</div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{metric.value}</div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:self-center"
          >
            <div className="absolute inset-x-10 top-8 h-40 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
            <div className="relative mx-auto w-full max-w-[36rem] rounded-[2.2rem] border border-black/10 bg-white p-6 shadow-[0_26px_70px_-34px_rgba(0,0,0,0.18)] sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-lg">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Secure access</p>
                  <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950 sm:text-[3.3rem]">
                    Sign in to ClearPath
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-neutral-600">
                    Secure operator access
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/14 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#667300]">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  {firebaseMode ? "Firebase Auth" : "Prototype Auth"}
                </div>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-600">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="login-email"
                      required
                      type={firebaseMode ? "email" : "text"}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      autoComplete={firebaseMode ? "email" : "username"}
                      className="h-14 w-full rounded-2xl border border-black/10 bg-[#f7f7f3] pl-12 pr-4 text-base text-black placeholder:text-neutral-400 transition focus:border-black/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-600">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="login-password"
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-14 w-full rounded-2xl border border-black/10 bg-[#f7f7f3] pl-12 pr-4 text-base text-black placeholder:text-neutral-400 transition focus:border-black/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                    />
                  </div>
                </div>

                {authError ? (
                  <div role="alert" className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {authError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-black bg-[#DFFF00] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#c8e800] hover:shadow-[0_14px_36px_-18px_rgba(223,255,0,0.65)] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting || authLoading ? <span className="submit-spinner" /> : null}
                  {isSubmitting || authLoading ? "Signing in" : "Open Dashboard"}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-2 rounded-[1.4rem] border border-black/10 bg-[linear-gradient(180deg,#f7f7f1_0%,#ffffff_100%)] px-4 py-3 text-sm text-neutral-600">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#667300]" strokeWidth={2} />
                <span>Secure authentication powered by Firebase</span>
              </div>

              <p className="mt-6 text-center text-sm text-neutral-500">
                Need access for the demo?{" "}
                <Link to="/contact" className="font-semibold text-neutral-900 transition hover:text-[#7c8b00]">
                  Contact the ClearPath team
                </Link>
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
