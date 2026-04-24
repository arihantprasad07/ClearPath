import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { loginWithFirebaseEmail, loginWithGooglePopup } from "../lib/firebase";
import { BrandMark } from "../components/BrandMark";

type RoleTab = "shipper" | "transporter" | "receiver";

const roleTabs: RoleTab[] = ["shipper", "transporter", "receiver"];

function authRoleForTab(tab: RoleTab) {
  return tab === "transporter" ? "supplier" : "company";
}

function statLabel(tab: RoleTab) {
  return tab === "transporter"
    ? "Transporter workspace"
    : tab === "receiver"
      ? "Receiver command view"
      : "Shipper workspace";
}

function roleAwareTagline(tab: RoleTab) {
  if (tab === "transporter") {
    return "Get live route instructions, disruption alerts, and updated delivery paths - directly on your phone.";
  }
  if (tab === "receiver") {
    return "Track your incoming deliveries in real time. Know before delays happen, in your language.";
  }
  return "ClearPath gives Indian supply-chain teams a dark-room control surface for monitoring lanes, surfacing risk early, and approving the next move with confidence.";
}

function roleAwareStats(tab: RoleTab) {
  if (tab === "transporter") {
    return [
      "Live route updates",
      "Instant reroute notifications",
      "22 Indian languages",
    ];
  }
  if (tab === "receiver") {
    return [
      "Real-time delivery tracking",
      "Proactive delay alerts",
      "ETA updates in your language",
    ];
  }
  return [
    "63M SMBs protected",
    "18-24hr early warning",
    "30-second rerouting",
  ];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithFirebaseIdToken, authLoading, authError, authUser, firebaseEnabled, setStakeholderRole } = useAppContext();
  const initialTab = location.state?.role === "supplier" ? "transporter" : "shipper";
  const [selectedRole, setSelectedRole] = useState<RoleTab>(initialTab);
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firebaseMode, setFirebaseMode] = useState(import.meta.env.VITE_AUTH_MODE === "firebase_primary" && firebaseEnabled);

  const authRole = useMemo(() => authRoleForTab(selectedRole), [selectedRole]);

  useEffect(() => {
    if (authUser && !isSubmitting) navigate("/dashboard");
  }, [authUser, isSubmitting, navigate]);

  useEffect(() => {
    document.title = "Sign in - ClearPath";
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let user;
      if (firebaseMode) {
        const credential = await loginWithFirebaseEmail(email.trim(), password);
        const idToken = await credential.user.getIdToken();
        user = await loginWithFirebaseIdToken(idToken, authRole);
      } else {
        user = await login(email.trim(), password, authRole);
      }
      setStakeholderRole(selectedRole);

      toast.success("Signed in successfully", {
        description: `Opening the ${statLabel(selectedRole).toLowerCase()}.`,
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

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);

    try {
      const credential = await loginWithGooglePopup();
      const idToken = await credential.user.getIdToken();
      const user = await loginWithFirebaseIdToken(idToken, authRole);
      setStakeholderRole(selectedRole);
      toast.success("Google sign-in complete", {
        description: "Your ClearPath workspace is ready.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google sign-in failed", {
        description: error instanceof Error ? error.message : "We could not complete Google authentication.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0A0A0A] text-white">
      <div className="absolute inset-0 dark-grain" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(170,255,69,0.16),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(170,255,69,0.08),transparent_16%),linear-gradient(180deg,#090909_0%,#050505_100%)]" aria-hidden />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-[#AAFF45]/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="green-glow-hover relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.94),rgba(9,9,9,0.98))] p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.72)] lg:p-10"
          >
            <div className="absolute -left-12 top-16 h-48 w-48 rounded-full bg-[#AAFF45]/10 blur-3xl" aria-hidden />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#AAFF45]/8 blur-3xl" aria-hidden />

            <BrandMark dark />

            <div className="mt-12 max-w-lg">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#AAFF45]">Clear visibility before chaos</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Predict Disruptions Before They Happen
              </h1>
              <p className="mt-5 max-w-md text-base leading-8 text-white/68">
                {roleAwareTagline(selectedRole)}
              </p>
            </div>

            <motion.div
              key={selectedRole}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-10 space-y-4"
            >
              {roleAwareStats(selectedRole).map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#AAFF45]/35 bg-[#AAFF45]/10 text-sm font-semibold text-[#AAFF45]">
                    0{index + 1}
                  </span>
                  <span className="text-sm font-medium text-white/84">{item}</span>
                </div>
              ))}
            </motion.div>

            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#AAFF45]/22 bg-[#AAFF45]/8 px-4 py-2 text-sm text-white/82">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AAFF45]/55" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#AAFF45] green-pulse" />
              </span>
              Live AI monitoring active
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center"
          >
            <div className="w-full rounded-[32px] border border-white/10 bg-[#1A1A1A] p-6 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.82)] sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Secure access</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sign in to ClearPath</h2>
                </div>

                {firebaseEnabled ? (
                  <button
                    type="button"
                    onClick={() => setFirebaseMode((current) => !current)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-[#AAFF45]/30 hover:text-white"
                  >
                    {firebaseMode ? "Firebase mode" : "Prototype mode"}
                  </button>
                ) : null}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-2 rounded-full border border-white/10 bg-[#111111] p-1 sm:grid-cols-3">
                {roleTabs.map((tab) => {
                  const active = selectedRole === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedRole(tab)}
                      className={`rounded-full px-4 py-3 text-sm font-medium capitalize transition ${
                        active
                          ? "bg-[#AAFF45] text-black shadow-[0_14px_30px_-18px_rgba(170,255,69,0.75)]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-[#121212] px-5 py-4 text-sm text-white/68">
                {statLabel(selectedRole)} with {firebaseMode ? "Firebase-authenticated" : "local prototype"} access.
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-white/48">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                    <input
                      id="login-email"
                      required
                      type={firebaseMode ? "email" : "text"}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={firebaseMode ? "name@company.com" : "admin"}
                      autoComplete={firebaseMode ? "email" : "username"}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#111111] pl-12 pr-4 text-base text-white placeholder:text-white/28 transition focus:border-[#AAFF45] focus:outline-none focus:ring-2 focus:ring-[#AAFF45]/25"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-white/48">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                    <input
                      id="login-password"
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={firebaseMode ? "Enter your password" : "Enter admin password"}
                      autoComplete="current-password"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#111111] pl-12 pr-4 text-base text-white placeholder:text-white/28 transition focus:border-[#AAFF45] focus:outline-none focus:ring-2 focus:ring-[#AAFF45]/25"
                    />
                  </div>
                </div>

                {authError ? (
                  <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {authError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#AAFF45] px-5 text-base font-semibold text-black transition hover:bg-[#95f12f] hover:shadow-[0_20px_36px_-20px_rgba(170,255,69,0.8)] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting || authLoading ? <span className="submit-spinner" /> : null}
                  {isSubmitting || authLoading ? "Signing In" : "Sign In"}
                </button>
              </form>

              {firebaseMode ? (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || authLoading}
                  className="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/14 bg-transparent px-5 text-base font-medium text-white transition hover:border-[#AAFF45]/35 hover:bg-white/[0.03] disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] font-semibold text-black">G</span>
                  Continue with Google
                </button>
              ) : null}

              <p className="mt-6 text-center text-sm text-white/52">
                Don&apos;t have an account?{" "}
                <Link to="/contact" className="font-medium text-[#AAFF45] hover:text-white">
                  Register
                </Link>
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
