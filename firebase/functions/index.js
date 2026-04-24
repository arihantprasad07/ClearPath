const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onRequest } = require("firebase-functions/v2/https");

initializeApp();

const db = getFirestore();
const adminAuth = getAuth();
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.options("*", cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const AUTH_MODE = "firebase_primary";
const DEFAULT_ORG_ID = "default-org";
const DEFAULT_ROLE = "operator";
const DEFAULT_STAKEHOLDER_ROLE = "shipper";
const INDIA_FALLBACK_CITIES = {
  surat: { lat: 21.1702, lng: 72.8311, label: "Surat, Gujarat, India" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: "Ahmedabad, Gujarat, India" },
  mumbai: { lat: 19.076, lng: 72.8777, label: "Mumbai, Maharashtra, India" },
  pune: { lat: 18.5204, lng: 73.8567, label: "Pune, Maharashtra, India" },
  delhi: { lat: 28.6139, lng: 77.209, label: "Delhi, India" },
  chennai: { lat: 13.0827, lng: 80.2707, label: "Chennai, Tamil Nadu, India" },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: "Bengaluru, Karnataka, India" },
  kolkata: { lat: 22.5726, lng: 88.3639, label: "Kolkata, West Bengal, India" },
};

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value, fallback = "value") {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function numericHash(value) {
  return Array.from(String(value || ""))
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toTitleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

function normalizeRole(role) {
  return role === "admin" ? "admin" : DEFAULT_ROLE;
}

function normalizeStakeholderRole(role) {
  if (["shipper", "transporter", "receiver", "admin"].includes(role)) return role;
  return DEFAULT_STAKEHOLDER_ROLE;
}

function buildUserResponse(overrides = {}) {
  const username = String(overrides.username || process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const role = normalizeRole(overrides.role);
  const stakeholderRole = normalizeStakeholderRole(
    role === "admin" ? "admin" : overrides.stakeholderRole,
  );
  return {
    id: String(overrides.id || `user-${slugify(username)}`),
    username,
    role,
    stakeholderRole,
    orgId: String(overrides.orgId || DEFAULT_ORG_ID),
    phoneNumber: overrides.phoneNumber ?? null,
    deviceToken: overrides.deviceToken ?? null,
    firebaseUid: overrides.firebaseUid ?? null,
    mfaEnabled: Boolean(overrides.mfaEnabled),
    createdAt: overrides.createdAt || nowIso(),
  };
}

function signAccessToken(user) {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not configured.");
  }
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      orgId: user.orgId || DEFAULT_ORG_ID,
      stakeholderRole: user.stakeholderRole || DEFAULT_STAKEHOLDER_ROLE,
    },
    secret,
    { expiresIn: "12h" },
  );
}

function parseAppToken(token) {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not configured.");
  }
  return jwt.verify(token, secret);
}

function buildAuthEnvelope(user, extra = {}) {
  return {
    accessToken: signAccessToken(user),
    tokenType: "bearer",
    user,
    ...extra,
  };
}

async function ensureUserDocument(user) {
  await db.collection("users").doc(user.id).set(user, { merge: true });
}

async function verifyAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing bearer token." });
    }

    const decoded = parseAppToken(token);
    req.user = buildUserResponse({
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      orgId: decoded.orgId,
      stakeholderRole: decoded.stakeholderRole,
      createdAt: decoded.createdAt,
    });
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function routeId(index) {
  return ["primary", "secondary", "express"][index] || `route-${index + 1}`;
}

function buildFallbackLocation(query) {
  const normalized = String(query || "").trim().toLowerCase();
  const direct = INDIA_FALLBACK_CITIES[normalized];
  if (direct) return direct;

  const hash = Math.abs(numericHash(normalized || "india"));
  const lat = 8 + (hash % 2500) / 100;
  const lng = 68 + ((hash >> 5) % 2900) / 100;
  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    label: `${toTitleCase(normalized || "Unknown")}, India`,
  };
}

async function geocodeQuery(query) {
  if (!query || String(query).trim().length < 2) {
    throw new Error("Query must be at least 2 characters.");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return buildFallbackLocation(query);

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: { address: query, key: apiKey, region: "in" },
      timeout: 10000,
    });
    const result = response.data?.results?.[0];
    if (!result?.geometry?.location) {
      return buildFallbackLocation(query);
    }
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      label: result.formatted_address || buildFallbackLocation(query).label,
    };
  } catch (error) {
    return buildFallbackLocation(query);
  }
}

function haversineKm(source, destination) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(destination.lat - source.lat);
  const dLng = toRad(destination.lng - source.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(source.lat)) * Math.cos(toRad(destination.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchRoutesFromMaps(source, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const baseDistanceKm = haversineKm(source, destination);
  if (!apiKey) {
    return buildFallbackRoutes(source, destination, baseDistanceKm, true);
  }

  try {
    const body = {
      origin: { location: { latLng: { latitude: source.lat, longitude: source.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      computeAlternativeRoutes: true,
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      languageCode: "en-IN",
      units: "METRIC",
    };
    const response = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.description,routes.legs",
        },
        timeout: 15000,
      },
    );

    const routes = Array.isArray(response.data?.routes) ? response.data.routes : [];
    if (!routes.length) {
      return buildFallbackRoutes(source, destination, baseDistanceKm, true);
    }

    const mapped = routes.slice(0, 3).map((route, index) => {
      const distanceKm = Number(((route.distanceMeters || baseDistanceKm * 1000) / 1000).toFixed(1));
      const durationSeconds = Number(String(route.duration || "0s").replace("s", "")) || Math.round((distanceKm / 42) * 3600);
      return {
        id: routeId(index),
        name: index === 0 ? "Primary corridor" : index === 1 ? "Balanced reroute" : "Fastest detour",
        description: route.description || `Route option ${index + 1} between ${source.label} and ${destination.label}.`,
        eta: Number((durationSeconds / 3600).toFixed(1)),
        distanceKm,
        traffic: clamp(0.44 + index * 0.08 + distanceKm / 1200, 0.2, 0.95),
        congestionIndex: clamp(38 + index * 11 + distanceKm / 18, 15, 95),
        waypoints: [
          { lat: source.lat, lng: source.lng, label: source.label },
          {
            lat: Number((((source.lat + destination.lat) / 2) + index * 0.09).toFixed(4)),
            lng: Number((((source.lng + destination.lng) / 2) + index * 0.11).toFixed(4)),
            label: `Waypoint ${index + 1}`,
          },
          { lat: destination.lat, lng: destination.lng, label: destination.label },
        ],
        usedFallback: false,
      };
    });

    while (mapped.length < 3) {
      mapped.push(buildFallbackRoutes(source, destination, baseDistanceKm, false)[mapped.length]);
    }

    return mapped;
  } catch (error) {
    return buildFallbackRoutes(source, destination, baseDistanceKm, true);
  }
}

function buildFallbackRoutes(source, destination, baseDistanceKm, usedFallback) {
  const base = Math.max(baseDistanceKm, 120);
  return [
    {
      id: "primary",
      name: "Primary corridor",
      description: "Current active route with standard motorway flow.",
      eta: Number((base / 42).toFixed(1)),
      distanceKm: Number(base.toFixed(1)),
      traffic: 0.68,
      congestionIndex: 71,
      waypoints: [
        { lat: source.lat, lng: source.lng, label: source.label },
        {
          lat: Number(((source.lat + destination.lat) / 2).toFixed(4)),
          lng: Number(((source.lng + destination.lng) / 2).toFixed(4)),
          label: "Primary waypoint",
        },
        { lat: destination.lat, lng: destination.lng, label: destination.label },
      ],
      usedFallback,
    },
    {
      id: "secondary",
      name: "Balanced reroute",
      description: "Slightly longer route with steadier traffic conditions.",
      eta: Number(((base * 1.08) / 48).toFixed(1)),
      distanceKm: Number((base * 1.08).toFixed(1)),
      traffic: 0.48,
      congestionIndex: 49,
      waypoints: [
        { lat: source.lat, lng: source.lng, label: source.label },
        {
          lat: Number((((source.lat + destination.lat) / 2) + 0.12).toFixed(4)),
          lng: Number((((source.lng + destination.lng) / 2) - 0.08).toFixed(4)),
          label: "Balanced waypoint",
        },
        { lat: destination.lat, lng: destination.lng, label: destination.label },
      ],
      usedFallback,
    },
    {
      id: "express",
      name: "Fastest detour",
      description: "Quicker bypass with higher toll exposure but lower congestion.",
      eta: Number(((base * 0.96) / 52).toFixed(1)),
      distanceKm: Number((base * 0.96).toFixed(1)),
      traffic: 0.4,
      congestionIndex: 38,
      waypoints: [
        { lat: source.lat, lng: source.lng, label: source.label },
        {
          lat: Number((((source.lat + destination.lat) / 2) - 0.07).toFixed(4)),
          lng: Number((((source.lng + destination.lng) / 2) + 0.14).toFixed(4)),
          label: "Express waypoint",
        },
        { lat: destination.lat, lng: destination.lng, label: destination.label },
      ],
      usedFallback,
    },
  ];
}

async function fetchWeather(location) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return {
      summary: "Warm conditions with isolated disruption risk.",
      severity: 0.34,
      temperature: 31,
      rain: 0,
      usedFallback: true,
    };
  }

  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: apiKey,
        units: "metric",
      },
      timeout: 10000,
    });
    const weather = response.data?.weather?.[0];
    const rainVolume = Number(response.data?.rain?.["1h"] || response.data?.rain?.["3h"] || 0);
    const wind = Number(response.data?.wind?.speed || 0);
    const summary = weather?.description
      ? `${toTitleCase(weather.description)} near ${location.label || "the lane"}`
      : `Weather update available for ${location.label || "the lane"}`;
    const severity = clamp((rainVolume / 20) + wind / 35 + (weather?.main === "Thunderstorm" ? 0.4 : 0.15), 0.05, 1);
    return {
      summary,
      severity: Number(severity.toFixed(2)),
      temperature: Number(response.data?.main?.temp || 30),
      rain: rainVolume,
      usedFallback: false,
    };
  } catch (error) {
    return {
      summary: `Weather fallback active for ${location.label || "the lane"}.`,
      severity: 0.41,
      temperature: 30,
      rain: 0,
      usedFallback: true,
    };
  }
}

async function fetchRoadSignal() {
  const baseUrl = process.env.NHAI_ROADS_BASE_URL;
  if (!baseUrl) {
    return {
      summary: "No live NHAI feed configured, using heuristic road pressure estimate.",
      severity: 0.42,
      source: "fallback",
      usedFallback: true,
    };
  }

  try {
    const response = await axios.get(baseUrl, { timeout: 8000 });
    const severity = clamp(Number(response.data?.severity ?? 0.35), 0, 1);
    return {
      summary: response.data?.summary || "Live road status feed available.",
      severity,
      source: "nhai",
      usedFallback: false,
    };
  } catch (error) {
    return {
      summary: "Road status feed unavailable, fallback road model applied.",
      severity: 0.46,
      source: "fallback",
      usedFallback: true,
    };
  }
}

function buildRiskReasons(weatherSeverity, traffic, roadSeverity) {
  return [
    {
      type: "weather",
      icon: "cloud-rain",
      description: `Weather severity is ${Math.round(weatherSeverity * 100)}% along the active lane.`,
      impact: "Storm or rain conditions can compress recovery margin.",
    },
    {
      type: "traffic",
      icon: "route",
      description: `Traffic load is ${Math.round(traffic * 100)}% on the selected corridor.`,
      impact: "Higher congestion raises delay probability quickly.",
    },
    {
      type: "roads",
      icon: "alert-triangle",
      description: `Road health pressure is ${Math.round(roadSeverity * 100)}%.`,
      impact: "Surface or corridor issues increase route fragility.",
    },
  ];
}

function computeRisk(activeRoute, weatherBundle, roadSignal, cargoValue, priority) {
  const weatherSeverity = weatherBundle.combinedSeverity;
  const traffic = activeRoute.traffic;
  const distanceFactor = clamp(activeRoute.distanceKm / 900, 0.08, 0.25);
  const cargoFactor = cargoValue ? clamp(cargoValue / 1000000, 0, 0.18) : 0;
  const priorityFactor = priority === "critical" ? 0.12 : priority === "express" ? 0.06 : 0.02;
  const baseRisk = weatherSeverity * 42 + traffic * 30 + (roadSignal.severity || 0.35) * 18 + distanceFactor * 100 * 0.1;
  const riskScore = clamp(Math.round(baseRisk + cargoFactor * 100 + priorityFactor * 100), 8, 96);
  const riskLevel =
    riskScore >= 80 ? "critical" : riskScore >= 62 ? "high" : riskScore >= 38 ? "medium" : "low";
  const probability = clamp(Number((0.28 + riskScore / 125).toFixed(2)), 0.12, 0.96);
  const delayHours = Number((activeRoute.eta * (0.1 + weatherSeverity * 0.45 + traffic * 0.3)).toFixed(1));
  return {
    risk: {
      score: riskScore,
      level: riskLevel,
      weatherSeverity: Number(weatherSeverity.toFixed(2)),
      trafficCongestion: Number(traffic.toFixed(2)),
      congestionIndex: Number(activeRoute.congestionIndex.toFixed(2)),
      historicalPatternScore: Number((0.35 + roadSignal.severity * 0.4).toFixed(2)),
      routeLengthKm: Number(activeRoute.distanceKm.toFixed(1)),
      reasons: buildRiskReasons(weatherSeverity, traffic, roadSignal.severity),
    },
    delay: {
      hours: delayHours,
      text: `${delayHours.toFixed(1)}h`,
      probability,
    },
    predictionWindow: {
      startHours: riskScore >= 65 ? 6 : riskScore >= 45 ? 8 : 12,
      endHours: riskScore >= 65 ? 8 : riskScore >= 45 ? 12 : 24,
      confidence: Math.round(probability * 100),
      label:
        riskScore >= 65
          ? "6-8 hour disruption window"
          : riskScore >= 45
            ? "8-12 hour disruption window"
            : "12-24 hour watch window",
    },
  };
}

function buildCascadeImpact(riskScore, probability) {
  const affectedOrders = Math.max(2, Math.round(2 + riskScore / 18 + probability * 4));
  return {
    severity: riskScore >= 70 ? "high" : riskScore >= 45 ? "medium" : "low",
    affectedOrders,
    slaRisk: riskScore >= 70 ? "Miss likely without reroute" : riskScore >= 45 ? "Promise window at risk" : "Monitor closely",
    summary: `If this route slips, about ${affectedOrders} downstream commitments may be affected.`,
  };
}

function buildStatusMessage(riskLevel, recommendation) {
  if (riskLevel === "critical" || riskLevel === "high") {
    return `Risk is elevated on the active route. ${recommendation}`;
  }
  if (riskLevel === "medium") {
    return `Risk is building but still manageable. ${recommendation}`;
  }
  return `Route remains stable for now. ${recommendation}`;
}

function buildDefaultGeminiPayload(context) {
  const urgency = context.riskScore >= 70 || context.priority === "critical" ? "Act now" : context.riskScore >= 45 ? "Monitor" : "Low priority";
  const explanation =
    context.riskScore >= 70
      ? "Weather and congestion are stacking on the active route, so switching now protects the delivery window."
      : "Signals remain manageable, but route conditions should be watched closely to avoid avoidable delay.";
  const englishAlert = `Risk detected on ${context.sourceLabel} to ${context.destinationLabel}. ${context.recommendation}. Delay risk ${context.delayText}.`;
  return {
    riskScore: context.riskScore,
    riskLevel: context.riskLevel === "critical" ? "high" : context.riskLevel,
    statusMessage: buildStatusMessage(context.riskLevel, context.recommendation),
    recommendation: context.recommendation,
    explanation,
    alertTranslations: {
      en: englishAlert,
      hi: `${context.sourceLabel} se ${context.destinationLabel} route par risk mila. ${context.recommendation}.`,
      gu: `${context.sourceLabel} thi ${context.destinationLabel} route par jokham dekhay chhe. ${context.recommendation}.`,
      ta: `${context.sourceLabel} முதல் ${context.destinationLabel} வரை செல்லும் பாதையில் ஆபத்து உள்ளது. ${context.recommendation}.`,
      mr: `${context.sourceLabel} ते ${context.destinationLabel} मार्गावर धोका दिसत आहे. ${context.recommendation}.`,
    },
  };
}

function buildGeminiPrompt(context) {
  return `
You are ClearPath, an Indian logistics disruption copilot.
Return strict JSON only with keys:
- riskScore (0-100 integer)
- riskLevel ("low" | "medium" | "high")
- statusMessage
- recommendation
- explanation
- alertTranslations { en, hi, gu, ta, mr }

Shipment:
- origin: ${context.sourceLabel}
- destination: ${context.destinationLabel}
- priority: ${context.priority}
- estimatedCargoValue: ${context.estimatedCargoValue ?? "unknown"}

Weather:
${JSON.stringify(context.weatherSummary, null, 2)}

Route options:
${JSON.stringify(context.routeOptions, null, 2)}

Use the data above to score disruption risk and give a short operator recommendation.
`;
}

async function scoreWithGemini(context) {
  if (!genAI) return buildDefaultGeminiPayload(context);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(buildGeminiPrompt(context));
    const text = result.response.text().trim().replace(/^```json\s*|\s*```$/g, "");
    const parsed = JSON.parse(text);
    const fallback = buildDefaultGeminiPayload(context);
    return {
      riskScore: clamp(Number(parsed.riskScore || fallback.riskScore), 0, 100),
      riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : fallback.riskLevel,
      statusMessage: parsed.statusMessage || fallback.statusMessage,
      recommendation: parsed.recommendation || fallback.recommendation,
      explanation: parsed.explanation || fallback.explanation,
      alertTranslations: {
        en: parsed.alertTranslations?.en || fallback.alertTranslations.en,
        hi: parsed.alertTranslations?.hi || fallback.alertTranslations.hi,
        gu: parsed.alertTranslations?.gu || fallback.alertTranslations.gu,
        ta: parsed.alertTranslations?.ta || fallback.alertTranslations.ta,
        mr: parsed.alertTranslations?.mr || fallback.alertTranslations.mr,
      },
    };
  } catch (error) {
    return buildDefaultGeminiPayload(context);
  }
}

function selectRecommendedRoute(routes, weatherSeverity) {
  return routes
    .map((route) => {
      const riskScore = Math.round(clamp(route.traffic * 55 + weatherSeverity * 25 + route.distanceKm / 25, 5, 99));
      return {
        ...route,
        derivedRiskScore: riskScore,
      };
    })
    .sort((left, right) => {
      if (left.derivedRiskScore !== right.derivedRiskScore) return left.derivedRiskScore - right.derivedRiskScore;
      return left.eta - right.eta;
    })[0];
}

function buildRouteOptions(routes, recommendedRouteId, weatherSeverity) {
  return routes.reduce((accumulator, route) => {
    const riskScore = Math.round(clamp(route.traffic * 55 + weatherSeverity * 25 + route.distanceKm / 25, 5, 99));
    accumulator[route.id] = {
      id: route.id,
      name: route.name,
      description: route.description,
      eta: route.eta,
      distanceKm: route.distanceKm,
      traffic: Number(route.traffic.toFixed(2)),
      congestionIndex: Number(route.congestionIndex.toFixed(2)),
      cost: Math.round(route.distanceKm * 18 + route.traffic * 1200),
      reliability: Math.round(clamp(94 - riskScore * 0.65, 45, 97)),
      riskScore,
      weatherSeverity: Number(weatherSeverity.toFixed(2)),
      waypoints: route.waypoints,
      timeSavedMinutes: Math.max(0, Math.round((routes[0].eta - route.eta) * 60)),
      decisionFit:
        route.id === recommendedRouteId
          ? "Best balance of ETA protection and risk reduction."
          : "Trade speed against a different cost and congestion profile.",
      valueScore: Math.round(clamp(100 - riskScore + (route.id === recommendedRouteId ? 12 : 0), 20, 100)),
      recommendedFlag: route.id === recommendedRouteId,
      tradeOff:
        route.id === recommendedRouteId
          ? "Cuts risk without pushing ETA too far."
          : route.eta < routes[0].eta
            ? "Faster but slightly costlier corridor."
            : "Safer but a bit longer to operate.",
    };
    return accumulator;
  }, {});
}

function buildExplanation(geminiPayload, prediction, delayText) {
  const urgency =
    geminiPayload.riskLevel === "high" ? "Act now" : geminiPayload.riskLevel === "medium" ? "Monitor" : "Low priority";
  return {
    headline: geminiPayload.statusMessage,
    why: geminiPayload.explanation,
    recommendation: geminiPayload.recommendation,
    confidence: geminiPayload.riskScore >= 70 ? "High" : geminiPayload.riskScore >= 45 ? "Medium" : "Low",
    urgency,
    title: geminiPayload.statusMessage,
    summary: geminiPayload.explanation,
    cause: prediction,
    delayEstimate: delayText,
    reasoning: [geminiPayload.statusMessage, geminiPayload.explanation, geminiPayload.recommendation].filter(Boolean),
  };
}

function buildDecision(recommendedRoute, prediction, delayText, riskScore, geminiPayload) {
  return {
    riskScore,
    prediction,
    recommendedRouteId: recommendedRoute.id,
    recommendedRoute: recommendedRoute.name,
    delayEstimate: delayText,
    timeSavedMinutes: recommendedRoute.timeSavedMinutes,
    reason: `Switching to ${recommendedRoute.name} lowers disruption exposure on this lane.`,
    whyNow: geminiPayload.statusMessage,
    urgency: riskScore >= 70 ? "act_now" : riskScore >= 45 ? "review" : "monitor",
    confidence: Math.round(clamp(40 + riskScore * 0.55, 35, 96)),
    recommendedAction: geminiPayload.recommendation,
    canReroute: true,
    approvalLabel: "Approve in 1 tap",
  };
}

function buildSignalStack(weatherOrigin, weatherDestination, roadSignal, usedFallbackData, activeRoute) {
  return [
    {
      name: "Origin weather",
      summary: weatherOrigin.summary,
      severity: weatherOrigin.severity,
      source: weatherOrigin.usedFallback ? "fallback" : "openweather",
      usedFallback: weatherOrigin.usedFallback,
    },
    {
      name: "Destination weather",
      summary: weatherDestination.summary,
      severity: weatherDestination.severity,
      source: weatherDestination.usedFallback ? "fallback" : "openweather",
      usedFallback: weatherDestination.usedFallback,
    },
    {
      name: "Maps traffic",
      summary: `Traffic load is ${Math.round(activeRoute.traffic * 100)}% on the active corridor.`,
      severity: Number(activeRoute.traffic.toFixed(2)),
      source: activeRoute.usedFallback ? "fallback" : "google_maps",
      usedFallback: activeRoute.usedFallback,
    },
    {
      name: "NHAI roads",
      summary: roadSignal.summary,
      severity: Number(roadSignal.severity.toFixed(2)),
      source: roadSignal.source,
      usedFallback: roadSignal.usedFallback,
    },
    {
      name: "History",
      summary: usedFallbackData
        ? "Historical disruption model is running in fallback mode."
        : "Historical pressure is blended into the route scoring model.",
      severity: usedFallbackData ? 0.35 : 0.22,
      source: usedFallbackData ? "fallback" : "firestore",
      usedFallback: usedFallbackData,
    },
  ];
}

function buildArchitectureStatus() {
  return {
    authMode: AUTH_MODE,
    persistenceMode: "firestore",
    analyticsMode: "firestore_audit_log",
    agentMode: "firebase_functions_orchestrator",
    executionMode: "firebase_functions",
    deliveryModes: ["dashboard_only"],
    stakeholderRoles: ["Shipper", "Transporter", "Receiver", "Admin"],
  };
}

function buildAlert(geminiPayload) {
  return {
    channel: "whatsapp",
    headline: "Predictive disruption alert",
    message: geminiPayload.alertTranslations.en,
    primaryCta: "Approve in 1 tap",
    fallbackChannel: "dashboard",
    translations: geminiPayload.alertTranslations,
  };
}

function buildPrediction(riskScore, delayHours) {
  if (riskScore >= 70) {
    return `High probability of delay in the next 6-8 hours. Estimated delay: ${delayHours.toFixed(1)} hours.`;
  }
  if (riskScore >= 45) {
    return `Moderate probability of delay in the next 8-12 hours. Estimated delay: ${delayHours.toFixed(1)} hours.`;
  }
  return `Low probability of delay in the next 12-24 hours. Estimated delay: ${delayHours.toFixed(1)} hours.`;
}

function buildTopLevelStatus(priority, riskScore) {
  const threshold = priority === "critical" ? 55 : priority === "express" ? 62 : 68;
  return riskScore >= threshold ? "risk_detected" : "stable";
}

async function analyzeShipment({
  source,
  destination,
  sourceQuery,
  destinationQuery,
  priority = "standard",
  estimatedCargoValue = null,
  activeRouteId = "primary",
}) {
  const started = Date.now();
  const [routesRaw, weatherOrigin, weatherDestination, roadSignal] = await Promise.all([
    fetchRoutesFromMaps(source, destination),
    fetchWeather(source),
    fetchWeather(destination),
    fetchRoadSignal(),
  ]);

  const combinedWeatherSeverity = Number(clamp((weatherOrigin.severity + weatherDestination.severity) / 2, 0.05, 1).toFixed(2));
  const recommendedSeed = selectRecommendedRoute(routesRaw, combinedWeatherSeverity);
  const routeOptions = buildRouteOptions(routesRaw, recommendedSeed.id, combinedWeatherSeverity);
  const currentActiveRoute = routeOptions[activeRouteId] || routeOptions.primary || Object.values(routeOptions)[0];
  const currentRouteRaw = routesRaw.find((route) => route.id === currentActiveRoute.id) || routesRaw[0];
  const recommendedRoute = routeOptions[recommendedSeed.id];
  const { risk, delay, predictionWindow } = computeRisk(currentActiveRoute, { combinedSeverity: combinedWeatherSeverity }, roadSignal, estimatedCargoValue, priority);
  const prediction = buildPrediction(risk.score, delay.hours);
  const geminiPayload = await scoreWithGemini({
    sourceLabel: source.label || sourceQuery,
    destinationLabel: destination.label || destinationQuery,
    priority,
    estimatedCargoValue,
    weatherSummary: {
      origin: weatherOrigin.summary,
      destination: weatherDestination.summary,
      combinedSeverity: combinedWeatherSeverity,
    },
    routeOptions: Object.values(routeOptions),
    riskScore: risk.score,
    riskLevel: risk.level,
    recommendation: `Switch to ${recommendedRoute.name} now`,
    delayText: delay.text,
  });

  const normalizedRiskScore = clamp(Number(geminiPayload.riskScore || risk.score), 0, 100);
  const normalizedRiskLevel =
    geminiPayload.riskLevel === "high"
      ? (normalizedRiskScore >= 80 ? "critical" : "high")
      : geminiPayload.riskLevel === "medium"
        ? "medium"
        : "low";
  risk.score = normalizedRiskScore;
  risk.level = normalizedRiskLevel;

  const explanation = buildExplanation(geminiPayload, prediction, delay.text);
  const decision = buildDecision(recommendedRoute, prediction, delay.text, normalizedRiskScore, geminiPayload);
  const usedFallbackData = Boolean(
    weatherOrigin.usedFallback ||
      weatherDestination.usedFallback ||
      roadSignal.usedFallback ||
      routesRaw.some((route) => route.usedFallback),
  );
  const alert = buildAlert(geminiPayload);
  const signalStack = buildSignalStack(weatherOrigin, weatherDestination, roadSignal, usedFallbackData, currentRouteRaw);
  const cascadeImpact = buildCascadeImpact(normalizedRiskScore, delay.probability);
  const status = buildTopLevelStatus(priority, normalizedRiskScore);
  const statusMessage = geminiPayload.statusMessage || buildStatusMessage(status, decision.recommendedAction);
  const timestamp = nowIso();

  return {
    id: "",
    orgId: DEFAULT_ORG_ID,
    sourceQuery,
    destinationQuery,
    source,
    destination,
    priority,
    estimatedCargoValue,
    cargoType: null,
    weightKg: null,
    route: currentActiveRoute.id,
    riskScore: normalizedRiskScore,
    status,
    activeRouteId: currentActiveRoute.id,
    selectedRouteId: currentActiveRoute.id,
    recommendedRouteId: recommendedRoute.id,
    recommendedRoute: recommendedRoute.name,
    routes: {
      recommendedRouteId: recommendedRoute.id,
      options: routeOptions,
    },
    risk,
    prediction,
    delayEstimateHours: delay.hours,
    predictionWindow,
    delay,
    cascadeImpact,
    decision,
    alert,
    recommendation: decision.recommendedAction,
    explanation,
    aiExplanation: explanation.why,
    alertFlag: status === "risk_detected",
    activeAlert:
      status === "risk_detected"
        ? {
            message: alert.message,
            severity: risk.level,
            timestamp,
          }
        : null,
    signalStack,
    architectureStatus: buildArchitectureStatus(),
    statusMessage,
    dispatchStatus: { status: "skipped", reason: "dashboard_only_demo" },
    usedFallbackData,
    responseTimeMs: Date.now() - started,
    alertMessage: status === "risk_detected" ? alert.message : null,
    lastMonitoredAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function recordAuditEvent({ shipmentId = null, orgId, eventType, status, actor, detail, metadata = {} }) {
  const event = {
    id: `EVT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    orgId,
    shipmentId,
    eventType,
    status,
    actor,
    detail,
    metadata,
    createdAt: nowIso(),
    exportStatus: null,
  };
  await db.collection("audit_events").doc(event.id).set(event);
  return event;
}

async function getShipmentForUser(shipmentId, user) {
  const snapshot = await db.collection("shipments").doc(shipmentId).get();
  if (!snapshot.exists) {
    return null;
  }
  const shipment = snapshot.data();
  if (user.role !== "admin" && shipment.orgId !== user.orgId) {
    return null;
  }
  return shipment;
}

app.get("/health", asyncHandler(async (_req, res) => {
  res.json({ status: "ok", database: "firestore", authMode: AUTH_MODE });
}));

app.post("/auth/login", asyncHandler(async (req, res) => {
  const { username, password, role } = req.body || {};
  const expectedUsername = String(process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const expectedPassword = String(process.env.ADMIN_PASSWORD || "");
  if (String(username || "").trim().toLowerCase() !== expectedUsername || String(password || "") !== expectedPassword) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const user = buildUserResponse({
    id: "admin-user",
    username: expectedUsername,
    role: role === "admin" ? "admin" : "admin",
    stakeholderRole: "admin",
    orgId: DEFAULT_ORG_ID,
  });
  await ensureUserDocument(user);
  res.json(buildAuthEnvelope(user));
}));

app.post("/auth/firebase", asyncHandler(async (req, res) => {
  const bodyToken = req.body?.idToken;
  const bearerToken = getBearerToken(req);
  const idToken = bodyToken || bearerToken;
  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID token is required." });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    return res.status(401).json({ error: "Invalid Firebase token." });
  }

  const customClaims = decoded;
  const role = normalizeRole(customClaims.role || (decoded.email && decoded.email.toLowerCase() === String(process.env.ADMIN_USERNAME || "admin").toLowerCase() ? "admin" : DEFAULT_ROLE));
  const stakeholderRole = normalizeStakeholderRole(customClaims.stakeholderRole || (role === "admin" ? "admin" : DEFAULT_STAKEHOLDER_ROLE));
  const orgId = String(customClaims.orgId || DEFAULT_ORG_ID);
  const needsClaims = !customClaims.role || !customClaims.orgId || !customClaims.stakeholderRole;

  if (needsClaims) {
    await adminAuth.setCustomUserClaims(decoded.uid, {
      ...(decoded.claims || {}),
      role,
      orgId,
      stakeholderRole,
    });
  }

  const user = buildUserResponse({
    id: decoded.uid,
    username: decoded.email || decoded.name || `firebase-${decoded.uid.slice(0, 8)}`,
    role,
    stakeholderRole,
    orgId,
    firebaseUid: decoded.uid,
  });
  await ensureUserDocument(user);
  res.json(buildAuthEnvelope(user, { firebaseVerified: true }));
}));

app.get("/auth/me", verifyAuth, asyncHandler(async (req, res) => {
  const snapshot = await db.collection("users").doc(req.user.id).get();
  const stored = snapshot.exists ? snapshot.data() : {};
  res.json(buildUserResponse({ ...stored, ...req.user }));
}));

app.post("/geocode", verifyAuth, asyncHandler(async (req, res) => {
  const location = await geocodeQuery(req.body?.query);
  res.json({ location });
}));

app.get("/shipments", verifyAuth, asyncHandler(async (req, res) => {
  let query = db.collection("shipments");
  if (req.user.role !== "admin") {
    query = query.where("orgId", "==", req.user.orgId);
  }
  const snapshot = await query.get();
  const shipments = snapshot.docs
    .map((doc) => doc.data())
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
  res.json({ shipments });
}));

app.post("/shipments", verifyAuth, asyncHandler(async (req, res) => {
  if (req.user.stakeholderRole === "transporter") {
    return res.status(403).json({ error: "Transporters cannot create shipments." });
  }

  const sourceQuery = String(req.body?.sourceQuery || req.body?.source || "").trim();
  const destinationQuery = String(req.body?.destinationQuery || req.body?.destination || "").trim();
  const priority = req.body?.priority || "standard";
  const estimatedCargoValue = req.body?.estimatedCargoValue ?? null;

  if (sourceQuery.length < 2 || destinationQuery.length < 2) {
    return res.status(400).json({ error: "Source and destination are required." });
  }

  const [source, destination] = await Promise.all([geocodeQuery(sourceQuery), geocodeQuery(destinationQuery)]);
  const analysis = await analyzeShipment({
    source,
    destination,
    sourceQuery,
    destinationQuery,
    priority,
    estimatedCargoValue,
    activeRouteId: "primary",
  });
  const shipmentId = `SHP-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const shipment = {
    ...analysis,
    id: shipmentId,
    orgId: req.user.orgId,
  };
  await db.collection("shipments").doc(shipmentId).set(shipment);
  await recordAuditEvent({
    shipmentId,
    orgId: req.user.orgId,
    eventType: "shipment_created",
    status: shipment.status,
    actor: req.user.username,
    detail: `Created lane from ${shipment.source.label} to ${shipment.destination.label}.`,
    metadata: {
      riskScore: shipment.risk.score,
      recommendedRouteId: shipment.recommendedRouteId,
    },
  });
  res.json(shipment);
}));

app.post("/shipments/:id/refresh", verifyAuth, asyncHandler(async (req, res) => {
  const current = await getShipmentForUser(req.params.id, req.user);
  if (!current) {
    return res.status(404).json({ error: "Shipment not found." });
  }

  const analysis = await analyzeShipment({
    source: current.source,
    destination: current.destination,
    sourceQuery: current.sourceQuery,
    destinationQuery: current.destinationQuery,
    priority: current.priority,
    estimatedCargoValue: current.estimatedCargoValue,
    activeRouteId: current.activeRouteId,
  });
  const updated = {
    ...current,
    ...analysis,
    id: current.id,
    orgId: current.orgId,
    activeRouteId: current.activeRouteId,
    selectedRouteId: current.selectedRouteId || current.activeRouteId,
    route: current.activeRouteId,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
    lastMonitoredAt: nowIso(),
  };
  await db.collection("shipments").doc(current.id).set(updated);
  await recordAuditEvent({
    shipmentId: current.id,
    orgId: current.orgId,
    eventType: "shipment_refreshed",
    status: updated.status,
    actor: req.user.username,
    detail: `Manual refresh completed for ${current.id}.`,
    metadata: {
      riskScore: updated.risk.score,
      activeRouteId: updated.activeRouteId,
    },
  });
  res.json(updated);
}));

async function applyRouteChange(req, res) {
  const current = await getShipmentForUser(req.params.id, req.user);
  if (!current) {
    return res.status(404).json({ error: "Shipment not found." });
  }
  if (req.user.stakeholderRole === "transporter") {
    return res.status(403).json({ error: "Transporters cannot approve reroutes." });
  }

  const routeIdValue = String(req.body?.routeId || req.body?.route || "").trim();
  if (!routeIdValue || !current.routes?.options?.[routeIdValue]) {
    return res.status(400).json({ error: "Route not found for shipment." });
  }

  const analysis = await analyzeShipment({
    source: current.source,
    destination: current.destination,
    sourceQuery: current.sourceQuery,
    destinationQuery: current.destinationQuery,
    priority: current.priority,
    estimatedCargoValue: current.estimatedCargoValue,
    activeRouteId: routeIdValue,
  });

  const updated = {
    ...current,
    ...analysis,
    id: current.id,
    orgId: current.orgId,
    activeRouteId: routeIdValue,
    selectedRouteId: routeIdValue,
    route: routeIdValue,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };

  await db.collection("shipments").doc(current.id).set(updated);
  await recordAuditEvent({
    shipmentId: current.id,
    orgId: current.orgId,
    eventType: "route_approved",
    status: updated.status,
    actor: req.user.username,
    detail: `Approved route ${routeIdValue} for shipment ${current.id}.`,
    metadata: {
      activeRouteId: routeIdValue,
      recommendedRouteId: updated.recommendedRouteId,
      riskScore: updated.risk.score,
    },
  });
  res.json(updated);
}

app.patch("/shipments/:id", verifyAuth, asyncHandler(applyRouteChange));
app.patch("/shipments/:id/route", verifyAuth, asyncHandler(applyRouteChange));
app.post("/shipments/:id/route", verifyAuth, asyncHandler(applyRouteChange));

app.get("/shipments/:id/events", verifyAuth, asyncHandler(async (req, res) => {
  let query = db.collection("audit_events").where("shipmentId", "==", req.params.id);
  if (req.user.role !== "admin") {
    query = query.where("orgId", "==", req.user.orgId);
  }
  const snapshot = await query.get();
  const events = snapshot.docs
    .map((doc) => doc.data())
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
  res.json({ events });
}));

app.use((err, _req, res, _next) => {
  const status = Number(err?.statusCode || err?.status || 500);
  const message = err?.message || "Internal server error.";
  res.status(status).json({ error: message });
});

exports.api = onRequest(app);
