import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Globe2,
  MapPinned,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import RouteNetworkMap from '../components/RouteNetworkMap';
import { useAppContext } from '../context/AppContext';
import { ShipmentViewModel } from '../lib/api';
import { getSignalIcon } from '../lib/signalIcons';

function TinyLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-[9px] font-mono uppercase tracking-[0.22em] ${dark ? 'text-white/60' : 'text-neutral-500'}`}>
      {children}
    </p>
  );
}

function ShellCard({
  children,
  dark = false,
  className = '',
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${
        dark ? 'border-black bg-[#181a23] text-white' : 'border-black/10 bg-white text-neutral-950'
      } ${className}`}
    >
      {children}
    </section>
  );
}

function StatTile({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: 'white' | 'lime' | 'dark';
  icon: React.ReactNode;
}) {
  const toneClass = {
    white: 'border-black/10 bg-white text-black',
    lime: 'border-[#b6d400] bg-[#DFFF00] text-black',
    dark: 'border-black bg-[#181a23] text-white',
  } as const;

  return (
    <div className={`rounded-[22px] border p-4 ${toneClass[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <TinyLabel dark={tone === 'dark'}>{title}</TinyLabel>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            tone === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-8 text-4xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function EmptyWorkspace({ isCompany }: { isCompany: boolean }) {
  return (
    <div className="rounded-[24px] border border-dashed border-black/15 bg-[#f7f7f3] p-6 sm:p-8">
      <TinyLabel>Workspace</TinyLabel>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
        Create the first lane to activate the decision surface.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
        Once a shipment is added, ClearPath will show live route geometry, signal pressure, AI reasoning, and the
        operator-ready next move in this workspace.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-black/10 bg-white p-4">
          <TinyLabel>Step 1</TinyLabel>
          <p className="mt-3 text-sm font-medium text-neutral-900">Add source and destination to create a monitored lane.</p>
        </div>
        <div className="rounded-[18px] border border-black/10 bg-white p-4">
          <TinyLabel>Step 2</TinyLabel>
          <p className="mt-3 text-sm font-medium text-neutral-900">Run analysis to generate route options and disruption scoring.</p>
        </div>
        <div className="rounded-[18px] border border-black/10 bg-white p-4">
          <TinyLabel>Step 3</TinyLabel>
          <p className="mt-3 text-sm font-medium text-neutral-900">
            Review the {isCompany ? 'company' : 'transport'} action flow and approve the next move.
          </p>
        </div>
      </div>
      <Link
        to="/add-shipment"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-white"
      >
        <Plus className="h-4 w-4" />
        Add lane
      </Link>
    </div>
  );
}

function ShipmentListCard({
  shipments,
  refreshingId,
  onRefresh,
}: {
  shipments: ShipmentViewModel[];
  refreshingId: string | null;
  onRefresh: (shipmentId: string) => void;
}) {
  return (
    <ShellCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <TinyLabel>Active lanes</TinyLabel>
          <h2 className="mt-1 text-xl font-semibold text-neutral-950">Live shipment cards</h2>
        </div>
        <span className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          {shipments.length} lanes
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {shipments.length ? (
          shipments.map((shipment) => {
            const riskTone =
              shipment.riskLevel === 'high'
                ? 'text-red-600'
                : shipment.riskLevel === 'medium'
                  ? 'text-amber-600'
                  : 'text-emerald-600';

            return (
              <div key={shipment.id} className="rounded-[20px] border border-black/10 bg-[#fafaf6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-950">{shipment.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {shipment.source} <span className="text-neutral-300">{'->'}</span> {shipment.destination}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRefresh(shipment.id)}
                    disabled={refreshingId === shipment.id}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
                    aria-label={`Refresh ${shipment.name}`}
                  >
                    <RefreshCw size={14} className={refreshingId === shipment.id ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full border border-current/15 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${riskTone}`}>
                    {shipment.riskLevel} risk
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                    {shipment.currentRoute}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                    {shipment.eta}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="line-clamp-2 text-sm leading-6 text-neutral-600">
                    {shipment.backend.explanation?.summary || shipment.backend.statusMessage}
                  </p>
                  <Link
                    to={`/shipment/${shipment.id}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-950"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fafaf6] px-4 py-10 text-center text-sm text-neutral-500">
            No lanes yet. Add a shipment to populate the workspace.
          </div>
        )}
      </div>
    </ShellCard>
  );
}

function roleCopy(isCompany: boolean) {
  return isCompany
    ? {
        eyebrow: 'Navigating the unknown',
        title: 'Shipment intelligence',
        description: 'A desktop decision layer for shippers to detect disruption early, compare route options, and approve action fast.',
        roleChip: 'Company view',
      }
    : {
        eyebrow: 'Navigating the unknown',
        title: 'Transport intelligence',
        description: 'A dispatch workspace for transport teams to understand lane risk, route advice, and field-ready alerts in one view.',
        roleChip: 'Transport view',
      };
}

export default function Dashboard() {
  const { authLoading, authUser, refreshShipment, shipments, shipmentsLoading, userRole } = useAppContext();
  const navigate = useNavigate();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Dashboard - ClearPath';
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate('/');
  }, [authLoading, authUser, navigate]);

  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return [...shipments].sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3));
  }, [shipments]);

  if (authLoading || !authUser || !userRole) return null;

  const isCompany = userRole === 'company';
  const copy = roleCopy(isCompany);
  const latestShipment = sorted[0] ?? null;
  const activeCount = sorted.length;
  const criticalCount = sorted.filter((shipment) => shipment.riskLevel === 'high').length;
  const aiCount = sorted.filter((shipment) => shipment.backend.explanation?.summary).length;
  const avgConfidence = activeCount
    ? Math.round(sorted.reduce((sum, shipment) => sum + (shipment.backend.decision.confidence || 0), 0) / activeCount)
    : 0;

  const topSignals = latestShipment?.backend.signalStack?.slice(0, 4) ?? [];
  const translations = latestShipment?.backend.alert?.translations;
  const primaryTranslation =
    translations?.en || translations?.hi || translations?.gu || translations?.ta || latestShipment?.alert || 'Alert preview will appear here after the first analysis.';

  const handleRefresh = async (shipmentId: string) => {
    try {
      setRefreshingId(shipmentId);
      await refreshShipment(shipmentId);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <div className="space-y-6">
            <ShellCard className="relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#DFFF00]/12 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="max-w-[240px]">
                    <TinyLabel>{copy.eyebrow}</TinyLabel>
                    <h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-tight text-neutral-950">
                      {copy.title}
                    </h1>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                      <Globe2 className="h-4 w-4 text-neutral-700" />
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                      <Sparkles className="h-4 w-4 text-neutral-700" />
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-neutral-600">{copy.description}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/add-shipment"
                    className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add lane
                  </Link>
                  <span className="rounded-full border border-black/10 bg-neutral-50 px-4 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                    {copy.roleChip}
                  </span>
                </div>
              </div>
            </ShellCard>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <StatTile title="Active lanes" value={String(activeCount)} tone="white" icon={<Package className="h-4 w-4" />} />
              <StatTile title="Critical now" value={String(criticalCount)} tone="lime" icon={<AlertTriangle className="h-4 w-4" />} />
              <StatTile title="AI analyzed" value={String(aiCount)} tone="lime" icon={<Brain className="h-4 w-4" />} />
              <StatTile title="Confidence" value={`${avgConfidence}%`} tone="dark" icon={<ShieldCheck className="h-4 w-4" />} />
            </div>

            <ShipmentListCard shipments={sorted.slice(0, 5)} refreshingId={refreshingId} onRefresh={handleRefresh} />
          </div>
        </div>

        <div className="xl:col-span-6">
          <div className="space-y-6">
            <ShellCard>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <TinyLabel>Desktop workspace</TinyLabel>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                    The route workspace expands when live lanes exist.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                    This canvas is designed to hold route geometry, AI reasoning, signal pressure, and operational
                    action in one desktop-first decision surface.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <TrendingUp className="h-4.5 w-4.5 text-neutral-700" />
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <Zap className="h-4.5 w-4.5 text-neutral-700" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[22px] border border-black/10 bg-[#f7f7f3] p-4">
                  <TinyLabel>Primary action</TinyLabel>
                  <p className="mt-4 text-lg font-semibold leading-8 text-neutral-950">
                    {latestShipment?.backend.decision.recommendedAction || 'Approve a safer alternate route before the current lane accumulates delay.'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-[#b6d400] bg-[#DFFF00] p-4">
                  <TinyLabel>Window</TinyLabel>
                  <p className="mt-4 text-3xl font-semibold text-black">
                    {latestShipment?.backend.predictionWindow?.label || 'Waiting'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-black bg-[#181a23] p-4 text-white">
                  <TinyLabel dark>Live route</TinyLabel>
                  <p className="mt-4 text-3xl font-semibold">{latestShipment?.currentRoute || 'Pending'}</p>
                </div>
              </div>

              <div className="mt-6">
                {latestShipment ? <RouteNetworkMap shipment={latestShipment.backend} height={360} /> : <EmptyWorkspace isCompany={isCompany} />}
              </div>
            </ShellCard>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <ShellCard>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <TinyLabel>{isCompany ? 'Transporter message' : 'Driver message'}</TinyLabel>
                    <h2 className="mt-1 text-xl font-semibold text-neutral-950">WhatsApp-ready alert copy</h2>
                  </div>
                  <Truck className="h-4 w-4 text-neutral-500" />
                </div>

                <div className="mt-5 rounded-[22px] border border-[#b6d400] bg-[#DFFF00] px-5 py-5 text-sm leading-7 text-black">
                  {primaryTranslation}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-black/10 bg-[#f7f7f3] p-4">
                    <TinyLabel>Delivery mode</TinyLabel>
                    <p className="mt-3 text-sm font-semibold text-neutral-950">
                      {latestShipment?.backend.architectureStatus?.deliveryModes?.join(', ') || 'dashboard_only'}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-black/10 bg-[#f7f7f3] p-4">
                    <TinyLabel>ETA</TinyLabel>
                    <p className="mt-3 text-sm font-semibold text-neutral-950">{latestShipment?.eta || 'n/a'}</p>
                  </div>
                </div>
              </ShellCard>

              <ShellCard dark>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <TinyLabel dark>AI reasoning</TinyLabel>
                    <h2 className="mt-1 text-xl font-semibold text-white">Reasoning snapshot</h2>
                  </div>
                  <Brain className="h-4 w-4 text-[#DFFF00]" />
                </div>

                <p className="mt-5 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white/80">
                  {latestShipment?.backend.explanation?.summary ||
                    latestShipment?.backend.statusMessage ||
                    'Create a lane to generate the first AI reasoning block.'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] bg-white/5 px-4 py-4">
                    <TinyLabel dark>Mode</TinyLabel>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {latestShipment?.backend.usedFallbackData ? 'Fallback' : 'Live'}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-white/5 px-4 py-4">
                    <TinyLabel dark>Score</TinyLabel>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {latestShipment ? `${latestShipment.backend.risk.score}%` : '0%'}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-white/5 px-4 py-4">
                    <TinyLabel dark>Detail</TinyLabel>
                    {latestShipment ? (
                      <Link to={`/shipment/${latestShipment.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#DFFF00]">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <p className="mt-3 text-sm font-semibold text-white">n/a</p>
                    )}
                  </div>
                </div>
              </ShellCard>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="space-y-6">
            <ShellCard dark className="min-h-[420px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <TinyLabel dark>Signal feed</TinyLabel>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Signals shaping the alert</h2>
                </div>
                <Zap className="h-4 w-4 text-[#DFFF00]" />
              </div>

              <div className="mt-5 space-y-3">
                {topSignals.length ? (
                  topSignals.map((signal) => {
                    const SignalIcon = getSignalIcon(signal.name);
                    const severity = Math.round(signal.severity * 100);

                    return (
                      <div key={signal.name} className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                              <SignalIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{signal.name}</p>
                              <p className="mt-1 text-xs leading-5 text-white/60">{signal.summary}</p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.18em] text-[#DFFF00]">
                            {severity}%
                          </span>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[#DFFF00]" style={{ width: `${severity}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/65">
                    Signals will appear after the first live analysis.
                  </div>
                )}
              </div>
            </ShellCard>

            <ShellCard>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <TinyLabel>Execution snapshot</TinyLabel>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-950">Ops console</h2>
                </div>
                <MapPinned className="h-4 w-4 text-neutral-500" />
              </div>

              <div className="mt-5 space-y-3 font-mono text-[11px] uppercase tracking-[0.18em]">
                <div className="flex items-center justify-between rounded-[18px] border border-black/10 bg-[#fafaf6] px-4 py-4">
                  <span className="text-neutral-500">Confidence</span>
                  <span className="text-neutral-950">{latestShipment?.backend.decision.confidence ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-black/10 bg-[#fafaf6] px-4 py-4">
                  <span className="text-neutral-500">Role</span>
                  <span className="text-neutral-950">{isCompany ? 'company' : 'transport'}</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-black/10 bg-[#fafaf6] px-4 py-4">
                  <span className="text-neutral-500">Analysis</span>
                  <span className="text-neutral-950">{shipmentsLoading ? 'syncing' : activeCount ? 'ready' : 'waiting'}</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] border border-black/10 bg-[#fafaf6] px-4 py-4">
                  <span className="text-neutral-500">Fallback</span>
                  <span className="text-neutral-950">{latestShipment?.backend.usedFallbackData ? 'yes' : 'no'}</span>
                </div>
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </div>
  );
}
