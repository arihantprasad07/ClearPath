import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  MapPinned,
  MessageSquareText,
  RefreshCw,
  Route,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getApp, getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import "leaflet/dist/leaflet.css";
import { BrandMark } from "../components/BrandMark";
import { useAppContext } from "../context/AppContext";
import { analyzeRisk } from "../../pipeline/aiEngine.js";

type LatLngTuple = [number, number];
type LangCode =
  | "en"
  | "hi"
  | "gu"
  | "ta"
  | "mr"
  | "bn"
  | "te"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur"
  | "sa"
  | "ks"
  | "sd"
  | "mai"
  | "kok"
  | "doi"
  | "mni"
  | "sat"
  | "ne";

type NominatimResult = {
  lat: string;
  lon: string;
};

type AiRoute = {
  routeName: string;
  estimatedTime: number;
  costImpact: number;
  reliabilityScore: number;
};

type AiAnalysisResult = {
  risk: {
    level: "LOW" | "MEDIUM" | "HIGH";
    probability: number;
  };
  delay: {
    hours: number;
    reason: string;
  };
  routes: AiRoute[];
  recommendation: {
    bestRoute: string;
    reason: string;
  };
  alerts: {
    english: string;
    hindi: string;
  };
};

const INDIA_CENTER: LatLngTuple = [22.5937, 78.9629];
const EMPTY_ROUTE: LatLngTuple[] = [];

const languageLabels: Record<LangCode, string> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
  ta: "Tamil",
  mr: "Marathi",
  bn: "Bengali",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
  ur: "Urdu",
  sa: "Sanskrit",
  ks: "Kashmiri",
  sd: "Sindhi",
  mai: "Maithili",
  kok: "Konkani",
  doi: "Dogri",
  mni: "Manipuri",
  sat: "Santali",
  ne: "Nepali",
};

const demoSteps = [
  { title: "See risk instantly", description: "AI summary stays pinned on mobile." },
  { title: "Run AI analysis", description: "Structured route decision appears in one pass." },
  { title: "Approve reroute", description: "Map and operator alert update together." },
  { title: "Present anywhere", description: "Responsive flow works on phone and desktop." },
] as const;

function buildFallbackAlerts(origin: string, destination: string) {
  const route = origin && destination ? `${origin} -> ${destination}` : "Coimbatore -> Surat";
  return {
    en: `ClearPath Alert: ${route} is high risk. Delay 6 hrs. Recommended route: NH-48 Diversion. Tap to approve.`,
    hi: `ClearPath Alert: ${route} par high risk hai. Delay 6 hrs. Recommended route: NH-48 Diversion. Tap karke approve karein.`,
  };
}

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

function createWaypointIcon() {
  return L.divIcon({
    className: "",
    html: '<div style="width:10px;height:10px;border-radius:999px;background:#2563eb;border:2px solid white;box-shadow:0 0 0 1px rgba(37,99,235,0.28);"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onMapClick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function MapBoundsFitter({ coords }: { coords: [LatLngTuple, LatLngTuple] }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(coords, { padding: [48, 48] });
  }, [coords, map]);

  return null;
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSignalPack(origin: string, destination: string) {
  return {
    weather: `Heavy rainfall disrupting the ${origin || "origin"} to ${destination || "destination"} corridor`,
    traffic: "High highway congestion with stop-start freight movement",
    congestion: "Freight terminal delay spike causing unloading backlog",
  };
}

function buildSuggestedCurrentRoute(origin: LatLngTuple, destination: LatLngTuple): LatLngTuple[] {
  const midpointLat = Number(((origin[0] + destination[0]) / 2 - 0.7).toFixed(4));
  const midpointLng = Number(((origin[1] + destination[1]) / 2 + 0.6).toFixed(4));
  return [origin, [midpointLat, midpointLng], destination];
}

function buildSuggestedAlternateRoute(origin: LatLngTuple, destination: LatLngTuple): LatLngTuple[] {
  const midpointLat = Number(((origin[0] + destination[0]) / 2 + 1.1).toFixed(4));
  const midpointLng = Number(((origin[1] + destination[1]) / 2 - 1.4).toFixed(4));
  return [origin, [midpointLat, midpointLng], destination];
}

function summarizeReason(reason: string) {
  if (!reason) return "Run AI analysis to surface the disruption cause.";
  const firstSentence = reason.split(".")[0]?.trim();
  const shortened = firstSentence || reason.trim();
  return shortened.length > 88 ? `${shortened.slice(0, 85).trim()}...` : shortened;
}

function getRiskTone(level?: AiAnalysisResult["risk"]["level"]) {
  if (level === "HIGH") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      summary: "border-red-300 bg-[#fff4f2] text-red-950",
      line: "#dc2626",
      glow: "shadow-[0_18px_44px_-30px_rgba(220,38,38,0.7)]",
    };
  }

  if (level === "MEDIUM") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      summary: "border-amber-300 bg-[#fff8e8] text-amber-950",
      line: "#f59e0b",
      glow: "shadow-[0_18px_44px_-30px_rgba(245,158,11,0.6)]",
    };
  }

  return {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    summary: "border-emerald-300 bg-[#f1fff5] text-emerald-950",
    line: "#16a34a",
    glow: "shadow-[0_18px_44px_-30px_rgba(22,163,74,0.55)]",
  };
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

async function logDisruptionApproval(userId: string | undefined, origin: string, destination: string) {
  const firebaseOptions = getFirebaseOptions();
  if (!firebaseOptions) return;

  const app = getApps().length ? getApp() : initializeApp(firebaseOptions);
  const db = getFirestore(app);

  await addDoc(collection(db, "disruptions"), {
    shipmentId: "DEMO-001",
    origin,
    destination,
    riskRoute: "NH-44",
    approvedRoute: "NH-48 Diversion",
    timeSaved: "11 hours",
    extraCost: "INR 800",
    reliability: "94%",
    approvedAt: serverTimestamp(),
    userId: userId ?? "demo-user",
  });
}

function SummaryCard({
  aiResult,
  stickyMobile = false,
}: {
  aiResult: AiAnalysisResult | null;
  stickyMobile?: boolean;
}) {
  const tone = getRiskTone(aiResult?.risk.level);
  const reason = summarizeReason(aiResult?.delay.reason || "");

  return (
    <div
      className={[
        "rounded-[1.6rem] border p-4 sm:p-5",
        tone.summary,
        tone.glow,
        stickyMobile ? "sticky top-3 z-[500] lg:hidden" : "",
      ].join(" ")}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-70">AI Summary</div>
      <div className="mt-3 text-xl font-black leading-tight sm:text-2xl">
        {aiResult ? `🚨 ${aiResult.risk.level} RISK — ${aiResult.risk.probability}%` : "🚨 AI DECISION PENDING"}
      </div>
      <div className="mt-2 text-base font-bold sm:text-lg">
        {aiResult ? `⏱ Delay: ${aiResult.delay.hours} hrs` : "⏱ Delay: --"}
      </div>
      <div className="mt-2 text-sm font-medium leading-6 sm:text-base">{`📍 ${reason}`}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { authLoading, authUser } = useAppContext();

  const [routeApproved, setRouteApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [alertLang, setAlertLang] = useState<LangCode>("en");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnRoute, setDrawnRoute] = useState<LatLngTuple[]>([]);
  const [drawingTarget, setDrawingTarget] = useState<"current" | "alternate" | null>(null);
  const [savedCurrentRoute, setSavedCurrentRoute] = useState<LatLngTuple[]>(EMPTY_ROUTE);
  const [savedAlternateRoute, setSavedAlternateRoute] = useState<LatLngTuple[]>(EMPTY_ROUTE);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [showProbability, setShowProbability] = useState(false);
  const [originCoords, setOriginCoords] = useState<LatLngTuple | null>(null);
  const [destCoords, setDestCoords] = useState<LatLngTuple | null>(null);
  const [shipmentActive, setShipmentActive] = useState(false);
  const [originCity, setOriginCity] = useState("");
  const [destCity, setDestCity] = useState("");
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);

  useEffect(() => {
    document.title = "ClearPath Dashboard - Live Shipment Intelligence";
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate("/login");
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowProbability(true), 250);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!showApprovalAlert) return undefined;
    const timeoutId = window.setTimeout(() => setShowApprovalAlert(false), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [showApprovalAlert]);

  const liveSignals = useMemo(() => getSignalPack(originCity, destCity), [destCity, originCity]);
  const riskTone = useMemo(() => getRiskTone(aiResult?.risk.level), [aiResult?.risk.level]);
  const originIcon = useMemo(() => createSignalIcon("#22c55e", false), []);
  const highRiskIcon = useMemo(
    () => createSignalIcon(routeApproved ? "#16a34a" : aiResult?.risk.level === "HIGH" ? "#dc2626" : "#f59e0b", !routeApproved),
    [aiResult?.risk.level, routeApproved],
  );
  const waypointIcon = useMemo(() => createWaypointIcon(), []);

  const shipmentLabel = shipmentActive && originCity && destCity ? `${originCity} -> ${destCity}` : "No active shipment";
  const fallbackAlerts = useMemo(() => buildFallbackAlerts(originCity, destCity), [destCity, originCity]);
  const recommendedRoute =
    aiResult?.routes.find((route) => route.routeName === aiResult.recommendation.bestRoute) ?? aiResult?.routes[0] ?? null;
  const routeCards = useMemo(() => {
    const fallbackRoutes: AiRoute[] = [
      { routeName: "NH-48 Diversion", estimatedTime: 28, costImpact: 800, reliabilityScore: 94 },
      { routeName: "NH-27 Corridor", estimatedTime: 31, costImpact: 450, reliabilityScore: 81 },
      { routeName: "Western Freight Bypass", estimatedTime: 33, costImpact: 250, reliabilityScore: 74 },
    ];

    const source = aiResult?.routes?.length ? aiResult.routes : fallbackRoutes;
    const bestRoute = aiResult?.recommendation.bestRoute || "NH-48 Diversion";

    return [...source].sort((left, right) => {
      const leftRecommended = left.routeName === bestRoute;
      const rightRecommended = right.routeName === bestRoute;
      if (leftRecommended && !rightRecommended) return -1;
      if (!leftRecommended && rightRecommended) return 1;
      return right.reliabilityScore - left.reliabilityScore;
    });
  }, [aiResult]);
  const timeSaved = aiResult && recommendedRoute ? Math.max(1, Math.round(Math.max(...aiResult.routes.map((route) => route.estimatedTime)) - recommendedRoute.estimatedTime)) : 11;
  const reducedDelay = aiResult ? Math.max(0, aiResult.delay.hours - timeSaved) : 0;
  const alertMessages = useMemo(
    () => ({
      ...fallbackAlerts,
      en: aiResult?.alerts.english || fallbackAlerts.en,
      hi: aiResult?.alerts.hindi || fallbackAlerts.hi,
    }),
    [aiResult?.alerts.english, aiResult?.alerts.hindi, fallbackAlerts],
  );
  const analysisBullets = aiResult
    ? [
        `Weather impact: ${liveSignals.weather}.`,
        `Traffic condition: ${liveSignals.traffic}.`,
        `Congestion effect: ${liveSignals.congestion}.`,
        `Combined result: ${aiResult.delay.reason}`,
      ]
    : [];

  const runAiAnalysis = async () => {
    if (!shipmentActive || !originCity || !destCity) {
      toast.error("Please enter origin and destination cities first.");
      return;
    }

    setAnalysisLoading(true);
    setAiResult(null);
    setAnalysis("");
    setRouteApproved(false);
    setShowApprovalAlert(false);

    try {
      const [result] = await Promise.all([
        analyzeRisk({
          origin: originCity,
          destination: destCity,
          ...liveSignals,
          timestamp: Date.now(),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1200)),
      ]);

      const nextResult = result as AiAnalysisResult;
      setAiResult(nextResult);
      setAnalysis(nextResult.recommendation.reason);
      toast.success("AI analysis ready", {
        description: `ClearPath analyzed ${originCity} to ${destCity}.`,
      });
    } catch {
      toast.error("AI analysis could not be completed.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const analyzeShipment = async () => {
    const nextOrigin = originInput.trim();
    const nextDestination = destInput.trim();

    if (!nextOrigin || !nextDestination) {
      toast.error("Enter both origin and destination cities.");
      return;
    }

    setShipmentLoading(true);

    try {
      const [originResponse, destinationResponse] = await Promise.all([
        fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nextOrigin)}&countrycodes=in&format=json&limit=1`,
        ),
        fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nextDestination)}&countrycodes=in&format=json&limit=1`,
        ),
      ]);

      if (!originResponse.ok || !destinationResponse.ok) {
        throw new Error("Geocoding failed");
      }

      const [originResults, destinationResults] = (await Promise.all([
        originResponse.json(),
        destinationResponse.json(),
      ])) as [NominatimResult[], NominatimResult[]];

      if (!originResults[0] || !destinationResults[0]) {
        toast.error("City not found. Try a different spelling.");
        return;
      }

      const nextOriginCoords: LatLngTuple = [
        Number.parseFloat(originResults[0].lat),
        Number.parseFloat(originResults[0].lon),
      ];
      const nextDestinationCoords: LatLngTuple = [
        Number.parseFloat(destinationResults[0].lat),
        Number.parseFloat(destinationResults[0].lon),
      ];

      setOriginCoords(nextOriginCoords);
      setDestCoords(nextDestinationCoords);
      setOriginCity(nextOrigin);
      setDestCity(nextDestination);
      setShipmentActive(true);
      setRouteApproved(false);
      setApprovalLoading(false);
      setAnalysis("");
      setAiResult(null);
      setAlertLang("en");
      setDrawnRoute([]);
      setDrawingTarget(null);
      setIsDrawingMode(false);
      setShowApprovalAlert(false);
      setSavedCurrentRoute(buildSuggestedCurrentRoute(nextOriginCoords, nextDestinationCoords));
      setSavedAlternateRoute(buildSuggestedAlternateRoute(nextOriginCoords, nextDestinationCoords));

      toast.success("Shipment mapped", {
        description: `${nextOrigin} to ${nextDestination} is ready for analysis.`,
      });
    } catch {
      toast.error("City not found. Try a different spelling.");
    } finally {
      setShipmentLoading(false);
    }
  };

  const approveBestRoute = async () => {
    if (!shipmentActive || !originCity || !destCity) {
      toast.error("Enter a shipment above to begin analysis.");
      return;
    }

    if (routeApproved || approvalLoading) {
      return;
    }

    setApprovalLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      setRouteApproved(true);
      setShowApprovalAlert(true);
      await logDisruptionApproval(authUser?.id, originCity, destCity);
      toast.success("Route updated", {
        description: `New ETA: ${formatEtaAfterApproval()}`,
      });
    } catch {
      toast.error("Route approval could not be logged.");
    } finally {
      setApprovalLoading(false);
    }
  };

  const startDrawingRoute = (target: "current" | "alternate") => {
    if (!shipmentActive) {
      toast.error("Enter a shipment above before drawing a route.");
      return;
    }

    setDrawingTarget(target);
    setDrawnRoute([]);
    setIsDrawingMode(true);
  };

  const saveDrawnRoute = () => {
    if (!drawingTarget || drawnRoute.length === 0) return;

    if (drawingTarget === "current") {
      setSavedCurrentRoute(drawnRoute);
    } else {
      setSavedAlternateRoute(drawnRoute);
    }

    setIsDrawingMode(false);
    setDrawingTarget(null);
    setDrawnRoute([]);
  };

  const clearDrawnPoints = () => setDrawnRoute([]);

  const cancelDrawing = () => {
    setIsDrawingMode(false);
    setDrawingTarget(null);
    setDrawnRoute([]);
  };

  const resetDemo = () => {
    setRouteApproved(false);
    setApprovalLoading(false);
    setAnalysis("");
    setAiResult(null);
    setAlertLang("en");
    setDrawnRoute([]);
    setSavedCurrentRoute(EMPTY_ROUTE);
    setSavedAlternateRoute(EMPTY_ROUTE);
    setIsDrawingMode(false);
    setDrawingTarget(null);
    setShipmentActive(false);
    setOriginCoords(null);
    setDestCoords(null);
    setOriginCity("");
    setDestCity("");
    setOriginInput("");
    setDestInput("");
    setShowApprovalAlert(false);

    toast.message("Demo reset", {
      description: "Ready to present again.",
    });
  };

  if (authLoading) {
    return (
      <div className="relative min-h-[100dvh] bg-white px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-full bg-neutral-100" />
          <div className="h-64 rounded-[2rem] bg-neutral-100" />
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[420px] rounded-[2rem] bg-neutral-100" />
            <div className="h-[420px] rounded-[2rem] bg-neutral-100" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-[2rem] bg-neutral-100" />
            <div className="h-64 rounded-[2rem] bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-white text-black">
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
        .clearpath-risk-route {
          animation: clearpath-risk-glow 1.8s ease-in-out infinite;
        }
        .clearpath-approved-route {
          animation: clearpath-route-shift 1.1s ease-out;
        }
        .clearpath-alert-enter {
          animation: clearpath-alert-enter 0.45s ease-out;
        }
        @keyframes clearpath-risk-glow {
          0% { filter: drop-shadow(0 0 0 rgba(220,38,38,0.12)); }
          50% { filter: drop-shadow(0 0 9px rgba(220,38,38,0.45)); }
          100% { filter: drop-shadow(0 0 0 rgba(220,38,38,0.12)); }
        }
        @keyframes clearpath-route-shift {
          0% { opacity: 0.2; transform: scale(0.996); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes clearpath-alert-enter {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .map-drawing-mode .leaflet-container {
          cursor: crosshair !important;
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

        <section className="mt-6 rounded-[1.6rem] border border-[#DFFF00]/40 bg-[#DFFF00]/8 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#667300]">Judge Demo Guide</div>
            <button
              type="button"
              onClick={() => setIsGuideExpanded((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700 transition hover:border-black/20"
              aria-label={isGuideExpanded ? "Collapse judge demo guide" : "Expand judge demo guide"}
            >
              {isGuideExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {isGuideExpanded ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {demoSteps.map((step, index) => (
                <div key={step.title} className="min-w-[220px] flex-1 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                  <div className="text-[10px] font-mono text-neutral-400">Step {index + 1}</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">{step.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">{step.description}</div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-[2.2rem] border border-black/10 bg-white/88 p-5 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.18)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <BrandMark />
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-700">
                <ShieldAlert className="h-3.5 w-3.5 text-[#7c8b00]" strokeWidth={2.1} />
                Live route intervention
              </div>
              <h1 className="mt-6 font-['DM_Serif_Display'] text-4xl leading-[0.96] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
                Detect the disruption. Explain the risk. Approve the reroute in one tap.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base sm:leading-8">
                ClearPath turns route disruption into a decision flow with AI risk scoring, route comparison, and one-tap operational approval.
              </p>
            </div>

            <div className="w-full max-w-2xl rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  value={originInput}
                  onChange={(event) => setOriginInput(event.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="h-12 rounded-xl border border-black/15 bg-white px-4 text-sm text-black outline-none transition focus:border-black/25 focus:ring-2 focus:ring-[#DFFF00]/40"
                />
                <input
                  type="text"
                  value={destInput}
                  onChange={(event) => setDestInput(event.target.value)}
                  placeholder="e.g. Surat"
                  className="h-12 rounded-xl border border-black/15 bg-white px-4 text-sm text-black outline-none transition focus:border-black/25 focus:ring-2 focus:ring-[#DFFF00]/40"
                />
                <button
                  type="button"
                  onClick={analyzeShipment}
                  disabled={shipmentLoading}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-black bg-[#DFFF00] px-6 text-sm font-semibold text-black transition hover:bg-[#c8e800] disabled:cursor-wait disabled:opacity-70 md:w-auto"
                >
                  {shipmentLoading ? "Locating cities..." : "Analyze Shipment"}
                </button>
              </div>

              <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-400">
                Geocoding powered by OpenStreetMap Nominatim.
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Shipment lane", value: shipmentActive ? shipmentLabel : "Awaiting input" },
                  {
                    label: "Delay probability",
                    value: aiResult ? `${aiResult.risk.probability}%` : shipmentActive ? "Analyzing..." : "Pending",
                  },
                  {
                    label: "Best alternate",
                    value: recommendedRoute?.routeName || (shipmentActive ? "Pending AI route" : "Pending"),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-black/10 bg-white p-4 shadow-sm">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">{item.label}</div>
                    <div className="mt-3 break-words text-base font-semibold tracking-tight text-neutral-950">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <SummaryCard aiResult={aiResult} stickyMobile />
        </div>

        <section className="mt-6 flex flex-col gap-6 lg:grid lg:min-h-[600px] lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <article className="order-2 rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6 lg:order-1 lg:flex lg:h-[600px] lg:min-h-[600px] lg:flex-col">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Shipment map</div>
                <h2 className="mt-3 font-['DM_Serif_Display'] text-3xl tracking-tight text-neutral-950 sm:text-4xl">India route view</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-red-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  {aiResult?.risk.level === "HIGH" ? "Route risk escalated" : "Route under watch"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/12 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#667300]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8cb300]" />
                  {recommendedRoute?.routeName || "Alternate ready"}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Route editor</div>
                  <h3 className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-neutral-800">Adjust map paths live</h3>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => startDrawingRoute("current")}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-black bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#f1f4e4] sm:w-auto"
                  >
                    Draw active route
                  </button>
                  <button
                    type="button"
                    onClick={() => startDrawingRoute("alternate")}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-black bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#f1f4e4] sm:w-auto"
                  >
                    Draw alternate route
                  </button>
                </div>
              </div>

              {isDrawingMode ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-[1.2rem] border border-[#DFFF00]/60 bg-[#F6FFD5] px-4 py-3 text-sm font-medium text-neutral-800">
                    Click on the map to add waypoints. {drawnRoute.length} points added.
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={saveDrawnRoute}
                      disabled={drawnRoute.length === 0}
                      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-black bg-[#DFFF00] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-black transition hover:bg-[#c8e800] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      Save route
                    </button>
                    <button
                      type="button"
                      onClick={clearDrawnPoints}
                      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-black/10 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black/20 sm:w-auto"
                    >
                      Clear points
                    </button>
                    <button
                      type="button"
                      onClick={cancelDrawing}
                      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-black/10 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black/20 sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-1 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500">
                  <div>Active route: {savedCurrentRoute.length} waypoints</div>
                  <div>Alternate route: {savedAlternateRoute.length} waypoints</div>
                </div>
              )}
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-black/10 lg:flex-1">
              <div className={`relative h-[300px] min-h-[300px] bg-[#eef0e8] sm:h-[320px] lg:h-full lg:min-h-[500px] ${isDrawingMode ? "map-drawing-mode" : ""}`}>
                <MapContainer
                  key={
                    shipmentActive && originCoords && destCoords
                      ? `${originCoords.join(",")}-${destCoords.join(",")}-${routeApproved ? "approved" : "pending"}`
                      : "default-map"
                  }
                  center={INDIA_CENTER}
                  zoom={5}
                  scrollWheelZoom
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {shipmentActive && originCoords && destCoords ? <MapBoundsFitter coords={[originCoords, destCoords]} /> : null}
                  {isDrawingMode ? <MapClickHandler onMapClick={(latlng) => setDrawnRoute((current) => [...current, latlng])} /> : null}

                  {shipmentActive && originCoords ? (
                    <Marker position={originCoords} icon={originIcon}>
                      <Tooltip direction="top" offset={[0, -14]} permanent>
                        {originCity || "Origin"}
                      </Tooltip>
                    </Marker>
                  ) : null}

                  {shipmentActive && destCoords ? (
                    <Marker position={destCoords} icon={highRiskIcon}>
                      <Tooltip direction="top" offset={[0, -14]} permanent>
                        {routeApproved ? `${destCity} secured` : destCity || "Destination"}
                      </Tooltip>
                    </Marker>
                  ) : null}

                  {shipmentActive && savedCurrentRoute.length > 0 ? (
                    <Polyline
                      positions={savedCurrentRoute}
                      pathOptions={{
                        color: riskTone.line,
                        weight: aiResult?.risk.level === "HIGH" ? 6 : 5,
                        dashArray: routeApproved ? "4 14" : "12 12",
                        lineCap: "round",
                        opacity: routeApproved ? 0.22 : 0.92,
                        className: aiResult?.risk.level === "HIGH" && !routeApproved ? "clearpath-risk-route" : "",
                      }}
                    />
                  ) : null}

                  {shipmentActive && savedAlternateRoute.length > 0 && (routeApproved || aiResult) ? (
                    <Polyline
                      positions={savedAlternateRoute}
                      pathOptions={{
                        color: "#87b800",
                        weight: routeApproved ? 7 : 5,
                        lineCap: "round",
                        opacity: routeApproved ? 1 : 0.5,
                        dashArray: routeApproved ? undefined : "10 10",
                        className: routeApproved ? "clearpath-approved-route" : "",
                      }}
                    />
                  ) : null}

                  {isDrawingMode && drawnRoute.length > 0 ? (
                    <>
                      <Polyline
                        positions={drawnRoute}
                        pathOptions={{ color: "#2563eb", weight: 4, dashArray: "8 8", lineCap: "round" }}
                      />
                      {drawnRoute.map((point, index) => (
                        <Marker key={`${point[0]}-${point[1]}-${index}`} position={point} icon={waypointIcon} />
                      ))}
                    </>
                  ) : null}
                </MapContainer>

                {!shipmentActive ? (
                  <div className="absolute inset-0 z-[400] flex items-center justify-center bg-[#eef0e8]/70 p-4">
                    <div className="rounded-[1.4rem] border border-black/10 bg-white px-5 py-4 text-center shadow-sm">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Shipment map</div>
                      <div className="mt-2 text-sm font-semibold text-neutral-900">
                        Enter origin and destination to begin analysis
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-3 py-2 text-sm text-neutral-700">
                <MapPinned className="h-4 w-4 text-[#7c8b00]" />
                {shipmentActive && originCity ? `${originCity} origin` : "Awaiting origin"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f3] px-3 py-2 text-sm text-neutral-700">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {shipmentActive && destCity ? `${destCity} decision zone active` : "Awaiting destination"}
              </div>
              {routeApproved ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/12 px-3 py-2 text-sm text-[#667300]">
                  <CheckCircle2 className="h-4 w-4" />
                  Alternate route approved
                </div>
              ) : null}
            </div>
          </article>

          <div className="order-1 flex flex-col gap-6 lg:order-2 lg:h-[600px] lg:max-h-[600px] lg:overflow-y-auto lg:pr-2">
            <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
              <div className="hidden lg:block">
                <SummaryCard aiResult={aiResult} />
              </div>

              <div className="mt-0 lg:mt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Risk alert panel</div>
                    <h2 className="mt-3 font-['DM_Serif_Display'] text-3xl tracking-tight text-neutral-950 sm:text-4xl">Shipment intervention</h2>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] ${riskTone.badge}`}>
                    {aiResult ? `${aiResult.risk.level} risk` : "Awaiting AI"}
                  </span>
                </div>

                <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Shipment</div>
                  <div className="mt-2 text-xl font-semibold text-neutral-950">
                    {shipmentActive ? shipmentLabel : "No active shipment - enter cities above to begin"}
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{liveSignals.weather}</p>
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">{liveSignals.congestion}</p>
                  </div>

                  <div className="mt-3 rounded-[1.2rem] border border-black/10 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-neutral-700">Delay Probability</span>
                      <span className="font-semibold text-[#7c8b00]">{aiResult ? `${aiResult.risk.probability}%` : "85%"}</span>
                    </div>
                    <div className="mt-3 h-3 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-3 rounded-full bg-[#DFFF00] transition-all duration-[1400ms] ease-out"
                        style={{ width: showProbability ? `${aiResult?.risk.probability ?? 85}%` : "0%" }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-neutral-400">
                      Based on AI analysis of weather, traffic, and congestion
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {routeCards.map((option) => {
                    const isRecommended = option.routeName === (recommendedRoute?.routeName || "NH-48 Diversion");

                    return (
                      <div
                        key={option.routeName}
                        className={`rounded-[1.5rem] border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                          isRecommended ? "border-[#8cb300] bg-[#F6FFD5] ring-1 ring-[#DFFF00]/55 sm:p-5" : "border-black/10 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="break-words text-lg font-semibold text-neutral-950">{option.routeName}</span>
                              {isRecommended ? (
                                <span className="rounded-full border border-[#DFFF00]/55 bg-[#DFFF00]/25 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#667300]">
                                  STAR RECOMMENDED
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 break-words text-sm text-neutral-600">
                              ETA {option.estimatedTime} hrs | {formatCurrency(option.costImpact)} impact | {option.reliabilityScore}% reliable
                            </div>
                          </div>
                          {isRecommended ? <Route className="h-5 w-5 shrink-0 text-[#7c8b00]" strokeWidth={2} /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Before vs after</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-red-200 bg-red-50 p-4">
                      <div className="text-sm font-semibold text-red-800">Original Route</div>
                      <div className="mt-2 text-xl font-black text-red-900">
                        {aiResult ? `Delay: +${aiResult.delay.hours} hrs` : "Delay: +6 hrs"}
                      </div>
                    </div>
                    <div className="rounded-[1.2rem] border border-[#DFFF00]/45 bg-[#F6FFD5] p-4">
                      <div className="text-sm font-semibold text-[#5f6f00]">Recommended Route</div>
                      <div className="mt-2 text-xl font-black text-neutral-900">
                        {aiResult ? (reducedDelay === 0 ? "On-time restored" : `Reduced delay: ${reducedDelay} hrs`) : "On-time restored"}
                      </div>
                      <div className="mt-2 text-sm text-neutral-700">
                        Saves {timeSaved} hrs via {recommendedRoute?.routeName || "NH-48 Diversion"}.
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={approveBestRoute}
                  disabled={approvalLoading || !shipmentActive}
                  className={`mt-6 inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full border border-black bg-[#DFFF00] px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#c8e800] hover:shadow-[0_14px_36px_-18px_rgba(223,255,0,0.65)] disabled:cursor-wait disabled:opacity-70 ${
                    approvalLoading ? "scale-[0.98]" : routeApproved ? "scale-[1.01]" : ""
                  }`}
                >
                  {approvalLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {approvalLoading ? "Updating route..." : "Approve & Update Route"}
                </button>

                {routeApproved ? (
                  <button
                    type="button"
                    onClick={resetDemo}
                    className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-neutral-700 transition hover:border-black/20 hover:bg-neutral-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Demo
                  </button>
                ) : null}
              </div>
            </article>

            <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">AI analysis</div>
                  <h2 className="mt-3 font-['DM_Serif_Display'] text-3xl tracking-tight text-neutral-950 sm:text-4xl">ClearPath AI Analysis</h2>
                </div>
                <button
                  type="button"
                  onClick={runAiAnalysis}
                  disabled={!shipmentActive || analysisLoading}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-black bg-[#DFFF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c8e800] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                >
                  {analysisLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  Run AI Analysis
                </button>
              </div>

              {!shipmentActive && !analysisLoading ? (
                <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">Enter cities above first</p>
              ) : null}

              <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-5">
                {analysisLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center gap-3 text-neutral-600">
                    <LoaderCircle className="h-5 w-5 animate-spin text-[#7c8b00]" />
                    <span className="animate-pulse">Analyzing route...</span>
                  </div>
                ) : aiResult ? (
                  <div className="min-h-[180px] space-y-4 text-neutral-700">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Why this decision</div>
                    <div className="space-y-3 text-sm leading-7 sm:text-base">
                      {analysisBullets.map((bullet) => (
                        <div key={bullet} className="flex gap-3">
                          <span className="pt-1 text-[#7c8b00]">-</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-[#DFFF00]/35 bg-[#F6FFD5] px-4 py-3 text-sm font-medium text-neutral-800">
                      {analysis}
                    </div>
                  </div>
                ) : (
                  <p className="min-h-[180px] text-base leading-8 text-neutral-500">
                    Enter origin and destination above, then click "Run AI Analysis" to get a Gemini-powered risk assessment for your route.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_22px_60px_-28px_rgba(0,0,0,0.12)] sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Alert preview</div>
                  <h2 className="mt-3 font-['DM_Serif_Display'] text-3xl tracking-tight text-neutral-950 sm:text-4xl">WhatsApp-style alert</h2>
                  <p className="mt-2 text-sm text-neutral-500">Operator-ready preview with quick approval context.</p>
                </div>

                <div className="mb-2">
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    Select alert language
                  </label>
                  <select
                    value={alertLang}
                    onChange={(event) => setAlertLang(event.target.value as LangCode)}
                    className="h-11 w-full cursor-pointer rounded-xl border border-black/15 bg-white px-4 text-sm font-medium text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                  >
                    {(Object.keys(languageLabels) as LangCode[]).map((code) => (
                      <option key={code} value={code}>
                        {languageLabels[code]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#e9efe1] p-4">
                <div className="mx-auto max-w-[28rem] rounded-[1.6rem] border border-[#bfd27a] bg-white p-4 shadow-sm">
                  <div
                    className={`rounded-[1.3rem] bg-[#DCF8C6] px-4 py-4 text-sm leading-7 text-neutral-800 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.18)] ${
                      showApprovalAlert ? "clearpath-alert-enter" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#6b7f35]">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Alert preview
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-black text-[#547100]">{aiResult ? `🚨 ${aiResult.risk.level} RISK` : "🚨 HIGH RISK"}</div>
                      <div className="text-sm font-semibold text-neutral-800">
                        {aiResult ? `Delay: ${aiResult.delay.hours} hrs` : "Delay: 6 hrs"}
                      </div>
                      <div className="rounded-2xl bg-white/70 px-3 py-3 text-sm leading-7 text-neutral-800">
                        <div className="font-semibold">Recommended:</div>
                        <div>Route: {recommendedRoute?.routeName || "NH-48 Diversion"}</div>
                        <div>Saves: {timeSaved} hrs</div>
                      </div>
                      <p className="whitespace-pre-line break-words">{alertLang === "hi" ? alertMessages.hi : alertMessages.en}</p>
                      <div className="text-sm font-semibold text-[#547100]">Tap to approve</div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#6b7f35]">
                      <span>11:42 AM</span>
                      <span aria-hidden>OK</span>
                    </div>
                  </div>
                </div>
              </div>

              {showApprovalAlert ? (
                <div className="clearpath-alert-enter mt-4 rounded-[1.2rem] border border-[#DFFF00]/45 bg-[#F6FFD5] px-4 py-3 text-sm font-medium text-neutral-800">
                  Route update approved. Driver and ops timeline synced.
                </div>
              ) : null}
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
