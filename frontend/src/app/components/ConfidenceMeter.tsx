import React from 'react';

export function renderArcPath(radius: number) {
  const centerX = radius + 6;
  const centerY = radius + 6;
  return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
}

export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const safeConfidence = Math.max(0, Math.min(100, confidence));
  const arcLength = Math.PI * 30;
  const dashOffset = arcLength - (arcLength * safeConfidence) / 100;
  const color = safeConfidence >= 75 ? '#22c55e' : safeConfidence >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative h-[56px] w-[92px]">
      <svg viewBox="0 0 72 42" className="h-full w-full" aria-hidden>
        <path d={renderArcPath(30)} fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
        <path
          d={renderArcPath(30)}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-lg font-semibold text-neutral-900">{safeConfidence}%</div>
      </div>
    </div>
  );
}
