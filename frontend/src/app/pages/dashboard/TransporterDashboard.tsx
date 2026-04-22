import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCheck,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import RouteNetworkMap from "../../components/RouteNetworkMap";
import { PoweredByGeminiBadge } from "../../components/PoweredByGeminiBadge";
import { useAppContext } from "../../context/AppContext";
import {
  buildDisplayShipment,
  cardTone,
  DashboardHeader,
  DateTimePill,
  getOnTimeRate,
  getTimelineItems,
  LiveMonitoringPill,
  severityTone,
  sortShipments,
  statusTone,
} from "./dashboardShared";

export default function TransporterDashboard() {
  const {
    authLoading,
    authUser,
    preferredLanguage,
    refreshShipment,
    shipments,
    voiceAlertsEnabled,
    userRole,
  } = useAppContext();
  const navigate = useNavigate();
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = "My Routes — ClearPath";
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate("/");
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const sorted = useMemo(() => sortShipments(shipments), [shipments]);
  const displayShipments = useMemo(() => sorted.map((shipment) => buildDisplayShipment(shipment, null)), [sorted]);
  const latestShipment = displayShipments[0] ?? null;
  const routeUpdates = displayShipments.filter(
    (shipment) =>
      (shipment.displayRiskLevel === "high" || shipment.displayRiskLevel === "medium") &&
      !acknowledgedIds.includes(shipment.id),
  );
  const activeRuns = displayShipments.length;
  const riskAlerts = displayShipments.filter((shipment) => shipment.displayRiskLevel !== "low").length;
  const onTimeRate = getOnTimeRate(displayShipments);
  const timelineItems = useMemo(() => getTimelineItems(displayShipments, preferredLanguage), [displayShipments, preferredLanguage]);

  if (authLoading || !authUser || !userRole) return null;

  const handleAcknowledge = (shipmentId: string) => {
    setAcknowledgedIds((current) => [...current, shipmentId]);
    toast.success("Acknowledged", {
      description: "This route update has been cleared from your current view.",
    });
  };

  const handleRefresh = async (shipmentId: string) => {
    try {
      setRefreshingId(shipmentId);
      await refreshShipment(shipmentId);
      toast.success("Route status refreshed", {
        description: "Your latest route instructions have been synced.",
      });
    } catch (error) {
      toast.error("Refresh failed", {
        description: error instanceof Error ? error.message : "We could not refresh this route.",
      });
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <DashboardHeader
        username={authUser.username}
        title="Assigned routes, live tracking, and control updates."
        subtitle="Stay on the latest approved path and acknowledge new instructions as they arrive."
        roleIndicator={
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-200">
            <Truck className="h-3.5 w-3.5" />
            Transporter
          </span>
        }
        rightContent={
          <>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/18 bg-orange-400/10 px-4 py-2 text-sm text-orange-200">
              <Truck className="h-4 w-4" />
              Transporter View
            </div>
            <LiveMonitoringPill />
            <DateTimePill value={now} />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "My Active Runs", value: String(activeRuns), trend: "Assigned right now", icon: Truck, tone: "blue" as const },
          { label: "Risk Alerts on My Routes", value: String(riskAlerts), trend: riskAlerts > 0 ? "Monitor closely" : "All clear", icon: ShieldAlert, tone: "orange" as const, pulse: riskAlerts > 0 },
          { label: "On-Time Rate", value: `${onTimeRate}%`, trend: "Current route health", icon: TrendingUp, tone: "green" as const },
        ].map(({ label, value, trend, icon: Icon, tone, pulse }) => (
          <article key={label} className={`green-glow-hover rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.72)] ${pulse ? "green-pulse" : ""}`}>
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

      <section id="map" className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/46">Map panel</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Your assigned route - live tracking</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#AAFF45]/18 bg-[#AAFF45]/10 px-4 py-2 text-sm text-[#D9FF9B]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AAFF45]/65" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#AAFF45]" />
            </span>
            Live
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
          {latestShipment ? (
            <RouteNetworkMap shipment={latestShipment.backend} height={420} />
          ) : (
            <div className="grid min-h-[420px] place-items-center bg-[#0F0F0F] text-white/42">
              Your route map will appear here when a shipment is assigned to you.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article id="alerts" className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div>
            <p className="text-sm text-white/46">Route Updates from Control</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Follow the latest approved instructions</h2>
          </div>

          <div className="mt-5 space-y-3">
            {routeUpdates.length ? (
              routeUpdates.map((shipment) => {
                const recommendedRouteId = shipment.backend.decision.recommendedRouteId || shipment.backend.routes.recommendedRouteId;
                const recommendedRoute = shipment.backend.routes.options[recommendedRouteId];
                const activeRoute = shipment.backend.routes.options[shipment.backend.activeRouteId];
                const additionalCost = Math.max((recommendedRoute?.cost || 0) - (activeRoute?.cost || 0), 0);
                const hoursSaved = recommendedRoute?.timeSavedMinutes ? (recommendedRoute.timeSavedMinutes / 60).toFixed(1) : "0.0";
                const alreadyRerouted = shipment.backend.activeRouteId === shipment.backend.routes.recommendedRouteId;

                return (
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

                    <p className="mt-3 text-sm leading-7 text-white/66">{shipment.backend.statusMessage}</p>

                    {alreadyRerouted ? (
                      <div className="mt-4 rounded-[20px] border border-[#AAFF45]/28 bg-[#AAFF45]/10 px-4 py-4 text-sm text-[#D9FF9B]">
                        ✓ Rerouted - follow updated directions
                      </div>
                    ) : recommendedRoute ? (
                      <div className="mt-4 rounded-[20px] border border-[#AAFF45]/28 bg-[#AAFF45]/8 px-4 py-4 text-sm text-white/76">
                        <p className="font-medium text-[#D9FF9B]">
                          New route recommended by control: {recommendedRoute.name} - saves {hoursSaved} hrs, costs {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(additionalCost)} extra.
                        </p>
                        <p className="mt-2 text-white/56">Awaiting shipper approval.</p>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleAcknowledge(shipment.id)}
                      className="mt-4 rounded-full border border-white/14 bg-transparent px-4 py-2 text-sm text-white transition hover:border-white/25"
                    >
                      Mark as Acknowledged
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="grid min-h-[320px] place-items-center rounded-[24px] border border-dashed border-[#AAFF45]/26 bg-[#101010] p-6 text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#AAFF45]/25 bg-[#AAFF45]/10 text-[#AAFF45]">
                    <CheckCheck className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">No route changes. Stay on current path.</p>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/46">My Shipments</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Assigned deliveries</h2>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#101010] text-white/52">
                  <tr>
                    {["Shipment ID", "Route", "ETA", "Status", "Risk Score"].map((header) => (
                      <th key={header} className="px-4 py-4 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayShipments.length ? (
                    displayShipments.slice(0, 6).map((shipment, index) => (
                      <tr key={shipment.id} className={index % 2 === 0 ? "bg-[#141414]" : "bg-[#101010]"}>
                        <td className="px-4 py-4 font-medium text-white">
                          <Link to={`/shipment/${shipment.id}`} className="transition hover:text-[#AAFF45]">
                            {shipment.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-white/66">{shipment.source} to {shipment.destination}</td>
                        <td className="px-4 py-4 text-white/66">{shipment.eta}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(shipment.displayStatusLabel)}`}>
                            {shipment.displayStatusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white/66">{shipment.displayRiskScore}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-white/45">
                        No assigned shipments are available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/46">Route Updates Feed</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Recent control activity</h2>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {timelineItems.length ? (
              timelineItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative pl-10">
                    {index !== timelineItems.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%+12px)] w-px bg-[#AAFF45]/45" /> : null}
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
                Updates from control will appear here once your routes are active.
              </div>
            )}
          </div>
        </article>

        <section id="settings" className="rounded-[28px] border border-white/8 bg-[#111111] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div>
            <p className="text-sm text-white/46">Transporter Operations</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Driver-facing workspace notes</h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/62">
            <span className="rounded-full border border-white/10 bg-[#161616] px-4 py-2">Language: {preferredLanguage.toUpperCase()}</span>
            <span className="rounded-full border border-white/10 bg-[#161616] px-4 py-2">
              Voice alerts: {voiceAlertsEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/8 bg-[#141414] p-5 text-sm leading-7 text-white/68">
            Rerouting is managed by your shipper. You will be notified of any approved changes automatically.
          </div>
        </section>
      </section>

      <PoweredByGeminiBadge />
    </div>
  );
}
