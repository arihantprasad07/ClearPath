import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock3,
  MapPinned,
  Package,
  Plus,
  RefreshCw,
  Route,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import RouteNetworkMap from "../components/RouteNetworkMap";
import { LanguageSelect } from "../components/LanguageSelect";
import { PoweredByGeminiBadge } from "../components/PoweredByGeminiBadge";
import { useAppContext } from "../context/AppContext";
import { ShipmentViewModel } from "../lib/api";

type DisplayShipment = ShipmentViewModel & {
  displayRiskScore: number;
  displayRiskLevel: ShipmentViewModel["riskLevel"];
  displayStatusLabel: string;
};

function getSimulationTarget(shipments: ShipmentViewModel[]) {
  return shipments[0] ?? null;
}

function buildDisplayShipment(
  shipment: ShipmentViewModel,
  simulatedShipmentId: string | null,
): DisplayShipment {
  const isSimulated = shipment.id === simulatedShipmentId;
  const displayRiskScore = isSimulated ? 85 : shipment.backend.risk.score;
  const displayRiskLevel = isSimulated ? "high" : shipment.riskLevel;
  const displayStatusLabel = isSimulated
    ? "HIGH RISK"
    : shipment.riskLevel === "high"
      ? "DELAYED"
      : shipment.riskLevel === "medium"
        ? "AT RISK"
        : shipment.backend.status === "stable"
          ? "DELIVERED"
          : "IN TRANSIT";

  return {
    ...shipment,
    riskLevel: displayRiskLevel,
    backend: {
      ...shipment.backend,
      risk: {
        ...shipment.backend.risk,
        score: displayRiskScore,
        level: displayRiskLevel === "high" ? "high" : shipment.backend.risk.level,
      },
      statusMessage: isSimulated
        ? "Storm on NH-44 detected. Shipment flagged HIGH RISK 18 hours ahead."
        : shipment.backend.statusMessage,
      activeAlert: isSimulated
        ? {
            message: "Storm on NH-44 detected. Shipment flagged HIGH RISK 18 hours ahead.",
            severity: "high",
            timestamp: new Date().toISOString(),
          }
        : shipment.backend.activeAlert,
    },
    displayRiskScore,
    displayRiskLevel,
    displayStatusLabel,
  };
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function cardTone(type: "blue" | "orange" | "green" | "purple") {
  return {
    blue: "text-sky-300 bg-sky-400/10 border-sky-400/18",
    orange: "text-orange-300 bg-orange-400/10 border-orange-400/18",
    green: "text-[#AAFF45] bg-[#AAFF45]/10 border-[#AAFF45]/18",
    purple: "text-violet-300 bg-violet-400/10 border-violet-400/18",
  }[type];
}

function severityTone(value: string) {
  if (value === "high") return "border-red-500/25 bg-red-500/12 text-red-200";
  if (value === "medium") return "border-orange-500/25 bg-orange-500/12 text-orange-200";
  return "border-yellow-500/25 bg-yellow-500/12 text-yellow-200";
}

function statusTone(label: string) {
  if (label === "DELIVERED") return "bg-[#AAFF45]/12 text-[#D9FF9B]";
  if (label === "DELAYED") return "bg-red-500/12 text-red-200";
  if (label === "AT RISK") return "bg-orange-500/12 text-orange-200";
  return "bg-sky-500/12 text-sky-200";
}

export default function Dashboard() {
  const {
    authLoading,
    authUser,
    preferredLanguage,
    refreshShipment,
    shipments,
    shipmentsLoading,
    updateShipmentRoute,
    userRole,
  } = useAppContext();
  const navigate = useNavigate();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [simulatedShipmentId, setSimulatedShipmentId] = useState<string | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = "Dashboard - ClearPath";
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate("/");
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return [...shipments].sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3));
  }, [shipments]);

  const displayShipments = useMemo(
    () => sorted.map((shipment) => buildDisplayShipment(shipment, simulatedShipmentId)),
    [simulatedShipmentId, sorted],
  );

  const latestShipment = displayShipments[0] ?? null;
  const activeAlerts = displayShipments.filter(
    (shipment) =>
      (shipment.displayRiskLevel === "high" || shipment.displayRiskLevel === "medium") &&
      !dismissedAlertIds.includes(shipment.id),
  );
  const activeShipments = displayShipments.length;
  const highRiskAlerts = displayShipments.filter((shipment) => shipment.displayRiskLevel === "high").length;
  const onTimeRate = activeShipments
    ? Math.max(72, 100 - Math.round(displayShipments.reduce((sum, shipment) => sum + shipment.displayRiskScore, 0) / activeShipments / 2))
    : 100;
  const disruptionsPrevented = displayShipments.filter((shipment) => shipment.displayRiskScore < 45).length + 12;

  const timelineItems = useMemo(
    () =>
      displayShipments.slice(0, 4).map((shipment, index) => ({
        id: shipment.id,
        timestamp: formatDateTime(new Date(shipment.backend.updatedAt || Date.now())),
        description:
          shipment.backend.alert?.translations?.[preferredLanguage] ||
          shipment.backend.alert?.translations?.en ||
          shipment.backend.statusMessage,
        detail: shipment.backend.explanation?.recommendation || shipment.backend.decision.recommendedAction,
        icon: index % 2 === 0 ? Sparkles : Route,
      })),
    [displayShipments, preferredLanguage],
  );

  useEffect(() => {
    if (!simulatedShipmentId) return;

    const timerId = window.setTimeout(() => {
      setSimulatedShipmentId(null);
    }, 8000);

    return () => window.clearTimeout(timerId);
  }, [simulatedShipmentId]);

  if (authLoading || !authUser || !userRole) return null;

  const handleRefresh = async (shipmentId: string) => {
    try {
      setRefreshingId(shipmentId);
      await refreshShipment(shipmentId);
      toast.success("Shipment refreshed", {
        description: "Latest risk signals and route recommendations have been synced.",
      });
    } catch (error) {
      toast.error("Refresh failed", {
        description: error instanceof Error ? error.message : "We could not refresh this shipment.",
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleApproveReroute = async (shipment: DisplayShipment) => {
    const recommendedRouteId = shipment.backend.decision.recommendedRouteId || shipment.backend.routes.recommendedRouteId;

    if (!recommendedRouteId || recommendedRouteId === shipment.backend.activeRouteId) {
      toast.message("No reroute required", {
        description: "This shipment is already on its recommended route.",
      });
      return;
    }

    try {
      await updateShipmentRoute(shipment.id, recommendedRouteId);
      toast.success("Reroute approved", {
        description: `${shipment.name} has been moved to the recommended lane.`,
      });
    } catch (error) {
      toast.error("Could not approve reroute", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDismissAlert = (shipmentId: string) => {
    setDismissedAlertIds((current) => [...current, shipmentId]);
    toast.success("Alert dismissed", {
      description: "The feed has been cleared for this shipment.",
    });
  };

  const handleSimulateRisk = () => {
    const target = getSimulationTarget(sorted);
    if (!target) return;
    setSimulatedShipmentId(target.id);
    toast.success("Storm simulation triggered", {
      description: "High-risk judge mode is active for the top shipment.",
    });
  };

  return (
    <div className="space-y-6 text-white">
      <section className="green-glow-hover rounded-[30px] border border-white/8 bg-[#111111] p-5 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.72)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-white/48">
              Good morning, <span className="font-semibold text-white">{authUser.username}</span>
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Premium AI operations for every active lane.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#AAFF45]/18 bg-[#AAFF45]/10 px-4 py-2 text-sm text-[#D9FF9B]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AAFF45]/65" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#AAFF45]" />
              </span>
              AI Monitoring Active
            </div>

            <LanguageSelect variant="header" id="dashboard-language" />

            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#161616] text-white/74 transition hover:border-[#AAFF45]/30 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {activeAlerts.length ? (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
              ) : null}
            </button>

            <div className="rounded-2xl border border-white/10 bg-[#161616] px-4 py-3 text-sm text-white/68">
              {formatDateTime(now)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active Shipments",
            value: String(activeShipments),
            trend: "+12% this week",
            icon: Package,
            tone: "blue" as const,
          },
          {
            label: "High Risk Alerts",
            value: String(highRiskAlerts),
            trend: highRiskAlerts > 0 ? "Needs attention now" : "No escalations",
            icon: ShieldAlert,
            tone: "orange" as const,
            pulse: highRiskAlerts > 0,
          },
          {
            label: "Avg On-Time Rate",
            value: `${onTimeRate}%`,
            trend: "+4.8% recovery",
            icon: TrendingUp,
            tone: "green" as const,
          },
          {
            label: "Disruptions Prevented",
            value: String(disruptionsPrevented),
            trend: "This month",
            icon: WandSparkles,
            tone: "purple" as const,
          },
        ].map(({ label, value, trend, icon: Icon, tone, pulse }) => (
          <article
            key={label}
            className={`green-glow-hover rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.72)] ${pulse ? "green-pulse" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/46">{label}</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{value}</p>
                <p className="mt-2 text-sm text-white/56">{trend}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 ${cardTone(tone)}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <article id="map" className="rounded-[30px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-white/46">Shipment Map Panel</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Live route intelligence</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#AAFF45]/18 bg-[#AAFF45]/10 px-4 py-2 text-sm text-[#D9FF9B]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AAFF45]/65" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#AAFF45]" />
                </span>
                Live
              </div>
              <button
                type="button"
                onClick={handleSimulateRisk}
                disabled={!displayShipments.length}
                className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-sm text-white/74 transition hover:border-[#AAFF45]/30 hover:text-white disabled:opacity-50"
              >
                Demo Risk Trigger
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
            {latestShipment ? (
              <RouteNetworkMap shipment={latestShipment.backend} height={420} />
            ) : (
              <div className="grid min-h-[420px] place-items-center bg-[#0F0F0F] text-white/42">
                Google Maps-style route preview will appear after the first shipment is created.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "On-track", tone: "bg-[#AAFF45]" },
              { label: "At-risk", tone: "bg-orange-400" },
              { label: "High-risk", tone: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#111111] px-3 py-2 text-xs text-white/62">
                <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                {item.label}
              </div>
            ))}
          </div>
        </article>

        <article id="alerts" className="rounded-[30px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/46">Risk feed</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Active Risk Alerts</h2>
            </div>
            <div className="rounded-full border border-red-500/18 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-red-200">
              {activeAlerts.length} live
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {activeAlerts.length ? (
              activeAlerts.slice(0, 5).map((shipment) => (
                <div key={shipment.id} className="rounded-[24px] border border-white/8 bg-[#101010] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${severityTone(shipment.displayRiskLevel)}`}>
                        {shipment.displayRiskLevel.toUpperCase()}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-white">{shipment.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRefresh(shipment.id)}
                      disabled={refreshingId === shipment.id}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#161616] text-white/70 transition hover:border-[#AAFF45]/30 hover:text-white"
                      aria-label={`Refresh ${shipment.id}`}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingId === shipment.id ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-white/66">
                    {shipment.backend.activeAlert?.message ||
                      shipment.backend.explanation?.why ||
                      shipment.backend.statusMessage}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveReroute(shipment)}
                      className="rounded-full bg-[#AAFF45] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#96f132]"
                    >
                      Approve Reroute
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissAlert(shipment.id)}
                      className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-white/66 transition hover:border-white/20 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid min-h-[320px] place-items-center rounded-[24px] border border-dashed border-[#AAFF45]/26 bg-[#101010] p-6 text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#AAFF45]/25 bg-[#AAFF45]/10 text-[#AAFF45]">
                    <CheckCheck className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">All shipments on track</p>
                  <p className="mt-2 text-sm text-white/52">No open alerts are competing for operator attention right now.</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article id="shipments" className="rounded-[30px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/46">Recent shipments</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Live monitoring table</h2>
            </div>
            <Link
              to="/add-shipment"
              className="inline-flex items-center gap-2 rounded-full bg-[#AAFF45] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#95f12f]"
            >
              <Plus className="h-4 w-4" />
              Add shipment
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#101010] text-white/52">
                  <tr>
                    {["Shipment ID", "Route", "Status", "ETA", "Risk Score", "Actions"].map((header) => (
                      <th key={header} className="px-4 py-4 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayShipments.length ? (
                    displayShipments.slice(0, 6).map((shipment, index) => (
                      <tr key={shipment.id} className={index % 2 === 0 ? "bg-[#141414]" : "bg-[#101010]"}>
                        <td className="px-4 py-4 font-medium text-white">{shipment.id.slice(0, 8)}</td>
                        <td className="px-4 py-4 text-white/66">
                          {shipment.source} to {shipment.destination}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(shipment.displayStatusLabel)}`}>
                            {shipment.displayStatusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white/66">{shipment.eta}</td>
                        <td className="px-4 py-4 text-white/66">{shipment.displayRiskScore}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleRefresh(shipment.id)}
                              disabled={refreshingId === shipment.id}
                              className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/68 transition hover:border-[#AAFF45]/30 hover:text-white"
                            >
                              Refresh
                            </button>
                            <Link
                              to={`/shipment/${shipment.id}`}
                              className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/68 transition hover:border-[#AAFF45]/30 hover:text-white"
                            >
                              Open
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-white/45">
                        No shipments yet. Create the first monitored lane to populate the dashboard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article id="timeline" className="rounded-[30px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/46">Disruption timeline</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">AI activity feed</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101010] px-4 py-2 text-sm text-white/66">
              <Clock3 className="h-4 w-4 text-[#AAFF45]" />
              22 languages
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {timelineItems.length ? (
              timelineItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative pl-10">
                    {index !== timelineItems.length - 1 ? (
                      <span className="absolute left-[15px] top-8 h-[calc(100%+12px)] w-px bg-[#AAFF45]/45" />
                    ) : null}
                    <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#AAFF45]/20 bg-[#AAFF45]/10 text-[#AAFF45]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/38">{item.timestamp}</p>
                    <p className="mt-2 text-sm leading-7 text-white/72">{item.description}</p>
                    <p className="mt-2 text-sm font-medium text-[#D9FF9B]">{item.detail}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#101010] p-6 text-center text-white/45">
                Activity will start appearing as soon as a shipment is analyzed.
              </div>
            )}
          </div>
        </article>
      </section>

      <section id="settings" className="rounded-[30px] border border-white/8 bg-[#111111] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/46">Operations notes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Workspace status</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/58">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#161616] px-4 py-2">
              <MapPinned className="h-4 w-4 text-[#AAFF45]" />
              {shipmentsLoading ? "Syncing routes" : "Routes synced"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#161616] px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-orange-300" />
              {userRole === "company" ? "Shipper view" : "Transporter view"}
            </span>
          </div>
        </div>
      </section>

      <PoweredByGeminiBadge />
    </div>
  );
}
