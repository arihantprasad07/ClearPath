import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building,
  ChevronRight,
  Globe2,
  MapPinned,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react';

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

function Tile({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: 'white' | 'lime' | 'dark';
}) {
  const tones = {
    white: 'border-black/10 bg-white text-black',
    lime: 'border-[#b6d400] bg-[#DFFF00] text-black',
    dark: 'border-black bg-[#181a23] text-white',
  } as const;

  return (
    <div className={`rounded-[16px] border p-3 ${tones[tone]}`}>
      <TinyLabel dark={tone === 'dark'}>{title}</TinyLabel>
      <p className={`mt-6 text-lg font-semibold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-black'}`}>{value}</p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  icon,
  tone = 'white',
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone?: 'white' | 'dark';
}) {
  return (
    <div className={`rounded-[22px] border p-5 ${tone === 'dark' ? 'border-black bg-[#181a23] text-white' : 'border-black/10 bg-white text-black'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <TinyLabel dark={tone === 'dark'}>{eyebrow}</TinyLabel>
          <h3 className={`mt-2 text-lg font-semibold ${tone === 'dark' ? 'text-white' : 'text-neutral-950'}`}>{title}</h3>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tone === 'dark' ? 'bg-white/10 text-[#DFFF00]' : 'bg-black/10 text-neutral-900'}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-4 text-sm leading-6 ${tone === 'dark' ? 'text-white/70' : 'text-neutral-600'}`}>{description}</p>
    </div>
  );
}

function LandingHero() {
  const navigate = useNavigate();

  return (
    <section id="product" className="mx-auto w-full max-w-6xl px-4 pb-6 pt-24 sm:px-6 sm:pt-28">
      <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:items-start">
        <div className="mx-auto w-full max-w-[360px] xl:mx-0">
          <div className="space-y-3">
            <section className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white px-4 pb-4 pt-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)]">
              <DecoCluster className="right-4 top-5 h-12 w-12 opacity-80" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="max-w-[200px]">
                  <TinyLabel>Navigating the unknown</TinyLabel>
                  <h1 className="mt-2 text-[25px] font-semibold leading-[1.02] tracking-tight text-neutral-950">
                    Supply-chain
                    <br />
                    intelligence
                  </h1>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <Globe2 className="h-3.5 w-3.5 text-neutral-700" />
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <Sparkles className="h-3.5 w-3.5 text-neutral-700" />
                  </div>
                </div>
              </div>

              <p className="relative z-10 mt-3 max-w-[235px] text-[11px] leading-5 text-neutral-500">
                A mobile-first operating layer for Indian shippers and transport teams to detect risk, reroute fast, and notify the field clearly.
              </p>

              <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { role: 'company' } })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black bg-black px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-white"
                >
                  <Building className="h-3 w-3" />
                  Company demo
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { role: 'supplier' } })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#b6d400] bg-[#DFFF00] px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-black"
                >
                  <Truck className="h-3 w-3" />
                  Transport demo
                </button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Tile title="Decision time" value="<30s" tone="white" />
              <Tile title="Languages" value="10+" tone="lime" />
              <Tile title="Risk watch" value="18-24h" tone="lime" />
              <Tile title="AI guided" value="Human loop" tone="dark" />
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-black bg-[#181a23] p-3 text-white">
                <TinyLabel dark>What it does</TinyLabel>
                <p className="mt-4 text-[12px] font-medium leading-5 text-white">
                  Predict disruption before it becomes a customer loss.
                </p>
              </div>
              <div className="rounded-[16px] border border-[#b6d400] bg-[#DFFF00] p-3 text-black">
                <TinyLabel>Field alert</TinyLabel>
                <p className="mt-4 text-base font-semibold tracking-tight">WhatsApp-ready</p>
                <p className="mt-1 text-[10px] leading-4 text-black/70">Local-language handoff</p>
              </div>
            </section>

            <section className="rounded-[18px] border border-black bg-[#181a23] p-3 text-white">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[12px] bg-white/5 px-2 py-2">
                  <TinyLabel dark>Weather</TinyLabel>
                  <p className="mt-2 text-[11px] font-semibold">Live</p>
                </div>
                <div className="rounded-[12px] bg-white/5 px-2 py-2">
                  <TinyLabel dark>Traffic</TinyLabel>
                  <p className="mt-2 text-[11px] font-semibold">Scored</p>
                </div>
                <div className="rounded-[12px] bg-white/5 px-2 py-2">
                  <TinyLabel dark>Action</TinyLabel>
                  <p className="mt-2 text-[11px] font-semibold">Approved</p>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#b6d400] bg-[#DFFF00] p-3">
              <div className="flex items-center justify-between gap-2">
                <TinyLabel>Alert preview</TinyLabel>
                <Truck className="h-4 w-4 text-black/70" />
              </div>
              <div className="mt-3 rounded-[14px] border border-black/10 bg-white/60 px-3 py-3 text-[12px] leading-5 text-black">
                Heavy rainfall and corridor congestion detected. ClearPath recommends Route 4C to avoid a 6-9 hour delay.
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <TinyLabel>From landing to dashboard</TinyLabel>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">One design system, one operational story.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
                The same card rhythm, lime highlights, dark utility panels, and compact mobile blocks now carry from the first screen into the operator dashboard.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <SectionCard
                  eyebrow="Predict"
                  title="Spot disruption early"
                  description="Blend weather, corridor pressure, and route context into an operator-friendly risk signal."
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                <SectionCard
                  eyebrow="Explain"
                  title="Let AI justify action"
                  description="Translate signal math into plain-language reasoning so the operator can approve with confidence."
                  icon={<Brain className="h-4 w-4" />}
                />
                <SectionCard
                  eyebrow="Deliver"
                  title="Notify the field"
                  description="Push localized transporter alerts with recommended routes instead of creating another support call."
                  icon={<Zap className="h-4 w-4" />}
                  tone="dark"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-black bg-[#181a23] p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <TinyLabel dark>Workflow stack</TinyLabel>
                  <h2 className="mt-1 text-xl font-semibold text-white">Designed like the product UI itself</h2>
                </div>
                <MapPinned className="h-4 w-4 text-[#DFFF00]" />
              </div>
              <div className="space-y-3">
                <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <TinyLabel dark>1. Detect</TinyLabel>
                  <p className="mt-2 text-sm text-white/80">Weather, traffic, and network conditions are converted into a live risk layer.</p>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <TinyLabel dark>2. Decide</TinyLabel>
                  <p className="mt-2 text-sm text-white/80">Alternate routes are scored and paired with a recommendation an operator can approve quickly.</p>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <TinyLabel dark>3. Dispatch</TinyLabel>
                  <p className="mt-2 text-sm text-white/80">A multilingual field alert closes the loop from dashboard insight to real-world execution.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="criteria" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <TinyLabel>Why it scores</TinyLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Built for real Indian logistics pressure.</h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] p-4">
                  <p className="text-sm font-semibold text-neutral-950">Decision-first UX</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">The system tells the operator what to do next instead of making them read a complicated dashboard.</p>
                </div>
                <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] p-4">
                  <p className="text-sm font-semibold text-neutral-950">India-fit delivery</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">Localized alert copy, field-friendly flows, and simple approval paths support real transporter behavior.</p>
                </div>
                <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] p-4">
                  <p className="text-sm font-semibold text-neutral-950">Human-in-the-loop AI</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">AI explains and recommends, while the operator remains accountable for execution.</p>
                </div>
              </div>
            </div>

            <div id="stack" className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <TinyLabel>Google-ready stack</TinyLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Structured for a credible product path.</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SectionCard
                  eyebrow="Routes"
                  title="Alternate lane scoring"
                  description="Route generation and comparison support the operator’s next decision."
                  icon={<Route className="h-4 w-4" />}
                />
                <SectionCard
                  eyebrow="Reasoning"
                  title="AI explanation layer"
                  description="Natural-language summaries make risk outputs understandable under pressure."
                  icon={<Brain className="h-4 w-4" />}
                />
                <SectionCard
                  eyebrow="Trust"
                  title="Approval workflow"
                  description="Human review stays at the center of the final action and alert dispatch."
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
                <SectionCard
                  eyebrow="Field delivery"
                  title="Transport communication"
                  description="Clear handoff from dashboard recommendation to transporter notification."
                  icon={<Truck className="h-4 w-4" />}
                  tone="dark"
                />
              </div>
            </div>
          </section>

          <section id="roles" className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[28px] border border-black bg-[#181a23] p-6 text-white shadow-sm">
              <TinyLabel dark>Role journeys</TinyLabel>
              <h2 className="mt-2 text-2xl font-semibold text-white">Two views, one shared visual logic.</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-[#DFFF00]">
                    <Building className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Company</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/75">
                    Monitor inbound lanes, review AI reasoning, and push route changes before delays become customer-facing.
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-[#DFFF00]">
                    <Truck className="h-4 w-4" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Transport</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/75">
                    Receive clear alerts, understand why a route changed, and act without the usual call chain.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <TinyLabel>Try it live</TinyLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Open the same themed workflow end to end.</h2>
              <p className="mt-4 text-sm leading-6 text-neutral-600">
                Start from the landing screen, enter the sign-in flow, and arrive in the dashboard without the visual language changing underneath you.
              </p>

              <div className="mt-6 grid gap-3">
                <Link
                  to="/login"
                  state={{ role: 'company' }}
                  className="inline-flex items-center justify-between rounded-[18px] border border-black bg-[#DFFF00] px-4 py-4 text-sm font-semibold text-black"
                >
                  Open company journey
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  state={{ role: 'supplier' }}
                  className="inline-flex items-center justify-between rounded-[18px] border border-black bg-[#181a23] px-4 py-4 text-sm font-semibold text-white"
                >
                  Open transporter journey
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-between rounded-[18px] border border-black/10 bg-white px-4 py-4 text-sm font-semibold text-neutral-950"
                >
                  Contact the team
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    const element = document.getElementById(id);
    if (element) {
      requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth' }));
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    document.title = 'ClearPath - AI Supply Chain Co-pilot for Indian SMBs';
  }, []);

  return <LandingHero />;
}
