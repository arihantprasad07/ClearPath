import { runAI } from '../../lib/gemini';

export type UserRoleView = 'supplier' | 'company';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  stakeholderRole?: 'shipper' | 'transporter' | 'receiver' | 'admin';
  orgId?: string;
  phoneNumber?: string | null;
  deviceToken?: string | null;
  firebaseUid?: string | null;
  mfaEnabled?: boolean;
  createdAt: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export interface FirebaseExchangeResponse extends AuthTokenResponse {
  firebaseVerified: boolean;
}

export interface BackendRouteOption {
  id: string;
  name: string;
  description: string;
  eta: number;
  distanceKm: number;
  traffic: number;
  congestionIndex: number;
  cost: number;
  reliability: number;
  riskScore: number;
  weatherSeverity: number;
  waypoints: Array<{ lat: number; lng: number; label?: string | null }>;
  timeSavedMinutes: number;
  decisionFit: string;
  valueScore: number;
  recommendedFlag: boolean;
  tradeOff: string;
}

export interface BackendShipmentRecord {
  id: string;
  sourceQuery: string;
  destinationQuery: string;
  source: { lat: number; lng: number; label?: string | null };
  destination: { lat: number; lng: number; label?: string | null };
  priority?: 'standard' | 'express' | 'critical';
  estimatedCargoValue?: number | null;
  cargoType?: string | null;
  weightKg?: number | null;
  route: string;
  riskScore: number;
  status: 'monitoring' | 'stable' | 'risk_detected';
  activeRouteId: string;
  selectedRouteId: string;
  recommendedRouteId: string;
  recommendedRoute: string;
  routes: {
    recommendedRouteId: string;
    options: Record<string, BackendRouteOption>;
  };
  risk: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
  };
  delay: {
    hours: number;
    text: string;
    probability: number;
  };
  predictionWindow: {
    startHours: number;
    endHours: number;
    confidence: number;
    label: string;
  };
  cascadeImpact: {
    severity: 'low' | 'medium' | 'high';
    affectedOrders: number;
    slaRisk: string;
    summary: string;
  };
  explanation?: {
    headline: string;
    why: string;
    recommendation: string;
    confidence: 'High' | 'Medium' | 'Low' | string;
    urgency: 'Act now' | 'Monitor' | 'Low priority' | string;
    title: string;
    summary: string;
    cause: string;
    delayEstimate: string;
    reasoning: string[];
  };
  decision: {
    recommendedRouteId: string;
    recommendedRoute: string;
    recommendedAction: string;
    confidence: number;
    urgency?: string;
  };
  signalStack?: Array<{
    name: string;
    summary: string;
    severity: number;
    source: string;
    usedFallback: boolean;
  }>;
  architectureStatus?: {
    authMode: string;
    persistenceMode: string;
    analyticsMode: string;
    agentMode: string;
    executionMode?: string;
    deliveryModes: string[];
    stakeholderRoles: string[];
  };
  alert: {
    channel: string;
    headline: string;
    message: string;
    translations: Record<string, string>;
  };
  recommendation: string;
  statusMessage: string;
  usedFallbackData: boolean;
  responseTimeMs: number;
  dispatchStatus?: {
    status: string;
    reason?: string;
  } | null;
  activeAlert?: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
  } | null;
  alertMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouteCardModel {
  id: string;
  name: string;
  eta: string;
  etaHours: number;
  cost: string;
  costValue: number;
  reliability: string;
  reliabilityValue: number;
  riskScore: number;
  valueScore: number;
  tradeOff: string;
  isRecommended: boolean;
}

export interface ShipmentViewModel {
  id: string;
  name: string;
  source: string;
  destination: string;
  eta: string;
  riskLevel: 'low' | 'medium' | 'high';
  currentRoute: string;
  transporter: string;
  company: string;
  priority: 'standard' | 'express' | 'critical';
  routes: RouteCardModel[];
  alert: string | null;
  backend: BackendShipmentRecord;
}

export interface AuditEventRecord {
  id: string;
  eventType: string;
  status: string;
  actor: string;
  detail: string;
  createdAt: string;
  exportStatus: {
    status?: string;
    reason?: string;
  } | null;
}

export interface CreateShipmentPayload {
  source: string;
  destination: string;
  priority: 'standard' | 'express' | 'critical';
  estimatedCargoValue?: number | null;
}

const SHIPMENTS_STORAGE_KEY = 'clearpath-prototype-shipments';
const EVENTS_STORAGE_KEY = 'clearpath-prototype-events';
const TOKEN_PREFIX = 'clearpath-prototype-token:';
const DEFAULT_ORG_ID = 'clearpath-demo';

const CITY_LOOKUP: Record<string, { lat: number; lng: number; label: string }> = {
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai, Maharashtra, India' },
  delhi: { lat: 28.6139, lng: 77.209, label: 'Delhi, India' },
  surat: { lat: 21.1702, lng: 72.8311, label: 'Surat, Gujarat, India' },
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai, Tamil Nadu, India' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune, Maharashtra, India' },
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata, West Bengal, India' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad, Gujarat, India' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, Karnataka, India' },
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad, Telangana, India' },
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in prototype mode.
  }
}

function readShipments() {
  return safeRead<BackendShipmentRecord[]>(SHIPMENTS_STORAGE_KEY, []);
}

function writeShipments(shipments: BackendShipmentRecord[]) {
  safeWrite(SHIPMENTS_STORAGE_KEY, shipments);
}

function readEvents() {
  return safeRead<AuditEventRecord[]>(EVENTS_STORAGE_KEY, []);
}

function writeEvents(events: AuditEventRecord[]) {
  safeWrite(EVENTS_STORAGE_KEY, events);
}

function randomId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${random}`.toUpperCase();
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user';
}

function encodeToken(user: AuthUser) {
  return `${TOKEN_PREFIX}${btoa(JSON.stringify(user))}`;
}

function decodeToken(token: string): AuthUser {
  if (!token.startsWith(TOKEN_PREFIX)) {
    throw new Error('Invalid prototype session.');
  }
  const payload = token.slice(TOKEN_PREFIX.length);
  return JSON.parse(atob(payload)) as AuthUser;
}

function formatEta(delayText: string, hours: number) {
  return delayText || `${hours.toFixed(1)}h`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashNumber(value: string) {
  return Array.from(value).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}

function mapRiskLevel(level: BackendShipmentRecord['risk']['level']): ShipmentViewModel['riskLevel'] {
  if (level === 'critical' || level === 'high') return 'high';
  if (level === 'medium') return 'medium';
  return 'low';
}

function buildShipmentName(record: BackendShipmentRecord) {
  const source = record.source.label?.split(',')[0]?.trim() || record.sourceQuery;
  const destination = record.destination.label?.split(',')[0]?.trim() || record.destinationQuery;
  return `${source} to ${destination}`;
}

export function mapShipmentRecord(record: BackendShipmentRecord): ShipmentViewModel {
  const routeOptions = Object.values(record.routes.options).sort((left, right) => {
    if (left.recommendedFlag && !right.recommendedFlag) return -1;
    if (!left.recommendedFlag && right.recommendedFlag) return 1;
    return left.riskScore - right.riskScore || left.eta - right.eta;
  });

  return {
    id: record.id,
    name: buildShipmentName(record),
    source: record.source.label?.split(',')[0]?.trim() || record.sourceQuery,
    destination: record.destination.label?.split(',')[0]?.trim() || record.destinationQuery,
    eta: formatEta(record.delay.text, record.delay.hours),
    riskLevel: mapRiskLevel(record.risk.level),
    currentRoute: record.routes.options[record.activeRouteId]?.name || record.recommendedRoute || record.activeRouteId,
    transporter: record.dispatchStatus?.status === 'queued' ? 'AI handoff queued' : 'Awaiting driver acknowledgement',
    company: 'ClearPath Network',
    priority: record.priority || 'standard',
    routes: routeOptions.map((route) => ({
      id: route.id,
      name: route.name,
      eta: `${route.eta.toFixed(1)}h`,
      etaHours: route.eta,
      cost: formatCurrency(route.cost),
      costValue: route.cost,
      reliability: `${Math.round(route.reliability)}%`,
      reliabilityValue: route.reliability,
      riskScore: route.riskScore,
      valueScore: route.valueScore || 0,
      tradeOff: route.tradeOff || route.decisionFit,
      isRecommended: route.recommendedFlag || route.id === record.routes.recommendedRouteId,
    })),
    alert: record.activeAlert?.message || record.alertMessage || record.alert?.message || null,
    backend: record,
  };
}

function normalizeStakeholderRole(role?: string): AuthUser['stakeholderRole'] {
  if (role === 'transporter' || role === 'receiver' || role === 'admin') return role;
  return 'shipper';
}

function buildUser(username: string, role: 'admin' | 'operator', stakeholderRole: AuthUser['stakeholderRole'], firebaseUid?: string | null): AuthUser {
  return {
    id: firebaseUid || `user-${slugify(username)}`,
    username: username.trim().toLowerCase(),
    role,
    stakeholderRole,
    orgId: DEFAULT_ORG_ID,
    phoneNumber: null,
    deviceToken: null,
    firebaseUid: firebaseUid ?? null,
    mfaEnabled: false,
    createdAt: nowIso(),
  };
}

function getAuthUser(token: string) {
  return decodeToken(token);
}

function buildFallbackLocation(query: string) {
  const cleaned = query.trim().toLowerCase();
  const known = CITY_LOOKUP[cleaned];
  if (known) return known;
  const hash = Math.abs(hashNumber(cleaned || 'india'));
  return {
    lat: Number((8 + (hash % 2300) / 100).toFixed(4)),
    lng: Number((68 + ((hash >> 5) % 2800) / 100).toFixed(4)),
    label: `${query.trim()}, India`,
  };
}

function buildRouteSet(source: { lat: number; lng: number; label?: string | null }, destination: { lat: number; lng: number; label?: string | null }) {
  const distanceSeed = Math.abs(hashNumber(`${source.label}:${destination.label}`));
  const baseDistance = 180 + (distanceSeed % 780);
  const midpointLat = Number(((source.lat + destination.lat) / 2).toFixed(4));
  const midpointLng = Number(((source.lng + destination.lng) / 2).toFixed(4));

  return [
    {
      id: 'primary',
      name: 'Primary corridor',
      description: 'Current corridor with the shortest driver familiarity.',
      eta: Number((baseDistance / 47).toFixed(1)),
      distanceKm: baseDistance,
      traffic: 0.66,
      congestionIndex: 72,
      weatherSeverity: 0.45,
      waypoints: [
        { lat: source.lat, lng: source.lng, label: source.label },
        { lat: midpointLat, lng: midpointLng, label: 'Primary waypoint' },
        { lat: destination.lat, lng: destination.lng, label: destination.label },
      ],
    },
    {
      id: 'secondary',
      name: 'Balanced reroute',
      description: 'Less crowded highway mix with steadier recovery margin.',
      eta: Number(((baseDistance * 1.05) / 54).toFixed(1)),
      distanceKm: Number((baseDistance * 1.05).toFixed(1)),
      traffic: 0.44,
      congestionIndex: 51,
      weatherSeverity: 0.36,
      waypoints: [
        { lat: source.lat, lng: source.lng, label: source.label },
        { lat: Number((midpointLat + 0.18).toFixed(4)), lng: Number((midpointLng - 0.12).toFixed(4)), label: 'Balanced waypoint' },
        { lat: destination.lat, lng: destination.lng, label: destination.label },
      ],
    },
    {
      id: 'express',
      name: 'Fastest detour',
      description: 'Premium bypass that protects ETA at a higher operating cost.',
      eta: Number(((baseDistance * 0.94) / 56).toFixed(1)),
      distanceKm: Number((baseDistance * 0.94).toFixed(1)),
      traffic: 0.39,
      congestionIndex: 43,
      weatherSeverity: 0.32,
      waypoints: [
        { lat: source.lat, lng: source.lng, label: source.label },
        { lat: Number((midpointLat - 0.14).toFixed(4)), lng: Number((midpointLng + 0.16).toFixed(4)), label: 'Express waypoint' },
        { lat: destination.lat, lng: destination.lng, label: destination.label },
      ],
    },
  ];
}

function buildFallbackAnalysis(input: {
  sourceQuery: string;
  destinationQuery: string;
  priority: CreateShipmentPayload['priority'];
  estimatedCargoValue?: number | null;
  routes: ReturnType<typeof buildRouteSet>;
}) {
  const priorityOffset = input.priority === 'critical' ? 16 : input.priority === 'express' ? 8 : 0;
  const recommendedRoute = [...input.routes].sort((a, b) => a.traffic - b.traffic || a.eta - b.eta)[0];
  const activeRoute = input.routes[0];
  const riskScore = clamp(Math.round(activeRoute.traffic * 62 + activeRoute.weatherSeverity * 34 + priorityOffset), 18, 94);
  const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const delayHours = Number((activeRoute.eta * (0.12 + activeRoute.traffic * 0.45)).toFixed(1));
  const recommendation = `Switch to ${recommendedRoute.name} to protect the delivery window.`;

  return {
    riskScore,
    riskLevel,
    statusMessage:
      riskLevel === 'high' || riskLevel === 'critical'
        ? `Risk is building on the active lane from ${input.sourceQuery} to ${input.destinationQuery}.`
        : `This lane is stable for now, but ClearPath is still watching for disruption patterns.`,
    recommendation,
    explanation:
      riskLevel === 'high' || riskLevel === 'critical'
        ? `Traffic pressure and weather variability are stacking on the current corridor. ${recommendedRoute.name} gives the team more recovery margin without losing too much time.`
        : `Signals look manageable right now, with no severe disruption pattern visible on the corridor.`,
    alertTranslations: {
      en: `Risk detected on ${input.sourceQuery} to ${input.destinationQuery}. ${recommendation}`,
      hi: `${input.sourceQuery} se ${input.destinationQuery} route par risk mila. ${recommendation}`,
      gu: `${input.sourceQuery} thi ${input.destinationQuery} route par jokham dekhay chhe. ${recommendation}`,
      ta: `${input.sourceQuery} முதல் ${input.destinationQuery} வரை செல்லும் பாதையில் ஆபத்து உள்ளது. ${recommendation}`,
      mr: `${input.sourceQuery} ते ${input.destinationQuery} मार्गावर धोका दिसत आहे. ${recommendation}`,
    },
    recommendedRouteId: recommendedRoute.id,
    delayHours,
  };
}

async function generateAIAnalysis(input: {
  sourceQuery: string;
  destinationQuery: string;
  priority: CreateShipmentPayload['priority'];
  estimatedCargoValue?: number | null;
  routes: ReturnType<typeof buildRouteSet>;
}) {
  const fallback = buildFallbackAnalysis(input);

  try {
    const prompt = `
You are ClearPath, a hackathon logistics copilot for India.
Return strict JSON only with these keys:
- riskScore (number 0-100)
- riskLevel ("low" | "medium" | "high")
- statusMessage
- recommendation
- explanation
- recommendedRouteId ("primary" | "secondary" | "express")
- delayHours (number)
- alertTranslations { en, hi, gu, ta, mr }

Shipment:
- source: ${input.sourceQuery}
- destination: ${input.destinationQuery}
- priority: ${input.priority}
- estimatedCargoValue: ${input.estimatedCargoValue ?? 'unknown'}

Route options:
${JSON.stringify(input.routes, null, 2)}
`;

    const raw = await runAI(prompt);
    const normalized = raw.trim().replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(normalized) as Partial<typeof fallback>;
    return {
      riskScore: clamp(Number(parsed.riskScore ?? fallback.riskScore), 0, 100),
      riskLevel: parsed.riskLevel === 'high' || parsed.riskLevel === 'medium' ? parsed.riskLevel : 'low',
      statusMessage: parsed.statusMessage || fallback.statusMessage,
      recommendation: parsed.recommendation || fallback.recommendation,
      explanation: parsed.explanation || fallback.explanation,
      recommendedRouteId:
        parsed.recommendedRouteId === 'secondary' || parsed.recommendedRouteId === 'express' || parsed.recommendedRouteId === 'primary'
          ? parsed.recommendedRouteId
          : fallback.recommendedRouteId,
      delayHours: Number(parsed.delayHours ?? fallback.delayHours) || fallback.delayHours,
      alertTranslations: {
        en: parsed.alertTranslations?.en || fallback.alertTranslations.en,
        hi: parsed.alertTranslations?.hi || fallback.alertTranslations.hi,
        gu: parsed.alertTranslations?.gu || fallback.alertTranslations.gu,
        ta: parsed.alertTranslations?.ta || fallback.alertTranslations.ta,
        mr: parsed.alertTranslations?.mr || fallback.alertTranslations.mr,
      },
    };
  } catch {
    return fallback;
  }
}

function buildPredictionWindow(riskScore: number) {
  if (riskScore >= 70) {
    return { startHours: 6, endHours: 8, confidence: 86, label: '6-8 hour disruption window' };
  }
  if (riskScore >= 45) {
    return { startHours: 8, endHours: 12, confidence: 72, label: '8-12 hour watch window' };
  }
  return { startHours: 12, endHours: 24, confidence: 64, label: '12-24 hour watch window' };
}

function buildSignalStack(routes: ReturnType<typeof buildRouteSet>, usedFallbackData: boolean) {
  return [
    {
      name: 'Traffic model',
      summary: `Prototype traffic score is tracking ${Math.round(routes[0].traffic * 100)}% congestion on the current lane.`,
      severity: Number(routes[0].traffic.toFixed(2)),
      source: 'local_model',
      usedFallback: usedFallbackData,
    },
    {
      name: 'Weather pattern',
      summary: 'Weather pressure is estimated from corridor heuristics and Gemini route reasoning.',
      severity: Number(routes[0].weatherSeverity.toFixed(2)),
      source: 'gemini_frontend',
      usedFallback: usedFallbackData,
    },
    {
      name: 'Lane alternatives',
      summary: 'Three route options were compared to find the safest next move for the operator.',
      severity: 0.35,
      source: 'local_model',
      usedFallback: false,
    },
  ];
}

async function buildShipmentRecord(
  shipment: CreateShipmentPayload,
  source: { lat: number; lng: number; label?: string | null },
  destination: { lat: number; lng: number; label?: string | null },
  activeRouteId = 'primary',
  existingId?: string,
  existingCreatedAt?: string,
): Promise<BackendShipmentRecord> {
  const startedAt = performance.now();
  const routes = buildRouteSet(source, destination);
  const ai = await generateAIAnalysis({
    sourceQuery: shipment.source,
    destinationQuery: shipment.destination,
    priority: shipment.priority,
    estimatedCargoValue: shipment.estimatedCargoValue ?? null,
    routes,
  });

  const routeOptions = Object.fromEntries(
    routes.map((route) => {
      const isRecommended = route.id === ai.recommendedRouteId;
      const riskScore = clamp(Math.round(route.traffic * 58 + route.weatherSeverity * 34 + (isRecommended ? -10 : 6)), 10, 98);
      return [
        route.id,
        {
          id: route.id,
          name: route.name,
          description: route.description,
          eta: route.eta,
          distanceKm: route.distanceKm,
          traffic: route.traffic,
          congestionIndex: route.congestionIndex,
          cost: Math.round(route.distanceKm * 17 + (route.id === 'express' ? 3800 : route.id === 'secondary' ? 1600 : 900)),
          reliability: Math.round(clamp(98 - riskScore * 0.6, 48, 97)),
          riskScore,
          weatherSeverity: route.weatherSeverity,
          waypoints: route.waypoints,
          timeSavedMinutes: Math.max(0, Math.round((routes[0].eta - route.eta) * 60)),
          decisionFit: isRecommended ? 'Best balance of resilience and speed.' : 'Usable alternate corridor with trade-offs.',
          valueScore: Math.round(clamp(100 - riskScore + (isRecommended ? 12 : 0), 20, 100)),
          recommendedFlag: isRecommended,
          tradeOff:
            route.id === 'express'
              ? 'Faster corridor with higher operating cost.'
              : route.id === 'secondary'
                ? 'Calmer route with a small ETA trade-off.'
                : 'Direct lane with the highest disruption exposure.',
        } satisfies BackendRouteOption,
      ];
    }),
  );

  const activeRoute = routeOptions[activeRouteId] || routeOptions.primary;
  const recommendedRoute = routeOptions[ai.recommendedRouteId] || routeOptions.secondary || activeRoute;
  const riskScore = clamp(ai.riskScore, 0, 100);
  const predictionWindow = buildPredictionWindow(riskScore);
  const delayHours = Number(ai.delayHours.toFixed(1));
  const status = riskScore >= (shipment.priority === 'critical' ? 55 : shipment.priority === 'express' ? 62 : 68) ? 'risk_detected' : 'stable';
  const timestamp = nowIso();

  return {
    id: existingId || randomId('SHP'),
    sourceQuery: shipment.source,
    destinationQuery: shipment.destination,
    source,
    destination,
    priority: shipment.priority,
    estimatedCargoValue: shipment.estimatedCargoValue ?? null,
    cargoType: null,
    weightKg: null,
    route: activeRoute.id,
    riskScore,
    status,
    activeRouteId: activeRoute.id,
    selectedRouteId: activeRoute.id,
    recommendedRouteId: recommendedRoute.id,
    recommendedRoute: recommendedRoute.name,
    routes: {
      recommendedRouteId: recommendedRoute.id,
      options: routeOptions,
    },
    risk: {
      score: riskScore,
      level: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
    },
    delay: {
      hours: delayHours,
      text: `${delayHours.toFixed(1)}h`,
      probability: Number(clamp(0.22 + riskScore / 125, 0.12, 0.94).toFixed(2)),
    },
    predictionWindow,
    cascadeImpact: {
      severity: riskScore >= 70 ? 'high' : riskScore >= 45 ? 'medium' : 'low',
      affectedOrders: Math.max(2, Math.round(2 + riskScore / 18)),
      slaRisk: riskScore >= 70 ? 'Miss likely without reroute' : riskScore >= 45 ? 'Promise window at risk' : 'Monitor closely',
      summary: `If this lane slips, downstream customer commitments may be affected. ClearPath is surfacing this early so the team can act before the delivery window breaks.`,
    },
    explanation: {
      headline: ai.statusMessage,
      why: ai.explanation,
      recommendation: ai.recommendation,
      confidence: riskScore >= 70 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low',
      urgency: riskScore >= 70 ? 'Act now' : riskScore >= 45 ? 'Monitor' : 'Low priority',
      title: ai.statusMessage,
      summary: ai.explanation,
      cause: `Prototype AI analysis for ${shipment.source} to ${shipment.destination}.`,
      delayEstimate: `${delayHours.toFixed(1)}h`,
      reasoning: [ai.statusMessage, ai.explanation, ai.recommendation],
    },
    decision: {
      recommendedRouteId: recommendedRoute.id,
      recommendedRoute: recommendedRoute.name,
      recommendedAction: ai.recommendation,
      confidence: Math.round(clamp(48 + riskScore * 0.42, 35, 96)),
      urgency: riskScore >= 70 ? 'act_now' : riskScore >= 45 ? 'review' : 'monitor',
    },
    signalStack: buildSignalStack(routes, !import.meta.env.VITE_GEMINI_API_KEY),
    architectureStatus: {
      authMode: import.meta.env.VITE_AUTH_MODE || 'prototype_local',
      persistenceMode: 'browser_local_storage',
      analyticsMode: 'none',
      agentMode: 'gemini_frontend',
      executionMode: 'firebase_hosting_only',
      deliveryModes: ['dashboard_only'],
      stakeholderRoles: ['Shipper', 'Transporter', 'Receiver'],
    },
    alert: {
      channel: 'dashboard',
      headline: 'Predictive disruption alert',
      message: ai.alertTranslations.en,
      translations: ai.alertTranslations,
    },
    recommendation: ai.recommendation,
    statusMessage: ai.statusMessage,
    usedFallbackData: !import.meta.env.VITE_GEMINI_API_KEY,
    responseTimeMs: Math.round(performance.now() - startedAt),
    dispatchStatus: {
      status: 'dashboard_only',
      reason: 'spark_plan_prototype',
    },
    activeAlert:
      status === 'risk_detected'
        ? {
            message: ai.alertTranslations.en,
            severity: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'medium',
            timestamp,
          }
        : null,
    alertMessage: status === 'risk_detected' ? ai.alertTranslations.en : null,
    createdAt: existingCreatedAt || timestamp,
    updatedAt: timestamp,
  };
}

function recordEvent(event: Omit<AuditEventRecord, 'id' | 'createdAt' | 'exportStatus'>) {
  const nextEvent: AuditEventRecord = {
    ...event,
    id: randomId('EVT'),
    createdAt: nowIso(),
    exportStatus: null,
  };
  const events = readEvents();
  writeEvents([nextEvent, ...events]);
}

export async function login(username: string, _password: string) {
  const role: AuthUser['role'] = username.trim().toLowerCase() === 'admin' ? 'admin' : 'operator';
  const user = buildUser(username, role, role === 'admin' ? 'admin' : 'shipper');
  return {
    accessToken: encodeToken(user),
    tokenType: 'bearer',
    user,
  } satisfies AuthTokenResponse;
}

export async function fetchMe(token: string) {
  return getAuthUser(token);
}

export async function exchangeFirebaseToken(idToken: string) {
  const user = buildUser(
    `firebase-${idToken.slice(0, 6)}`,
    'operator',
    'shipper',
    `firebase-${idToken.slice(0, 12)}`,
  );
  return {
    accessToken: encodeToken(user),
    tokenType: 'bearer',
    user,
    firebaseVerified: true,
  } satisfies FirebaseExchangeResponse;
}

export async function fetchShipments(_token: string) {
  return readShipments()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(mapShipmentRecord);
}

export async function geocodeLocation(_token: string, query: string) {
  if (query.trim().length < 2) {
    throw new Error('Location query must be at least 2 characters.');
  }
  return buildFallbackLocation(query);
}

export async function createShipment(_token: string, shipment: CreateShipmentPayload) {
  const source = await geocodeLocation('', shipment.source);
  const destination = await geocodeLocation('', shipment.destination);
  const record = await buildShipmentRecord(shipment, source, destination);
  const shipments = readShipments();
  writeShipments([record, ...shipments]);
  recordEvent({
    eventType: 'shipment_created',
    status: record.status,
    actor: 'operator',
    detail: `Created a prototype lane from ${shipment.source} to ${shipment.destination}.`,
  });
  return mapShipmentRecord(record);
}

export async function refreshShipment(_token: string, shipmentId: string) {
  const shipments = readShipments();
  const current = shipments.find((item) => item.id === shipmentId);
  if (!current) {
    throw new Error('Shipment not found.');
  }

  const refreshed = await buildShipmentRecord(
    {
      source: current.sourceQuery,
      destination: current.destinationQuery,
      priority: current.priority || 'standard',
      estimatedCargoValue: current.estimatedCargoValue ?? null,
    },
    current.source,
    current.destination,
    current.activeRouteId,
    current.id,
    current.createdAt,
  );

  writeShipments(shipments.map((item) => (item.id === shipmentId ? refreshed : item)));
  recordEvent({
    eventType: 'shipment_refreshed',
    status: refreshed.status,
    actor: 'operator',
    detail: `Re-ran Gemini analysis for ${current.sourceQuery} to ${current.destinationQuery}.`,
  });
  return mapShipmentRecord(refreshed);
}

export async function applyShipmentRoute(_token: string, shipmentId: string, routeId: string) {
  const shipments = readShipments();
  const current = shipments.find((item) => item.id === shipmentId);
  if (!current) {
    throw new Error('Shipment not found.');
  }
  if (!current.routes.options[routeId]) {
    throw new Error('Route not found for shipment.');
  }

  const updated = await buildShipmentRecord(
    {
      source: current.sourceQuery,
      destination: current.destinationQuery,
      priority: current.priority || 'standard',
      estimatedCargoValue: current.estimatedCargoValue ?? null,
    },
    current.source,
    current.destination,
    routeId,
    current.id,
    current.createdAt,
  );

  updated.selectedRouteId = routeId;
  updated.activeRouteId = routeId;
  updated.route = routeId;

  writeShipments(shipments.map((item) => (item.id === shipmentId ? updated : item)));
  recordEvent({
    eventType: 'route_approved',
    status: updated.status,
    actor: 'operator',
    detail: `Approved ${updated.routes.options[routeId].name} for ${current.sourceQuery} to ${current.destinationQuery}.`,
  });
  return mapShipmentRecord(updated);
}

export async function fetchAuditEvents(_token: string, _shipmentId: string): Promise<AuditEventRecord[]> {
  return readEvents();
}
