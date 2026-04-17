import { Activity, Anchor, BarChart2, Car, Cloud, type LucideIcon, Route } from 'lucide-react';

const SIGNAL_ICON_MAP: Record<string, LucideIcon> = {
  'imd weather': Cloud,
  'maps traffic': Car,
  'port feeds': Anchor,
  'nhai roads': Route,
  history: BarChart2,
};

export function getSignalIcon(name: string): LucideIcon {
  const normalized = name.trim().toLowerCase();
  if (SIGNAL_ICON_MAP[normalized]) return SIGNAL_ICON_MAP[normalized];
  if (normalized.includes('weather') || normalized.includes('rain') || normalized.includes('storm')) return Cloud;
  if (normalized.includes('traffic')) return Car;
  if (normalized.includes('port')) return Anchor;
  if (normalized.includes('nhai') || normalized.includes('road') || normalized.includes('highway')) return Route;
  if (normalized.includes('history') || normalized.includes('trend')) return BarChart2;
  return Activity;
}
