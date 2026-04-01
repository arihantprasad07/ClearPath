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
}

export interface BackendShipmentRecord {
  id: string;
  sourceQuery: string;
  destinationQuery: string;
  source: { lat: number; lng: number; label?: string | null };
  destination: { lat: number; lng: number; label?: string | null };
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
  explanation?: {
    title: string;
    summary: string;
    cause: string;
    delayEstimate: string;
    recommendation: string;
    confidence: string;
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
  cost: string;
  reliability: string;
  riskScore: number;
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
  routes: RouteCardModel[];
  alert: string | null;
  backend: BackendShipmentRecord;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function parseError(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
  } catch {
    // Ignore parse failures and fall through to the fallback message.
  }

  return fallbackMessage;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, `Request failed: ${response.status}`));
  }

  return response.json() as Promise<T>;
}

function formatEta(delayText: string, hours: number) {
  return delayText || `${hours.toFixed(1)}h`;
}

function formatCurrency(value: number) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}\u20b9${rounded}`;
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
  const routeOptions = Object.values(record.routes.options);
  return {
    id: record.id,
    name: buildShipmentName(record),
    source: record.source.label?.split(',')[0]?.trim() || record.sourceQuery,
    destination: record.destination.label?.split(',')[0]?.trim() || record.destinationQuery,
    eta: formatEta(record.delay.text, record.delay.hours),
    riskLevel: mapRiskLevel(record.risk.level),
    currentRoute: record.routes.options[record.activeRouteId]?.name || record.recommendedRoute || record.activeRouteId,
    transporter: record.dispatchStatus?.status === 'queued' ? 'WhatsApp alert queued' : 'Awaiting dispatch channel',
    company: 'ClearPath Network',
    routes: routeOptions.map((route) => ({
      id: route.id,
      name: route.name,
      eta: `${route.eta.toFixed(1)}h`,
      cost: formatCurrency(route.cost),
      reliability: `${Math.round(route.reliability)}%`,
      riskScore: route.riskScore,
      isRecommended: route.id === record.routes.recommendedRouteId,
    })),
    alert: record.activeAlert?.message || record.alertMessage || record.alert?.message || null,
    backend: record,
  };
}

export async function login(username: string, password: string) {
  return request<AuthTokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchMe(token: string) {
  return request<AuthUser>('/auth/me', {}, token);
}

export async function exchangeFirebaseToken(idToken: string) {
  return request<FirebaseExchangeResponse>('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export async function fetchShipments(token: string) {
  const payload = await request<{ shipments: BackendShipmentRecord[] }>('/shipments', {}, token);
  return payload.shipments.map(mapShipmentRecord);
}

export async function createShipment(token: string, sourceQuery: string, destinationQuery: string) {
  const payload = await request<BackendShipmentRecord>(
    '/shipments',
    {
      method: 'POST',
      body: JSON.stringify({ sourceQuery, destinationQuery }),
    },
    token,
  );
  return mapShipmentRecord(payload);
}

export async function refreshShipment(token: string, shipmentId: string) {
  const payload = await request<BackendShipmentRecord>(
    `/shipments/${shipmentId}/refresh`,
    { method: 'POST' },
    token,
  );
  return mapShipmentRecord(payload);
}

export async function applyShipmentRoute(token: string, shipmentId: string, routeId: string) {
  const payload = await request<BackendShipmentRecord>(
    `/shipments/${shipmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ routeId }),
    },
    token,
  );
  return mapShipmentRecord(payload);
}
