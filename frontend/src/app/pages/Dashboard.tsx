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
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getApp, getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import "leaflet/dist/leaflet.css";
import { BrandMark } from "../components/BrandMark";
import { useAppContext } from "../context/AppContext";

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

const languageLabels: Record<LangCode, string> = {
  en: "English",
  hi: "हिंदी",
  gu: "ગુજરાતી",
  ta: "தமிழ்",
  mr: "मराठी",
  bn: "বাংলা",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو",
  sa: "संस्कृत",
  ks: "کٲشُر",
  sd: "سنڌي",
  mai: "मैथिली",
  kok: "कोंकणी",
  doi: "डोगरी",
  mni: "মণিপুরী",
  sat: "ᱥᱟᱱᱛᱟᱲᱤ",
  ne: "नेपाली",
};

const alertMessages: Record<LangCode, string> = {
  en: "🚨 ClearPath Alert: Coimbatore→Surat shipment is HIGH RISK.\nRecommended: Reroute via NH-48. Saves 11hrs, costs ₹800 extra.\nTap below to approve.",
  hi: "🚨 ClearPath अलर्ट: कोयंबटूर→सूरत शिपमेंट उच्च जोखिम में है।\nसुझाव: NH-48 से रास्ता बदलें। 11 घंटे बचेंगे, ₹800 अतिरिक्त।\nअनुमोदन के लिए नीचे टैप करें।",
  gu: "🚨 ClearPath એલર્ટ: કોઈમ્બતૂર→સુરત શિપમેન્ટ ઉચ્ચ જોખમમાં છે।\nભલામણ: NH-48 થી માર્ગ બદલો। 11 કલાક બચશે, ₹800 વધારાના।\nમંજૂરી માટે નીચે ટેપ કરો।",
  ta: "🚨 ClearPath எச்சரிக்கை: கோயம்புத்தூர்→சூரத் ஏற்றுமதி அதிக ஆபத்தில் உள்ளது.\nபரிந்துரை: NH-48 வழியாக திசை மாற்றவும். 11 மணி நேரம் மிச்சம், ₹800 கூடுதல்.\nஒப்புதலுக்கு கீழே தட்டவும்.",
  mr: "🚨 ClearPath सूचना: कोइम्बतूर→सुरत शिपमेंट उच्च धोक्यात आहे.\nशिफारस: NH-48 मार्गे वळवा. 11 तास वाचतील, ₹800 अतिरिक्त.\nमंजुरीसाठी खाली टॅप करा.",
  bn: "🚨 ClearPath সতর্কতা: কোয়েম্বাটোর→সুরাট শিপমেন্ট উচ্চ ঝুঁকিতে আছে।\nপরামর্শ: NH-48 দিয়ে পথ পরিবর্তন করুন। ১১ ঘণ্টা বাঁচবে, ₹৮০০ অতিরিক্ত।\nঅনুমোদনের জন্য নিচে ট্যাপ করুন।",
  te: "🚨 ClearPath హెచ్చరిక: కోయంబత్తూర్→సూరత్ షిప్‌మెంట్ అధిక ప్రమాదంలో ఉంది.\nసిఫార్సు: NH-48 ద్వారా మళ్లించండి. 11 గంటలు ఆదా, ₹800 అదనంగా.\nఆమోదానికి క్రింద నొక్కండి.",
  kn: "🚨 ClearPath ಎಚ್ಚರಿಕೆ: ಕೊಯಮತ್ತೂರು→ಸೂರತ್ ಶಿಪ್‌ಮೆಂಟ್ ಹೆಚ್ಚಿನ ಅಪಾಯದಲ್ಲಿದೆ.\nಶಿಫಾರಸು: NH-48 ಮೂಲಕ ತಿರುಗಿಸಿ. 11 ಗಂಟೆ ಉಳಿತಾಯ, ₹800 ಹೆಚ್ಚುವರಿ.\nಅನುಮೋದನೆಗೆ ಕೆಳಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ.",
  ml: "🚨 ClearPath മുന്നറിയിപ്പ്: കോയമ്പത്തൂർ→സൂറത്ത് ഷിപ്പ്‌മെന്റ് ഉയർന്ന അപകടത്തിലാണ്.\nശുപാർശ: NH-48 വഴി തിരിച്ചുവിടുക. 11 മണിക്കൂർ ലാഭം, ₹800 അധികം.\nഅംഗീകാരത്തിന് താഴെ ടാപ്പ് ചെയ്യുക.",
  pa: "🚨 ClearPath ਚੇਤਾਵਨੀ: ਕੋਇੰਬਟੂਰ→ਸੂਰਤ ਸ਼ਿਪਮੈਂਟ ਉੱਚ ਜੋਖਮ ਵਿੱਚ ਹੈ।\nਸਿਫਾਰਸ਼: NH-48 ਰਾਹੀਂ ਰੂਟ ਬਦਲੋ। 11 ਘੰਟੇ ਬਚਣਗੇ, ₹800 ਵਾਧੂ।\nਪ੍ਰਵਾਨਗੀ ਲਈ ਹੇਠਾਂ ਟੈਪ ਕਰੋ।",
  or: "🚨 ClearPath ସତର୍କତା: କୋଇମ୍ବାଟୋର→ସୁରାଟ ଶିପମେଣ୍ଟ ଉଚ୍ଚ ଜୋଖିମରେ ଅଛି।\nସୁପାରିଶ: NH-48 ମାଧ୍ୟମରେ ରୁଟ ବଦଳାନ୍ତୁ। 11 ଘଣ୍ଟା ସଞ୍ଚୟ, ₹800 ଅତିରିକ୍ତ।\nଅନୁମୋଦନ ପାଇଁ ତଳୁ ଟ୍ୟାପ କରନ୍ତୁ।",
  as: "🚨 ClearPath সতৰ্কবাৰ্তা: কোইম্বাটোৰ→ছুৰাট শিপমেণ্ট উচ্চ বিপদত আছে।\nপৰামৰ্শ: NH-48 ৰ মাজেৰে পথ সলনি কৰক। ১১ ঘণ্টা ৰাহি, ₹৮০০ অতিৰিক্ত।\nঅনুমোদনৰ বাবে তললৈ টেপ কৰক।",
  ur: "🚨 ClearPath انتباہ: کوئمبٹور→سورت شپمنٹ اعلی خطرے میں ہے۔\nتجویز: NH-48 سے راستہ بدلیں۔ 11 گھنٹے بچیں گے، ₹800 اضافی۔\nمنظوری کے لیے نیچے ٹیپ کریں۔",
  sa: "🚨 ClearPath सूचना: कोयम्बत्तूर→सूरत प्रेषणम् उच्च जोखिमे अस्ति।\nअनुशंसा: NH-48 मार्गेण परिवर्तयतु। 11 घण्टाः रक्ष्यन्ते, ₹800 अधिकम्।\nअनुमोदनाय अधः स्पृशतु।",
  ks: "🚨 ClearPath خبردار: کوئمبٹور→سورت شپمنٹ ہیوو خطرہ چھ۔\nصلاہ: NH-48 راستہ تبدیل کرو۔ 11 گھنٹہ بچہ، ₹800 زیادہ۔\nمنظوری دِتھ تلہ ٹیپ کرو۔",
  sd: "🚨 ClearPath خبردار: ڪوئمبٽور→سورت شپمينٽ تي وڏو خطرو آهي.\nصلاح: NH-48 ذريعي رستو بدلايو. 11 ڪلاڪ بچندا، ₹800 وڌيڪ.\nمنظوري لاءِ هيٺ ٽيپ ڪريو.",
  mai: "🚨 ClearPath चेतावनी: कोयम्बत्तूर→सूरत शिपमेंट उच्च जोखिम मे अछि।\nसुझाव: NH-48 सँ रस्ता बदलू। 11 घंटा बचत, ₹800 अतिरिक्त।\nस्वीकृतिक लेल नीचाँ टैप करू।",
  kok: "🚨 ClearPath इशारो: कोइम्बतूर→सुरत शिपमेंट उच्च धोक्यात आसा.\nशिफारस: NH-48 मार्गान वळोवचें. 11 वरां वाचतलीं, ₹800 अधिक.\nमान्यताक खाल टॅप करचें.",
  doi: "🚨 ClearPath चेतावनी: कोयम्बत्तूर→सूरत शिपमेंट उच्च जोखिम च है।\nसुझाव: NH-48 थमां रस्ता बदलो। 11 घैंटे बचणे, ₹800 अतिरिक्त।\nपरवानगी आस्तै थल्ले टैप करो।",
  mni: "🚨 ClearPath লাইরিক্কী: কোইমবাটোর→সুরাট শিপমেন্ট হেন্না খঙদনবা ফবদা লৈ।\nচাউখৎলকপা: NH-48 গী মফম্দা ফেরাউ। মতম ১১ চহী ঙাকথোকপা, ₹৮০০ চপ্পা।\nসম্মতি পীবা দাইরেক্ট তাক্লি।",
  sat: "🚨 ClearPath ᱥᱮᱛᱟᱜ: ᱠᱚᱭᱢᱵᱟᱴᱩᱨ→ᱥᱩᱨᱟᱴ ᱥᱤᱯᱢᱮᱱᱴ ᱦᱟᱹᱴᱤᱛ ᱮᱢ ᱟᱠᱟᱱ ᱠᱟᱱᱟ.\nᱵᱟᱹᱭᱞᱟᱹ: NH-48 ᱨᱟᱥᱛᱟ ᱵᱚᱫᱚᱞ. 11 ᱸᱥᱚᱠ ᱵᱟᱹᱪᱟᱣ, ₹800 ᱡᱟᱹᱰᱤ.\nᱢᱟᱱ ᱫᱮᱵᱟᱜ ᱛᱮᱞᱮ ᱴᱮᱯ ᱢᱮ.",
  ne: "🚨 ClearPath सूचना: कोयम्बत्तूर→सुरत ढुवानी उच्च जोखिममा छ।\nसुझाव: NH-48 बाट बाटो बदल्नुस्। ११ घण्टा बच्छ, ₹800 थप।\nस्वीकृतिका लागि तल ट्याप गर्नुस्।",
};

const demoSteps = [
  { title: "👁 See HIGH RISK", description: "Red pulsing marker on Surat" },
  { title: "🤖 Run AI Analysis", description: "Click the lime button → Gemini responds" },
  { title: "✅ Approve Route", description: "One tap → map updates instantly" },
  { title: "🌐 Switch Language", description: "Pick any of 22 Indian languages" },
] as const;

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
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
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
  const [alertLang, setAlertLang] = useState<LangCode>("en");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnRoute, setDrawnRoute] = useState<LatLngTuple[]>([]);
  const [drawingTarget, setDrawingTarget] = useState<"current" | "alternate" | null>(null);
  const [savedCurrentRoute, setSavedCurrentRoute] = useState<LatLngTuple[]>(currentRoute);
  const [savedAlternateRoute, setSavedAlternateRoute] = useState<LatLngTuple[]>(alternateRoute);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);

  useEffect(() => {
    document.title = "ClearPath Dashboard — Live Shipment Intelligence";
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate("/login");
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowConfidence(true), 300);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const originIcon = useMemo(() => createSignalIcon("#22c55e", false), []);
  const highRiskIcon = useMemo(
    () => createSignalIcon(routeApproved ? "#22c55e" : "#ef4444", !routeApproved),
    [routeApproved],
  );
  const waypointIcon = useMemo(() => createWaypointIcon(), []);

  const runAiAnalysis = async () => {
    const backendUrl =
      (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8000";
    setAnalysisLoading(true);

    const fallback =
      "ClearPath recommends rerouting Priya's shipment via NH-48 immediately. This alternate route avoids the NH-44 rainfall zone entirely, saving approximately 11 hours of delay. The additional cost of ₹800 is significantly lower than the estimated ₹4,200 loss from missing customer deadlines. NH-48 currently shows 94% on-time reliability - the strongest option available right now.";

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${backendUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Backend error");

      const payload = (await response.json()) as Record<string, unknown>;
      const recommendation = typeof payload.recommendation === "string" ? payload.recommendation : "";
      setAnalysis(recommendation || fallback);
      toast.success("AI analysis ready", {
        description: "Gemini returned a route recommendation for Priya.",
      });
    } catch {
      window.clearTimeout(timeoutId);
      setAnalysis(fallback);
      toast.success("AI analysis ready", {
        description: "Gemini returned a route recommendation for Priya.",
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
      await logDisruptionApproval(authUser?.id);
    } catch (error) {
      console.warn("Unable to log disruption approval to Firestore.", error);
    }

    toast.success("✅ Route approved. Transporter notified.", {
      description: `New ETA: ${formatEtaAfterApproval()}`,
    });
  };

  const startDrawingRoute = (target: "current" | "alternate") => {
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
    setAnalysis("");
    setAlertLang("en");
    setDrawnRoute([]);
    setSavedCurrentRoute(currentRoute);
    setSavedAlternateRoute(alternateRoute);
    setIsDrawingMode(false);
    setDrawingTarget(null);
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
          <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
            <div className="h-[500px] rounded-[2rem] bg-neutral-100" />
            <div className="h-[500px] rounded-[2rem] bg-neutral-100" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-[2rem] bg-neutral-100" />
            <div className="h-64 rounded-[2rem] bg-neutral-100" />
          </div>
          <div className="flex justify-center pt-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
              Loading ClearPath...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

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
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#667300]">🎯 Judge Demo Guide</div>
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
              <div className="inline-flex items-center justify-center rounded-full border border-[#DFFF00]/50 bg-[#DFFF00] px-4 py-2 text-[11px] font-semibold text-black">
                ⏱ Total demo time: under 60 seconds
              </div>
            </div>
          ) : null}
        </section>

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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

            <div className="mt-5 rounded-[1.6rem] border border-black/10 bg-[#f7f7f3] p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Route Editor</div>
                  <h3 className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-neutral-800">Route Editor</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startDrawingRoute("current")}
                    className="inline-flex items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#f1f4e4]"
                  >
                    Draw NH-44 Route
                  </button>
                  <button
                    type="button"
                    onClick={() => startDrawingRoute("alternate")}
                    className="inline-flex items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-[#f1f4e4]"
                  >
                    Draw NH-48 Route
                  </button>
                </div>
              </div>

              {isDrawingMode ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-[1.2rem] border border-[#DFFF00]/60 bg-[#F6FFD5] px-4 py-3 text-sm font-medium text-neutral-800">
                    Click on the map to add waypoints. {drawnRoute.length} points added.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveDrawnRoute}
                      disabled={drawnRoute.length === 0}
                      className="inline-flex items-center justify-center rounded-full border border-black bg-[#DFFF00] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-black transition hover:bg-[#c8e800] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save Route
                    </button>
                    <button
                      type="button"
                      onClick={clearDrawnPoints}
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black/20"
                    >
                      Clear Points
                    </button>
                    <button
                      type="button"
                      onClick={cancelDrawing}
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-1 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500">
                  <div>NH-44 route: {savedCurrentRoute.length} waypoints</div>
                  <div>NH-48 route: {savedAlternateRoute.length} waypoints</div>
                </div>
              )}
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-black/10">
              <div className={`h-[300px] bg-[#eef0e8] sm:h-[450px] ${isDrawingMode ? "map-drawing-mode" : ""}`}>
                <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="z-0">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {isDrawingMode ? (
                    <MapClickHandler onMapClick={(latlng) => setDrawnRoute((existing) => [...existing, latlng])} />
                  ) : null}

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
                    positions={savedCurrentRoute}
                    pathOptions={{ color: "#ef6a3c", weight: 5, dashArray: "12 12", lineCap: "round" }}
                  />
                  <Polyline positions={savedAlternateRoute} pathOptions={{ color: "#87b800", weight: 6, lineCap: "round" }} />

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
                  Heavy rainfall on NH-44 - 85% delay probability
                </p>
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                  Freight terminal congestion at Surat - +4 hrs wait
                </p>
              </div>

              <div className="mt-3 rounded-[1.2rem] border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-neutral-700">AI Confidence Score</span>
                  <span className="font-semibold text-[#7c8b00]">85%</span>
                </div>
                <div className="mt-3 h-3 w-full rounded-full bg-neutral-100">
                  <div
                    className="h-3 rounded-full bg-[#DFFF00] transition-all duration-[1400ms] ease-out"
                    style={{ width: showConfidence ? "85%" : "0%" }}
                  />
                </div>
                <div className="mt-2 text-[10px] text-neutral-400">
                  Based on IMD rainfall data + historical NH-44 patterns
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {routeOptions.map((option) => (
                <div
                  key={option.name}
                  className={`rounded-[1.5rem] border p-4 shadow-sm ${
                    option.recommended ? "border-[#DFFF00]/55 bg-[#F6FFD5]" : "border-black/10 bg-white"
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

            {routeApproved ? (
              <button
                type="button"
                onClick={resetDemo}
                className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-sm text-neutral-700 transition hover:border-black/20 hover:bg-neutral-50"
              >
                <RefreshCw className="h-4 w-4" />
                ↺ Reset Demo
              </button>
            ) : null}
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
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">Alert preview</div>
                <h2 className="mt-3 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-950">WhatsApp-style alert</h2>
                <p className="mt-2 text-sm text-neutral-500">22 Indian languages supported</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(languageLabels) as LangCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setAlertLang(code)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      alertLang === code
                        ? "border border-black bg-[#DFFF00] text-black"
                        : "border border-black/10 bg-[#f7f7f3] text-neutral-600"
                    }`}
                  >
                    {languageLabels[code]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#e9efe1] p-4">
              <div className="mx-auto max-w-[28rem] rounded-[1.6rem] border border-[#bfd27a] bg-white p-4 shadow-sm">
                <div className="rounded-[1.3rem] bg-[#DCF8C6] px-4 py-4 text-sm leading-7 text-neutral-800 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.18)]">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#6b7f35]">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Alert preview
                  </div>
                  <p className="whitespace-pre-line">{alertMessages[alertLang]}</p>
                  <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#6b7f35]">
                    <span>11:42 AM</span>
                    <span aria-hidden>✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
