import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  LoaderCircle,
  MapPinned,
  MessageSquareText,
  Route,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { getApp, getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import "leaflet/dist/leaflet.css";
import { BrandMark } from "../components/BrandMark";
import { useAppContext } from "../context/AppContext";

type LatLngTuple = [number, number];

const INDIA_CENTER: LatLngTuple = [22.5937, 78.9629];
const COIMBATORE: LatLngTuple = [11.0168, 76.9558];
const SURAT: LatLngTuple = [21.1702, 72.8311];

const currentRoute: LatLngTuple[] = [
  COIMBATORE,
  [12.9716, 77.5946],
  [17.385, 78.4867],
  [19.076, 72.8777],
  SURAT,
];

const alternateRoute: LatLngTuple[] = [
  COIMBATORE,
  [12.2958, 76.6394],
  [15.3647, 75.124],
  [18.5204, 73.8567],
  SURAT,
];

const routeOptions = [
  {
    name: "NH-48",
    saves: "Saves 11hrs",
    cost: "₹800 extra",
    reliability: "94% on-time",
    recommended: true,
  },
  {
    name: "NH-27",
    saves: "Saves 6hrs",
    cost: "₹400 extra",
    reliability: "78% on-time",
    recommended: false,
  },
  {
    name: "NH-8",
    saves: "Saves 3hrs",
    cost: "₹200 extra",
    reliability: "65% on-time",
    recommended: false,
  },
] as const;

const englishAlert =
  "🚨 ClearPath Alert: Coimbatore→Surat shipment is HIGH RISK. Recommended: Reroute via NH-48. Saves 11hrs, costs ₹800 extra. Tap below to approve.";
const hindiAlert =
  "🚨 ClearPath अलर्ट: कोयंबटूर→सूरत शिपमेंट उच्च जोखिम में है। सुझाव: NH-48 से रास्ता बदलें। 11 घंटे बचेंगे, ₹800 अतिरिक्त। अनुमोदन के लिए नीचे टैप करें।";

function createSignalIcon(color: string, pulse: boolean) {
  return L.divIcon({
    className: "",
    html: `
      <div class="clearpath-marker ${pulse ? "clearpath-marker-pulse" : ""}" style="--marker-color:${color}">
        <span class="clearpath-marker-core"></span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function formatEtaAfterApproval() {
  const eta = new Date(Date.now() + 31 * 60 * 60 * 1000);
  return eta.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFirebaseOptions() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  };
}

async function logDisruptionApproval(userId: string | undefined) {
  const firebaseOptions = getFirebaseOptions();
  if (!firebaseOptions) return;

  const app = getApps().length ? getApp() : initializeApp(firebaseOptions);
  const db = getFirestore(app);
  await addDoc(collection(db, "disruptions"), {
    shipmentId: "DEMO-001",
    origin: "Coimbatore",
    destination: "Surat",
    riskRoute: "NH-44",
    approvedRoute: "NH-48",
    timeSaved: "11 hours",
    extraCost: "₹800",
    reliability: "94%",
    approvedAt: serverTimestamp(),
    userId: userId ?? "demo-user",
  });
  console.log("Disruption logged to Firestore: DEMO-001");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { authLoading, authUser } = useAppContext();
  const [routeApproved, setRouteApproved] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isHindi, setIsHindi] = useState(false);

  useEffect(() => {
    document.title = "Dashboard - ClearPath";
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate("/login");
  }, [authLoading, authUser, navigate]);

  const originIcon = useMemo(() => createSignalIcon("#22c55e", false), []);
  const highRiskIcon = useMemo(() => createSignalIcon(routeApproved ? "#22c55e" : "#ef4444", !routeApproved), [routeApproved]);

  if (authLoading || !authUser) return null;

  const runAiAnalysis = async () => {
    const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8000";
    setAnalysisLoading(true);

    try {
      const response = await fetch(`${backendUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "ClearPath could not reach the AI analysis service.");
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const recommendation = typeof payload.recommendation === "string" ? payload.recommendation : "";

      if (!recommendation) {
        throw new Error("The AI service responded, but no recommendation text was returned.");
      }

      setAnalysis(recommendation);
      toast.success("AI analysis ready", {
        description: "Gemini returned a route recommendation for Priya.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ClearPath could not complete the analysis request.";
      setAnalysis("");
      toast.error("AI analysis failed", {
        description: message,
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const approveBestRoute = async () => {
    if (routeApproved) {
      toast.message("Best route already approved", {
        description: `New ETA: ${formatEtaAfterApproval()}`,
      });
      return;
    }

    setRouteApproved(true);

    try {
      await logDisruptionApproval(authUser.id);
    } catch (error) {
      console.warn("Unable to log disruption approval to Firestore.", error);
    }

    toast.success("✅ Route approved. Transporter notified.", {
      description: `New ETA: ${formatEtaAfterApproval()}`,
    });
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white text-black">
      <style>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          font-family: "Outfit", ui-sans-serif, system-ui, sans-serif;
        }
        .clearpath-marker {
          position: relative;
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
        }
        .clearpath-marker::before {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--marker-color) 20%, white);
        }
        .clearpath-marker-core {
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: var(--marker-color);
          border: 3px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
        }
        .clearpath-marker-pulse::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: color-mix(in srgb, var(--marker-color) 28%, transparent);
          animation: clearpath-pulse 1.6s ease-out infinite;
        }
        @keyframes clearpath-pulse {
          0% { transform: scale(0.8); opacity: 0.95; }
          70% { transform: scale(1.9); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>

      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(223,255,0,0.18),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7f3_48%,#efefe8_100%)]"
        aria-hidden
      />
      <div className="absolute -right-24 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-[#DFFF00]/18 blur-[110px]" aria-hidden />
      <div className="absolute -bottom-24 -left-20 -z-10 h-[32rem] w-[32rem] rounded-full bg-black/[0.07] blur-[110px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700 shadow-sm backdrop-blur transition hover:border-black/20 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/12 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#667300]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Demo-ready shipment decision flow
          </div>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-black/10 bg-white/88 p-6 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.18)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <BrandMark />
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-700">
                <ShieldAlert className="h-3.5 w-3.5 text-[#7c8b00]" strokeWidth={2.1} />
                Live route intervention
              </div>
              <h1 className="mt-6 font-['DM_Serif_Display'] text-5xl leading-[0.95] tracking-tight text-neutral-950 sm:text-6xl">
                Detect the disruption. Explain the risk. Approve the reroute in one tap.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
                This prototype dashboard is tuned for the judge demo: one high-risk textile shipment, three route
                options, one AI recommendation, and a single approval moment that changes the route state instantly.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Shipment lane", value: "Coimbatore → Surat" },
                { label: "Delay probability", value: "85%" },
                { label: "Best alternate", value: "NH-48" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-5 shadow-sm">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">{item.label}</div>
                  <div className="mt-3 text-xl font-semibold tracking-tight text-neutral-950">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
          <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Shipment map</div>
                <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950">India route view</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-red-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  NH-44 active risk
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/12 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#667300]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8cb300]" />
                  NH-48 ready
                </span>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-black/10">
              <div className="h-[450px] bg-[#eef0e8]">
                <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="z-0">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Marker position={COIMBATORE} icon={originIcon}>
                    <Tooltip direction="top" offset={[0, -14]} permanent>
                      Origin
                    </Tooltip>
                  </Marker>

                  <Marker position={SURAT} icon={highRiskIcon}>
                    <Tooltip direction="top" offset={[0, -14]} permanent>
                      {routeApproved ? "Route secured" : "HIGH RISK"}
                    </Tooltip>
                  </Marker>

                  <Polyline
                    positions={currentRoute}
                    pathOptions={{ color: "#ef6a3c", weight: 5, dashArray: "12 12", lineCap: "round" }}
                  />

                  {routeApproved ? (
                    <Polyline positions={alternateRoute} pathOptions={{ color: "#87b800", weight: 6, lineCap: "round" }} />
                  ) : null}
                </MapContainer>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-3 py-2 text-sm text-neutral-700">
                <MapPinned className="h-4 w-4 text-[#7c8b00]" />
                Coimbatore origin
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-3 py-2 text-sm text-neutral-700">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Surat destination flagged
              </div>
              {routeApproved ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/12 px-3 py-2 text-sm text-[#667300]">
                  <CheckCircle2 className="h-4 w-4" />
                  Alternate route approved
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Risk alert panel</div>
                <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950">Shipment intervention</h2>
              </div>
              <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-red-700">
                High risk
              </span>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Shipment</div>
              <div className="mt-2 text-xl font-semibold text-neutral-950">Coimbatore → Surat</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  Heavy rainfall on NH-44 — 85% delay probability
                </p>
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                  Freight terminal congestion at Surat — +4 hrs wait
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {routeOptions.map((option) => (
                <div
                  key={option.name}
                  className={`rounded-[1.5rem] border p-4 shadow-sm ${
                    option.recommended
                      ? "border-[#DFFF00]/55 bg-[#F6FFD5]"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-neutral-950">{option.name}</span>
                        {option.recommended ? (
                          <span className="rounded-full border border-[#DFFF00]/55 bg-[#DFFF00]/25 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#667300]">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm text-neutral-600">
                        {option.saves} | {option.cost} | {option.reliability}
                      </div>
                    </div>
                    {option.recommended ? <Route className="h-5 w-5 text-[#7c8b00]" strokeWidth={2} /> : null}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={approveBestRoute}
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-black bg-[#DFFF00] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#c8e800] hover:shadow-[0_14px_36px_-18px_rgba(223,255,0,0.65)]"
            >
              <CheckCircle2 className="h-5 w-5" />
              ✅ Approve Best Route
            </button>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">AI analysis</div>
                <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950">ClearPath AI Analysis</h2>
              </div>
              <button
                type="button"
                onClick={runAiAnalysis}
                disabled={analysisLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black bg-[#DFFF00] px-5 text-sm font-semibold text-black transition hover:bg-[#c8e800] disabled:cursor-wait disabled:opacity-70"
              >
                {analysisLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                Run AI Analysis
              </button>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-5">
              {analysisLoading ? (
                <div className="flex min-h-[180px] items-center justify-center gap-3 text-neutral-600">
                  <LoaderCircle className="h-5 w-5 animate-spin text-[#7c8b00]" />
                  Gemini is generating a route recommendation...
                </div>
              ) : analysis ? (
                <p className="min-h-[180px] text-base leading-8 text-neutral-700">{analysis}</p>
              ) : (
                <p className="min-h-[180px] text-base leading-8 text-neutral-500">
                  Click &apos;Run AI Analysis&apos; to get Gemini&apos;s recommendation
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Alert preview</div>
                <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950">WhatsApp-style alert</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHindi((current) => !current)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-[#f7f7f3] px-4 text-sm font-medium text-neutral-700 transition hover:border-black/20 hover:bg-white"
              >
                {isHindi ? "See in English" : "हिंदी में देखें"}
              </button>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#e9efe1] p-4">
              <div className="mx-auto max-w-[28rem] rounded-[1.6rem] border border-[#bfd27a] bg-white p-4 shadow-sm">
                <div className="rounded-[1.3rem] bg-[#DCF8C6] px-4 py-4 text-sm leading-7 text-neutral-800 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.18)]">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#6b7f35]">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Alert preview
                  </div>
                  <p>{isHindi ? hindiAlert : englishAlert}</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
