import React, { useState } from 'react';
import { Who5TrendPoint } from '../types';
import { Activity, Info } from 'lucide-react';

interface Who5TrendGraphProps {
  /** Points in ascending chronological order */
  points: Who5TrendPoint[];
  /** Compact mode shows fewer Y-axis labels, used inside dashboard card */
  compact?: boolean;
  onStartAssessment?: () => void;
}

// Color scale for WHO-5 score ranges
function scoreColor(score: number): string {
  if (score >= 72) return '#7C3AED'; // violet-700 — good
  if (score >= 50) return '#8B5CF6'; // violet-500 — moderate
  if (score >= 28) return '#F59E0B'; // amber-500 — low
  return '#EF4444';                  // red-500 — very low
}

function scoreLabel(score: number): string {
  if (score >= 72) return 'Good well-being';
  if (score >= 50) return 'Moderate';
  if (score >= 28) return 'Low well-being';
  return 'Very low';
}

export const Who5TrendGraph: React.FC<Who5TrendGraphProps> = ({
  points,
  compact = false,
  onStartAssessment,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // ── SVG geometry ────────────────────────────────────────────
  const svgWidth  = 640;
  const svgHeight = compact ? 180 : 230;
  const padLeft   = compact ? 50 : 60;
  const padRight  = 30;
  const padTop    = compact ? 20 : 28;
  const padBottom = compact ? 38 : 48;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Y: 0 at bottom, 100 at top
  const getY = (score: number) =>
    padTop + chartH - (score / 100) * chartH;

  // X: evenly spaced by index
  const getX = (idx: number) =>
    points.length === 1
      ? padLeft + chartW / 2
      : padLeft + (idx / (points.length - 1)) * chartW;

  // Y-axis reference lines
  const yRefs = compact
    ? [0, 50, 100]
    : [0, 25, 50, 75, 100];

  // ── Empty state ─────────────────────────────────────────────
  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center">
          <Activity className="w-7 h-7 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 font-display">
            No assessments recorded yet
          </p>
          <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
            Complete your first WHO-5 assessment to begin tracking your well-being over time.
          </p>
        </div>
        {onStartAssessment && (
          <button
            type="button"
            onClick={onStartAssessment}
            className="mt-1 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors cursor-pointer shadow-sm"
          >
            Start WHO-5 Assessment
          </button>
        )}
      </div>
    );
  }

  // ── Build path data ─────────────────────────────────────────
  const plotPoints = points.map((p, i) => ({
    x: getX(i),
    y: getY(p.score),
    score: p.score,
    label: p.label,
    dateStr: p.dateStr,
  }));

  const linePath = plotPoints
    .map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
    .join(' ');

  // Area fill
  const areaPath =
    plotPoints.length >= 2
      ? `${linePath} L ${plotPoints[plotPoints.length - 1].x} ${padTop + chartH} L ${plotPoints[0].x} ${padTop + chartH} Z`
      : '';

  const selectedPt = activeIdx !== null ? plotPoints[activeIdx] : null;

  return (
    <div className="flex flex-col w-full">
      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto select-none bg-gradient-to-b from-violet-50/30 to-white rounded-2xl p-2 border border-violet-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[420px]"
          aria-label="WHO-5 Well-Being Trend Graph"
        >
          <defs>
            <linearGradient id="who5LineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="who5AreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.01" />
            </linearGradient>
            <filter id="who5Shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Y-axis reference lines & labels */}
          {yRefs.map(ref => {
            const y = getY(ref);
            return (
              <g key={ref}>
                <line
                  x1={padLeft - 8}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={ref === 50 ? '#C4B5FD' : '#E5E7EB'}
                  strokeDasharray={ref === 50 ? '5 3' : '3 3'}
                  strokeWidth={ref === 50 ? 1.5 : 1}
                />
                <text
                  x={padLeft - 14}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-sans fill-gray-500"
                >
                  {ref}
                </text>
              </g>
            );
          })}

          {/* 50-point threshold label */}
          {!compact && (
            <text
              x={svgWidth - padRight + 4}
              y={getY(50) + 4}
              textAnchor="start"
              className="text-[10px] fill-violet-400 font-medium font-sans"
            >
              50
            </text>
          )}

          {/* Area fill (only if ≥2 points) */}
          {areaPath && (
            <path d={areaPath} fill="url(#who5AreaGrad)" />
          )}

          {/* Trend line (only if ≥2 points) */}
          {plotPoints.length >= 2 && (
            <g>
              {/* Glow */}
              <path
                d={linePath}
                fill="none"
                stroke="#8B5CF6"
                strokeOpacity="0.2"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Primary line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#who5LineGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Data points & X-axis labels */}
          {plotPoints.map((pt, idx) => {
            const isActive = activeIdx === idx;
            const color = scoreColor(pt.score);
            return (
              <g
                key={pt.dateStr}
                className="cursor-pointer group"
                onClick={() => setActiveIdx(idx === activeIdx ? null : idx)}
              >
                {/* Subtle vertical guide */}
                <line
                  x1={pt.x}
                  y1={padTop}
                  x2={pt.x}
                  y2={padTop + chartH}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />

                {/* Point */}
                <g filter="url(#who5Shadow)">
                  {isActive && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill={color}
                    stroke="#fff"
                    strokeWidth="2.5"
                    className="transition-transform group-hover:scale-125"
                  />
                  <circle cx={pt.x} cy={pt.y} r="3" fill="#fff" />
                </g>

                {/* Score label above point */}
                {!compact && (
                  <text
                    x={pt.x}
                    y={pt.y - 14}
                    textAnchor="middle"
                    className="text-[11px] font-bold font-sans fill-violet-700"
                  >
                    {pt.score}
                  </text>
                )}

                {/* X-axis date label */}
                <text
                  x={pt.x}
                  y={svgHeight - padBottom + 16}
                  textAnchor="middle"
                  className="text-[11px] font-sans fill-gray-600 font-medium"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 mt-2 px-1">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block shadow-xs" />
            <span className="font-medium text-gray-700">WHO-5 Score (0–100)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-violet-400 border-dashed border-violet-400" style={{ borderStyle: 'dashed', borderWidth: 1, height: 1 }} />
            <span className="text-violet-700 font-medium">50 = threshold</span>
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          {points.length} assessment{points.length !== 1 ? 's' : ''} recorded
        </span>
      </div>

      {/* Selected point detail card */}
      {selectedPt && (
        <div className="mt-3 p-4 rounded-2xl bg-white border border-violet-100 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-bold text-gray-950 font-display">
                {points[activeIdx!].label}
              </span>
              <span className="text-[11px] text-gray-400 ml-2">{points[activeIdx!].dateStr}</span>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
              style={{
                color: scoreColor(selectedPt.score),
                borderColor: scoreColor(selectedPt.score) + '55',
                background: scoreColor(selectedPt.score) + '15',
              }}
            >
              {selectedPt.score}/100 — {scoreLabel(selectedPt.score)}
            </span>
          </div>
          {selectedPt.score < 50 && (
            <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 rounded-xl p-2.5 border border-amber-100 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                A score below 50 may suggest that further support or conversation with a professional could be helpful. This is not a diagnosis.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
