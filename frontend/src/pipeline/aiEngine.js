import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-flash";

function getFallbackRiskAnalysis(data = {}) {
  const route = [data.origin, data.destination].filter(Boolean).join(" -> ") || "Mumbai -> Delhi";
  const weather = data.weather || "Heavy rainfall on NH-44";
  const traffic = data.traffic || "High congestion";
  const congestion = data.congestion || "Freight terminal delay spike";

  return {
    risk: {
      level: "HIGH",
      probability: 85,
    },
    delay: {
      hours: 6,
      reason: `${weather}, ${traffic}, and ${congestion} together create a high likelihood of a multi-hour delay on ${route}.`,
    },
    routes: [
      {
        routeName: "NH-48 Diversion",
        estimatedTime: 28,
        costImpact: 800,
        reliabilityScore: 94,
      },
      {
        routeName: "NH-27 Corridor",
        estimatedTime: 31,
        costImpact: 450,
        reliabilityScore: 81,
      },
      {
        routeName: "Western Freight Bypass",
        estimatedTime: 33,
        costImpact: 250,
        reliabilityScore: 74,
      },
    ],
    recommendation: {
      bestRoute: "NH-48 Diversion",
      reason: "This route offers the best balance of delay recovery, operational reliability, and manageable incremental cost under current disruption conditions.",
    },
    alerts: {
      english: `ClearPath Alert: High disruption risk detected on ${route}. Expected delay is about 6 hours. Recommended action: shift to NH-48 Diversion immediately.`,
      hindi: `ClearPath Alert: ${route} route par high risk hai. Lagbhag 6 ghante ki delay ho sakti hai. Best option: turant NH-48 Diversion use karein.`,
    },
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRoute(route, index) {
  return {
    routeName: route?.routeName || route?.name || `Alternate Route ${index + 1}`,
    estimatedTime: clamp(Number(route?.estimatedTime) || 0, 1, 240),
    costImpact: clamp(Number(route?.costImpact) || 0, 0, 100000),
    reliabilityScore: clamp(Number(route?.reliabilityScore) || 0, 1, 100),
  };
}

function normalizeRiskAnalysis(parsed, fallback) {
  const parsedRoutes = Array.isArray(parsed?.routes) ? parsed.routes.slice(0, 3).map(normalizeRoute) : [];
  const routes = parsedRoutes.length ? parsedRoutes : fallback.routes;

  return {
    risk: {
      level: ["LOW", "MEDIUM", "HIGH"].includes(parsed?.risk?.level) ? parsed.risk.level : fallback.risk.level,
      probability: clamp(Number(parsed?.risk?.probability) || fallback.risk.probability, 1, 100),
    },
    delay: {
      hours: clamp(Number(parsed?.delay?.hours) || fallback.delay.hours, 1, 72),
      reason: parsed?.delay?.reason?.trim() || fallback.delay.reason,
    },
    routes,
    recommendation: {
      bestRoute: parsed?.recommendation?.bestRoute?.trim() || routes[0].routeName || fallback.recommendation.bestRoute,
      reason: parsed?.recommendation?.reason?.trim() || fallback.recommendation.reason,
    },
    alerts: {
      english: parsed?.alerts?.english?.trim() || fallback.alerts.english,
      hindi: parsed?.alerts?.hindi?.trim() || fallback.alerts.hindi,
    },
  };
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Empty AI response");
  }

  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in AI response");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function buildPrompt(data) {
  const route = [data.origin, data.destination].filter(Boolean).join(" -> ") || "Unknown route";

  return `
You are an advanced AI supply chain risk analysis engine for Indian logistics operations.

INPUT DATA:
- Route: ${route}
- Origin: ${data.origin || "Unknown"}
- Destination: ${data.destination || "Unknown"}
- Weather: ${data.weather || "Unknown"}
- Traffic: ${data.traffic || "Unknown"}
- Congestion: ${data.congestion || "Unknown"}
- Timestamp: ${data.timestamp || Date.now()}

TASK:
Step 1: Risk Analysis
- Predict disruption risk as exactly one of: LOW, MEDIUM, HIGH.
- Include a probability from 0 to 100.
- You MUST combine weather, traffic, and congestion in the risk judgment.

Step 2: Delay Prediction
- Output a numeric delay in hours.
- Explain the delay using all three signals: weather, traffic, and congestion.
- Avoid generic reasoning. Give a direct operational explanation.

Step 3: Alternate Routes
- Generate EXACTLY 3 different routes.
- Route 1 must be the fastest option.
- Route 2 must be the cheapest option.
- Route 3 must be the most reliable option.
- Every route must include:
  - routeName
  - estimatedTime
  - costImpact
  - reliabilityScore
- Make the routes clearly distinguishable from each other.

Step 4: Recommendation
- Select one best route.
- Be decisive.
- Explain the tradeoff between time, cost, and reliability.
- Choose the route that is operationally best under the current disruption signals.

Step 5: Alerts
- english: short, professional, action-oriented.
- hindi: simple WhatsApp-style message.
- Both alerts MUST include numbers such as delay hours and the chosen route.

RULES:
- Return ONLY valid JSON.
- No markdown.
- No extra text outside JSON.
- Do NOT say "may be delayed".
- Use realistic numbers.
- Be specific and decisive.
- Keep the reasoning multi-signal, not based on a single factor.

OUTPUT FORMAT:
Return JSON with this exact structure:
{
  "risk": {
    "level": "HIGH",
    "probability": 85
  },
  "delay": {
    "hours": 6,
    "reason": "Heavy rainfall and terminal congestion are slowing line-haul movement and unloading."
  },
  "routes": [
    {
      "routeName": "NH-48 Diversion",
      "estimatedTime": 28,
      "costImpact": 800,
      "reliabilityScore": 94
    }
  ],
  "recommendation": {
    "bestRoute": "NH-48 Diversion",
    "reason": "Best balance of speed, reliability, and acceptable additional cost."
  },
  "alerts": {
    "english": "Professional logistics alert message",
    "hindi": "Simple WhatsApp style Hindi message"
  }
}
`.trim();
}

export async function analyzeRisk(data) {
  const fallback = getFallbackRiskAnalysis(data);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 1200,
      },
    });

    const result = await model.generateContent(buildPrompt(data));
    const response = await result.response;
    const rawText = response.text();
    const jsonText = extractJsonObject(rawText);
    const parsed = JSON.parse(jsonText);

    return normalizeRiskAnalysis(parsed, fallback);
  } catch {
    return fallback;
  }
}
