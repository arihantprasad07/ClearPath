import React from 'react';
import { motion } from 'motion/react';
import { BackendShipmentRecord } from '../lib/api';

interface RouteNetworkMapProps {
  shipment: BackendShipmentRecord;
  className?: string;
  height?: number;
}

type Point = { x: number; y: number };

function projectPoint(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  width: number,
  height: number,
  padding: number,
): Point {
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.001);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return {
    x: padding + ((lng - bounds.minLng) / lngSpan) * usableWidth,
    y: padding + (1 - (lat - bounds.minLat) / latSpan) * usableHeight,
  };
}

function buildPath(points: Point[]) {
  if (!points.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
}

export default function RouteNetworkMap({ shipment, className = '', height = 260 }: RouteNetworkMapProps) {
  const routeOptions = Object.values(shipment.routes.options || {});
  const allPoints = routeOptions.flatMap((route) => route.waypoints || []);
  const width = 640;
  const padding = 30;

  if (!allPoints.length) {
    return (
      <div className={`rounded-[24px] border border-black/10 bg-[#f7f7f3] px-4 py-6 text-sm text-neutral-500 ${className}`}>
        Route geometry will appear here after analysis completes.
      </div>
    );
  }

  const lats = allPoints.map((point) => point.lat);
  const lngs = allPoints.map((point) => point.lng);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };

  const source = projectPoint(shipment.source.lat, shipment.source.lng, bounds, width, height, padding);
  const destination = projectPoint(shipment.destination.lat, shipment.destination.lng, bounds, width, height, padding);

  return (
    <div className={`overflow-hidden rounded-[28px] border border-black bg-[#181a23] shadow-sm ${className}`}>
      <div className="pointer-events-none absolute" aria-hidden />
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/65">Live lane view</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Route network</h3>
        </div>
        <div className="rounded-full border border-[#DFFF00]/35 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#F2FF9C]">
          {routeOptions.length} options
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Route options from ${shipment.source.label || shipment.sourceQuery} to ${shipment.destination.label || shipment.destinationQuery}`}>
          <defs>
            <pattern id="clearpath-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </pattern>
            <filter id="clearpath-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={width} height={height} rx="22" fill="#12141c" />
          <rect width={width} height={height} rx="22" fill="url(#clearpath-grid)" />

          {routeOptions.map((route) => {
            const projectedPoints = route.waypoints.map((point) => projectPoint(point.lat, point.lng, bounds, width, height, padding));
            const path = buildPath(projectedPoints);
            const isActive = route.id === shipment.activeRouteId;
            const isRecommended = route.id === shipment.routes.recommendedRouteId;
            const color = isRecommended ? '#DFFF00' : isActive ? '#FF8A65' : '#7DD3FC';
            const opacity = isRecommended || isActive ? 0.95 : 0.45;

            return (
              <g key={route.id}>
                <path d={path} fill="none" stroke={color} strokeWidth={isRecommended ? 8 : isActive ? 6 : 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} filter="url(#clearpath-glow)" />
                <path d={path} fill="none" stroke={color} strokeWidth={isRecommended ? 4.5 : isActive ? 3.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
                {projectedPoints.slice(1, -1).map((point, index) => (
                  <motion.circle
                    key={`${route.id}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    fill={color}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, r: [isRecommended ? 3.5 : 2.5, isRecommended ? 5.5 : 4.5, isRecommended ? 3.5 : 2.5], opacity: [0.7, 1, 0.7] }}
                    transition={{ scale: { delay: index * 0.15, type: 'spring' }, r: { repeat: Infinity, duration: 2, delay: index * 0.15 }, opacity: { repeat: Infinity, duration: 2, delay: index * 0.15 } }}
                  />
                ))}
              </g>
            );
          })}

          <motion.circle cx={source.x} cy={source.y} fill="#22C55E" initial={{ scale: 0 }} animate={{ scale: 1, r: [9, 11, 9] }} transition={{ scale: { type: 'spring' }, r: { repeat: Infinity, duration: 2 } }} />
          <motion.circle cx={source.x} cy={source.y} fill="rgba(34,197,94,0.18)" initial={{ scale: 0 }} animate={{ scale: 1, r: [16, 20, 16] }} transition={{ scale: { type: 'spring' }, r: { repeat: Infinity, duration: 2 } }} />
          <motion.circle cx={destination.x} cy={destination.y} fill="#F97316" initial={{ scale: 0 }} animate={{ scale: 1, r: [9, 11, 9] }} transition={{ scale: { delay: 0.1, type: 'spring' }, r: { repeat: Infinity, duration: 2, delay: 0.1 } }} />
          <motion.circle cx={destination.x} cy={destination.y} fill="rgba(249,115,22,0.18)" initial={{ scale: 0 }} animate={{ scale: 1, r: [16, 20, 16] }} transition={{ scale: { delay: 0.1, type: 'spring' }, r: { repeat: Infinity, duration: 2, delay: 0.1 } }} />

          <text x={source.x + 14} y={source.y - 10} fill="#E5E7EB" fontSize="13" fontFamily="monospace">
            Origin
          </text>
          <text x={destination.x + 14} y={destination.y - 10} fill="#E5E7EB" fontSize="13" fontFamily="monospace">
            Destination
          </text>
        </svg>

        <div className="mt-4 flex flex-wrap gap-2">
          {routeOptions.map((route) => {
            const isActive = route.id === shipment.activeRouteId;
            const isRecommended = route.id === shipment.routes.recommendedRouteId;
            return (
              <div
                key={route.id}
                className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${
                  isRecommended
                    ? 'border-[#DFFF00]/40 bg-[#DFFF00]/12 text-[#F2FF9C]'
                    : isActive
                      ? 'border-orange-300/50 bg-orange-400/10 text-orange-100'
                      : 'border-white/12 bg-white/5 text-white/70'
                }`}
              >
                {route.name}
                {isRecommended ? ' / recommended' : isActive ? ' / active' : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
