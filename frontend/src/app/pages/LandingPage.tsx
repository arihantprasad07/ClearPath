import React from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Brain,
  MapPinned,
  MessageSquareText,
  Route,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrafficCone,
  TriangleAlert,
} from "lucide-react";
import { Roles, Features } from "../components/RolesAndFeatures";
import { LanguageSelect } from "../components/LanguageSelect";
import { cp } from "../lib/cpUi";

const metrics = [
  { label: "Prediction window", value: "18-24h" },
  { label: "Route options ranked", value: "3" },
  { label: "Indian languages", value: "22" },
  { label: "Operator action time", value: "<30s" },
] as const;

const decisionSignals = [
  {
    title: "Weather",
    body: "Storm pressure and corridor conditions raise disruption probability before operators see delays.",
    icon: TriangleAlert,
  },
  {
    title: "Traffic",
    body: "Congestion changes route confidence and pushes ETA risk into the decision layer.",
    icon: TrafficCone,
  },
  {
    title: "Routing",
    body: "Google route alternatives are scored for ETA, reliability, and cost tradeoffs.",
    icon: Route,
  },
  {
    title: "AI reasoning",
    body: "Gemini explains why the lane is risky and what to do next in plain language.",
    icon: Brain,
  },
] as const;

const criteriaCards = [
  {
    eyebrow: "Not just tracking",
    title: "Predict before the shipment slips.",
    body: "ClearPath is built to detect disruption before the downstream dashboard turns red, so operators act while there is still time to protect delivery.",
  },
  {
    eyebrow: "Decision first",
    title: "Turn signals into one approval-ready move.",
    body: "The product synthesizes weather, traffic, route, and history inputs into a single route recommendation with a human-in-the-loop approval step.",
  },
  {
    eyebrow: "Built for India",
    title: "Useful in multilingual field operations.",
    body: "Alerts and dashboard language are localized so the system supports real logistics workflows instead of just a polished judging demo.",
  },
] as const;

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white/80 px-4 py-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[#DFFF00]">
            <Route className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-['DM_Serif_Display'] text-xl leading-none text-black">ClearPath</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-600 md:flex">
          <a href="#product" className="transition hover:text-black">Overview</a>
          <a href="#criteria" className="transition hover:text-black">Why It Scores</a>
          <a href="#stack" className="transition hover:text-black">Stack</a>
          <a href="#roles" className="transition hover:text-black">Journey</a>
        </nav>
        <div className="hidden md:block">
          <Link
            to="/login"
            state={{ role: "company" }}
            className="inline-flex items-center justify-center rounded-full border border-black bg-[#DFFF00] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#c8e800]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-white text-black">
      <LandingNav />

      <section className="relative px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:pb-28 lg:pt-36">
        <div className={cp.blobAccent} />
        <div className={cp.blobNeutral} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(223,255,0,0.18),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7f3_48%,#efefe8_100%)]" />

        <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#7c8b00]" strokeWidth={2.1} />
              AI supply chain co-pilot
            </div>

            <h1 className="mt-6 max-w-4xl font-['DM_Serif_Display'] text-5xl leading-[0.94] tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Detect route risk early. Explain it clearly. Approve the next move fast.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              ClearPath predicts disruption 18-24 hours before failure, ranks three route alternatives,
              and gives operators one approval-ready action instead of another passive dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link to="/login" state={{ role: "company" }} className={`${cp.btnPrimary} min-w-[190px] rounded-full px-7 py-3 text-sm`}>
                Open Dashboard
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <a
                href="#product"
                className="inline-flex min-w-[190px] items-center justify-center rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-semibold text-neutral-900 transition hover:border-black hover:bg-neutral-50"
              >
                See Product Story
              </a>
            </div>

            <div className="mt-8 max-w-sm">
              <LanguageSelect variant="hero" id="landing-language" hideHelper={false} />
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.6rem] border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">{metric.label}</div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-black text-white shadow-[0_30px_90px_-36px_rgba(0,0,0,0.4)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(223,255,0,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
              <div className="relative border-b border-white/10 p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#DFFF00]">Live lane monitor</div>
                    <div className="mt-2 font-['DM_Serif_Display'] text-3xl text-white sm:text-4xl">Mumbai to Bengaluru</div>
                  </div>
                  <div className="rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#DFFF00]">
                    risk detected
                  </div>
                </div>
              </div>

              <div className="relative p-6 sm:p-7">
                <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04]">
                  <img src="/hero.png" alt="ClearPath route intelligence preview" className="block h-auto w-full" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">Delay probability</div>
                    <div className="mt-2 text-3xl font-semibold text-white">78%</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">Best alternative</div>
                    <div className="mt-2 text-3xl font-semibold text-white">4C</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">ETA protected</div>
                    <div className="mt-2 text-3xl font-semibold text-white">Yes</div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.6rem] border border-[#DFFF00]/25 bg-[#DFFF00]/10 p-5">
                  <div className="flex items-start gap-3">
                    <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-[#DFFF00]" strokeWidth={1.8} />
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#DFFF00]">AI recommendation</div>
                      <p className="mt-2 text-sm leading-7 text-neutral-100">
                        Weather pressure is stacking on the active route. Switch to Southern Relief Route 4C now to
                        protect delivery reliability and avoid a late-night cascade.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-black/10 bg-black p-7 text-white shadow-[0_22px_60px_-28px_rgba(0,0,0,0.35)] sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-300">
              <TimerReset className="h-3.5 w-3.5 text-[#DFFF00]" strokeWidth={2.1} />
              Core idea
            </div>
            <h2 className="mt-5 font-['DM_Serif_Display'] text-4xl tracking-tight sm:text-5xl">
              The system is built for intervention, not observation.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-neutral-300">
              Instead of simply showing where a shipment is, ClearPath predicts what is about to go wrong, explains the
              reasoning, and routes the operator toward a concrete next action.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {criteriaCards.map((card) => (
              <article key={card.title} className="rounded-[1.8rem] border border-black/10 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">{card.eyebrow}</div>
                <h3 className="mt-4 font-['DM_Serif_Display'] text-2xl leading-tight text-neutral-950">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-600">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="criteria" className="px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-black/10 bg-[linear-gradient(180deg,#f7f7f1_0%,#ffffff_100%)] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Why it scores</div>
              <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950 sm:text-5xl">
                A decision surface shaped by the signals that actually break deliveries.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
              The homepage now expresses the same story the product tells inside the dashboard: signal awareness, AI
              explanation, route alternatives, and fast human approval.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {decisionSignals.map(({ title, body, icon: Icon }) => (
              <article key={title} className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#DFFF00]/45 bg-[#DFFF00]/18 text-black">
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stack" className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-600">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7c8b00]" strokeWidth={2} />
              Solution architecture
            </div>
            <h2 className="mt-5 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950 sm:text-5xl">
              Signal stack in. Clear action out.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-neutral-600">
              Routes, weather, traffic, road status, history, and multilingual delivery all feed the same product
              promise: show the operator what to do next with enough confidence to act.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-[1.4rem] border border-black/10 bg-neutral-50 p-4 text-sm text-neutral-700">
                Signal ingestion: maps, corridor conditions, traffic, weather, and historical patterns.
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-neutral-50 p-4 text-sm text-neutral-700">
                Decision engine: disruption scoring, route ranking, Gemini explanation, and approval recommendation.
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-neutral-50 p-4 text-sm text-neutral-700">
                Delivery layer: dashboard actions, WhatsApp-style clarity, push fallback, and audit-ready outcomes.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-black p-7 text-white shadow-[0_22px_60px_-28px_rgba(0,0,0,0.35)] sm:p-9">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <MapPinned className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.8} />
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">Maps + routes</div>
                <p className="mt-3 text-sm leading-7 text-neutral-200">Geocoding and alternative-route analysis set the base for ETA and confidence scoring.</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <Brain className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.8} />
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">Gemini reasoning</div>
                <p className="mt-3 text-sm leading-7 text-neutral-200">Operators see an explanation they can validate quickly, not an opaque risk score.</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <MessageSquareText className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.8} />
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">Alert delivery</div>
                <p className="mt-3 text-sm leading-7 text-neutral-200">The same recommendation can travel through the dashboard, notifications, and localized field messaging.</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <ShieldCheck className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.8} />
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">Human approval</div>
                <p className="mt-3 text-sm leading-7 text-neutral-200">AI recommends. The operator still owns the final reroute decision and the audit trail.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Roles />
      <Features />

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-black bg-[#DFFF00] p-8 text-black shadow-[0_22px_70px_-34px_rgba(223,255,0,0.65)] sm:p-10 lg:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/70">Ready to demo</div>
              <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                Open the real product and review the decision flow.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-black/75">
                The landing page now tells the same story as the dashboard: prediction, explanation, alternatives, and
                rapid human action.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                state={{ role: "company" }}
                className="inline-flex items-center justify-center rounded-full border border-black bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
              >
                Company Dashboard
              </Link>
              <Link
                to="/login"
                state={{ role: "supplier" }}
                className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-neutral-50"
              >
                Supplier View
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
