import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Activity,
  Anchor,
  ArrowUpRight,
  BarChart2,
  Brain,
  Building,
  Car,
  CheckCircle2,
  Cloud,
  Database,
  Globe2,
  LineChart,
  Route,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Features, Roles } from '../components/RolesAndFeatures';

function useInViewCountUp(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCount(target);
      hasAnimated.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number;
          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const t = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.round(target * easeOut(t)));
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function HeroMetricCard({ label, value, isAnimated, target, duration }: { label: string; value?: string; isAnimated?: boolean; target?: number; duration?: number }) {
  const { count, ref } = useInViewCountUp(target ?? 0, duration ?? 1200);
  return (
    <div ref={ref} className="rounded-2xl border border-white/15 border-b-2 border-b-[#DFFF00]/50 bg-white/5 px-4 py-4 transition-all duration-200 hover:border-[#DFFF00]/60 hover:bg-white/[0.08]">
      <div className="font-['DM_Serif_Display'] text-3xl text-[#DFFF00]">{isAnimated ? count : value}</div>
      <div className="mt-2 text-neutral-400">{label}</div>
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <section id="product" className="relative overflow-hidden bg-black pt-24 text-white sm:pt-28 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_60%_at_50%_-18%,rgba(223,255,0,0.22),transparent_58%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-45" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-14 px-4 pb-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/10 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DFFF00]">
            Solution Challenge 2026 India fit
          </p>
          <h1 className="font-['DM_Serif_Display'] text-[2.45rem] leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.7rem]">
            Predict supply-chain disruption
            <span className="block text-[#DFFF00]">before it becomes a loss.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base font-light leading-relaxed text-neutral-300 sm:text-lg">
            ClearPath helps Indian SMB operators act on weather, traffic, corridor, and history signals with AI-backed rerouting, multilingual alerts, and a human approval loop designed for real logistics pressure.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/login', { state: { role: 'company' } })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#DFFF00] px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all duration-200 hover:bg-[#c8e800]"
            >
              Open shipper demo
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { role: 'supplier' } })}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-all duration-200 hover:border-[#DFFF00]/45 hover:bg-[#DFFF00]/10 hover:text-[#DFFF00]"
            >
              Open transporter demo
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-300 sm:grid-cols-3">
            <HeroMetricCard label="Decision time target" value="<30s" />
            <HeroMetricCard label="Indian languages supported" isAnimated target={22} duration={1200} />
            <HeroMetricCard label="Operator stakeholder roles" isAnimated target={3} duration={800} />
          </div>
        </div>

        <div className="w-full max-w-xl flex-1">
          <div className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-5">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-red-200/20 bg-red-500/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-200">Live risk lane</p>
                    <h2 className="mt-2 font-['DM_Serif_Display'] text-2xl text-white">Mumbai to Delhi</h2>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-200">
                      AI detected weather pressure, corridor fragility, and traffic spillover. Recommended action: switch to Southern Relief now.
                    </p>
                  </div>
                  <span className="rounded-full border border-red-300/30 bg-red-400/15 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-red-100">
                    Critical
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
                  <div className="flex items-center gap-3 text-[#DFFF00]">
                    <Brain className="h-5 w-5" strokeWidth={1.7} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">AI reasoning</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-200">
                    Gemini-style explanation turns route analytics into operator-ready action instead of a passive dashboard summary.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
                  <div className="flex items-center gap-3 text-[#DFFF00]">
                    <Globe2 className="h-5 w-5" strokeWidth={1.7} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Field delivery</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-200">
                    WhatsApp-style, multilingual alerts reduce friction for operators and transporters across Indian logistics networks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CriteriaFit() {
  const cards = [
    {
      title: 'Technical Merit',
      subtitle: 'Real full-stack workflow',
      desc: 'FastAPI backend, React dashboard, live risk engine, Gemini-powered explanations, Google Maps route scoring, and multilingual alert dispatch in 10 Indian languages.',
      icon: <Activity className="h-5 w-5" strokeWidth={1.7} />,
    },
    {
      title: 'User Experience',
      subtitle: 'Decision-first UX',
      desc: 'The interface prioritizes action, readability, and role-specific flow so operators can make a decision in under 30 seconds.',
      icon: <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} />,
    },
    {
      title: 'Alignment With Cause',
      subtitle: 'Built for Indian SMBs',
      desc: 'The problem, language support, operator workflow, and logistics framing are tailored to real disruption pain across Indian supply chains.',
      icon: <Truck className="h-5 w-5" strokeWidth={1.7} />,
    },
    {
      title: 'Innovation and Creativity',
      subtitle: 'AI plus human approval',
      desc: 'The product combines predictive risk detection, multilingual delivery, and accountable operator approvals in one workflow.',
      icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />,
    },
  ];

  return (
    <section id="criteria" className="relative border-y border-black/10 bg-neutral-100 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900">
            Built for real logistics pressure
          </p>
          <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-900 sm:text-5xl">Why ClearPath works.</h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            ClearPath detects disruptions before they cascade, recommends alternate routes in real time, and sends multilingual alerts to transporters — all in one operator workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3 text-neutral-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00]/12 text-neutral-900">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">{card.subtitle}</p>
                  <h3 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">{card.title}</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-neutral-600 sm:text-base">{card.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StackSection() {
  const stack = [
    { title: 'Google Routes plus Geocoding', desc: 'Builds alternate lanes and resolves operator-entered origin and destination locations.', icon: <Route className="h-5 w-5" strokeWidth={1.7} /> },
    { title: 'Gemini-ready reasoning', desc: 'Turns risk signals into plain-language operator guidance with fallback-safe summaries.', icon: <Brain className="h-5 w-5" strokeWidth={1.7} /> },
    { title: 'Firebase and BigQuery path', desc: 'Supports production-style auth, persistence, and audit export architecture when configured.', icon: <Database className="h-5 w-5" strokeWidth={1.7} /> },
    { title: 'Google Cloud-ready orchestration', desc: 'The workflow is structured to run with Vertex-style orchestration and scalable backend services.', icon: <Cloud className="h-5 w-5" strokeWidth={1.7} /> },
  ];

  return (
    <section id="stack" className="relative overflow-hidden bg-black py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:4.25rem_4.25rem] opacity-40" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#DFFF00]">
              Powered by Google technologies
            </p>
            <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight sm:text-5xl">A stronger technical story.</h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300 sm:text-lg">
              The app is now positioned to clearly show how Google technologies contribute to product value, not just to the implementation checklist.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm leading-relaxed text-neutral-200">
            Built for Indian SMB operators who need fast, clear decisions — not enterprise logistics complexity.
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {stack.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/40 bg-[#DFFF00]/10 text-[#DFFF00]">
                {item.icon}
              </div>
              <h3 className="mt-5 font-['DM_Serif_Display'] text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductOutcomes() {
  const outcomes = [
    { title: 'Faster operator decisions', copy: 'The product is optimized to reduce decision latency from alert to approval through one clear recommended action.' },
    { title: 'Lower communication friction', copy: 'Localized disruption copy supports field teams and transporters who do not want to learn a new complex logistics tool.' },
    { title: 'Prototype with scale direction', copy: 'Fallback-safe local operation works today, while Firebase, BigQuery, push delivery, and cloud integrations provide a credible growth path.' },
  ];

  return (
    <section className="border-y border-black/10 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900">
              Measurable product outcomes
            </p>
            <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-900 sm:text-5xl">Built to create visible impact.</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
              The experience now emphasizes practical operator outcomes, not just predictive analytics. That makes the project easier to evaluate on relevance, usability, and real-world value.
            </p>
          </div>
          <div className="rounded-[2rem] border border-black/10 bg-neutral-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-neutral-900">
              <LineChart className="h-5 w-5" strokeWidth={1.7} />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Outcome focus</span>
            </div>
            <ul className="mt-5 space-y-4">
              {outcomes.map((outcome) => (
                <li key={outcome.title} className="rounded-2xl border border-white bg-white p-5">
                  <h3 className="font-semibold text-neutral-900">{outcome.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{outcome.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FiveSignals() {
  const signals = [
    { name: 'IMD Weather', icon: <Cloud className="h-5 w-5" strokeWidth={1.7} />, desc: 'Real-time rain, wind, and visibility from OpenWeatherMap', delay: '0s' },
    { name: 'Maps Traffic', icon: <Car className="h-5 w-5" strokeWidth={1.7} />, desc: 'Live corridor congestion via Google Maps Routes API', delay: '0.5s' },
    { name: 'Port Feeds', icon: <Anchor className="h-5 w-5" strokeWidth={1.7} />, desc: 'Terminal wait-time signals for major Indian freight ports', delay: '1s' },
    { name: 'NHAI Roads', icon: <Route className="h-5 w-5" strokeWidth={1.7} />, desc: 'Highway blockage and construction status from NHAI feeds', delay: '1.5s' },
    { name: 'History', icon: <BarChart2 className="h-5 w-5" strokeWidth={1.7} />, desc: 'Pattern matching from resolved disruptions via BigQuery', delay: '2s' },
  ];

  return (
    <section className="border-y border-black/10 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900">
            Signal architecture
          </p>
          <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-900 sm:text-5xl">Five signals. One decision.</h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            ClearPath fuses weather, traffic, port congestion, highway status, and historical patterns into a single risk score — 18 to 24 hours before a shipment is affected.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {signals.map((signal) => (
            <div key={signal.name} className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-black p-6 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/40 bg-[#DFFF00]/10 text-[#DFFF00]">
                {signal.icon}
              </div>
              <h3 className="font-['DM_Serif_Display'] text-xl">{signal.name}</h3>
              <p className="flex-1 text-sm leading-relaxed text-neutral-300">{signal.desc}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#DFFF00]"
                  style={{ animation: `pulse-bar 3s ease-in-out infinite ${signal.delay}` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriyaStory() {
  const steps = [
    'ClearPath detects rainfall on NH-44 — 85% probability of 6+ hour delay.',
    'Surat terminal congestion spike detected — avg wait +4 hours.',
    "Priya receives a Gujarati WhatsApp alert: 'Your shipment may be delayed. Tap to approve rerouting.'",
    'One tap. Transporter gets new route. Zero phone calls. Total time: 30 seconds.',
  ];

  return (
    <section className="overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="bg-black px-6 py-16 text-white sm:px-10 sm:py-24 lg:px-16">
          <h2 className="font-['DM_Serif_Display'] text-3xl text-white sm:text-4xl">Priya's shipment disappeared.</h2>
          <p className="mt-6 text-sm leading-relaxed text-neutral-300">
            Priya runs a small textile business in Surat. She ordered 500 metres of fabric from a supplier in Coimbatore. It was supposed to arrive in 4 days. On day 6, she calls the transporter — no answer. She calls the supplier — they say it left on time. She has 12 orders pending, customers calling, and zero visibility. She loses 3 customers that week. Nobody warned her. Nobody rerouted. Nobody even knew there was a problem.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { stat: '₹15,000 Cr', label: 'lost annually' },
              { stat: '63M', label: 'SMBs affected' },
              { stat: '6–18 hr', label: 'avg detection delay' },
            ].map((pill) => (
              <span key={pill.stat} className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/40 bg-[#DFFF00]/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-[#DFFF00]">
                <span className="font-semibold">{pill.stat}</span> {pill.label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white px-6 py-16 sm:px-10 sm:py-24 lg:px-16">
          <h2 className="font-['DM_Serif_Display'] text-3xl text-neutral-900 sm:text-4xl">With ClearPath, Priya gets 18 hours.</h2>
          <div className="mt-8 space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 rounded-2xl border border-black/10 bg-neutral-50 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DFFF00] text-xs font-mono font-bold text-black">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-neutral-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-black px-6 py-16 sm:py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(223,255,0,0.06)_0%,transparent_55%)]" aria-hidden />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#DFFF00]/40 bg-[#DFFF00]/10 shadow-[0_0_40px_-8px_rgba(223,255,0,0.35)]">
          <Database className="h-6 w-6 text-[#DFFF00]" strokeWidth={1.5} />
        </div>
        <h2 className="font-['DM_Serif_Display'] text-4xl text-white sm:text-5xl lg:text-6xl">See the complete live workflow.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Open the workspace, sign in, create a lane, inspect AI reasoning, and approve the recommended route like an operator would.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/login"
            state={{ role: 'supplier' }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-neutral-100"
          >
            <Truck className="h-4 w-4" strokeWidth={2} aria-hidden />
            Open transporter journey
          </Link>
          <Link
            to="/login"
            state={{ role: 'company' }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00] px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#c8e800]"
          >
            <Building className="h-4 w-4" strokeWidth={2} aria-hidden />
            Open shipper journey
          </Link>
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
    document.title = 'ClearPath — AI Supply Chain Co-pilot for Indian SMBs';
  }, []);

  return (
    <main id="main-content">
      <Hero />
      <CriteriaFit />
      <StackSection />
      <FiveSignals />
      <Roles />
      <Features />
      <ProductOutcomes />
      <PriyaStory />
      <CTA />
    </main>
  );
}
