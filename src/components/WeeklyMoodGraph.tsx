import React, { useState } from 'react';
import { WeeklyTrendDay, Who5Record } from '../types';
import { WHO5_QUESTIONS, WHO5_OPTIONS, formatDateKey } from '../data/screeningData';
import { 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  Sparkles,
  Info 
} from 'lucide-react';

interface WeeklyMoodGraphProps {
  who5Records?: Who5Record[];
  days?: WeeklyTrendDay[];
  onStartAssessment?: () => void;
  onOpenCheckIn?: () => void;
}

// Y-Axis Scale Reference Levels (0 to 100 percentage score)
const SCALE_Y_LEVELS = [
  { score: 100, label: 'Optimal', sublabel: '100' },
  { score: 75,  label: 'Good',    sublabel: '75' },
  { score: 50,  label: 'Moderate',sublabel: '50' },
  { score: 25,  label: 'Low',     sublabel: '25' },
  { score: 0,   label: 'Very low',sublabel: '0' },
];

function getScoreStatus(score: number): { label: string; badgeClass: string; desc: string } {
  if (score >= 72) {
    return {
      label: 'Good Well-Being',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Positive psychological well-being and emotional vitality.'
    };
  }
  if (score >= 50) {
    return {
      label: 'Moderate Well-Being',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      desc: 'Balanced well-being above clinical screening threshold.'
    };
  }
  if (score >= 28) {
    return {
      label: 'Low Well-Being',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Noticeable stress or lower mood reported for this day.'
    };
  }
  return {
    label: 'Significantly Low Well-Being',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    desc: 'Elevated emotional strain indicated. Gentle self-care and support recommended.'
  };
}

/**
 * Generate chronological trend days for the selected range (7d or 30d) ending today.
 */
function generateTrendDays(
  who5Records: Who5Record[], 
  range: '7d' | '30d', 
  refDate = new Date()
): WeeklyTrendDay[] {
  const numDays = range === '7d' ? 7 : 30;
  const todayKey = formatDateKey(refDate);
  const days: WeeklyTrendDay[] = [];

  const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    d.setHours(12, 0, 0, 0);

    const dateStr = formatDateKey(d);
    const isToday = dateStr === todayKey;
    const isFuture = dateStr > todayKey;

    // Find latest matching record for this date
    const matching = who5Records
      .filter(r => r.dateKey === dateStr)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    days.push({
      dayName: shortNames[d.getDay()],
      fullDayName: `${fullNames[d.getDay()]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      dateStr,
      dayOfMonth: d.getDate(),
      isToday,
      isFuture,
      who5Record: matching,
    });
  }

  return days;
}

/**
 * Calculate chronological trend direction and descriptive summary text.
 */
function calculateTrend(recordedDays: WeeklyTrendDay[]) {
  const validRecords = recordedDays
    .map(d => d.who5Record)
    .filter((r): r is Who5Record => !!r && typeof r.percentScore === 'number');

  if (validRecords.length < 2) {
    return {
      direction: 'insufficient' as const,
      message: 'Complete more daily checks to see your trend.',
      badgeLabel: 'Baseline Tracking',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      Icon: Minus,
    };
  }

  const scores = validRecords.map(r => r.percentScore);
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const delta = lastScore - firstScore;

  // Split into first-half vs second-half for stable direction detection
  const mid = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, Math.max(1, mid));
  const secondHalf = scores.slice(Math.max(mid, scores.length - mid));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const avgDelta = avgSecond - avgFirst;

  if (avgDelta >= 5 || delta >= 8) {
    return {
      direction: 'improving' as const,
      message: 'Your well-being has generally improved over the selected period.',
      badgeLabel: 'Improving Trend',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: TrendingUp,
    };
  } else if (avgDelta <= -5 || delta <= -8) {
    return {
      direction: 'declining' as const,
      message: 'Your well-being has declined over the selected period.',
      badgeLabel: 'Declining Trend',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: TrendingDown,
    };
  } else {
    return {
      direction: 'stable' as const,
      message: 'Your well-being has remained relatively stable.',
      badgeLabel: 'Relatively Stable',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      Icon: Minus,
    };
  }
}

export const WeeklyMoodGraph: React.FC<WeeklyMoodGraphProps> = ({ 
  who5Records = [],
  days: propDays,
  onStartAssessment,
  onOpenCheckIn 
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  const handleTriggerAssessment = onStartAssessment || onOpenCheckIn;

  // Generate days based on selected time range
  const days: WeeklyTrendDay[] = who5Records.length > 0 || !propDays
    ? generateTrendDays(who5Records, timeRange)
    : propDays;

  // Compute trend metrics
  const trend = calculateTrend(days);
  const recordedCount = days.filter(d => d.who5Record).length;

  // SVG Chart Geometry
  const svgWidth = 640;
  const svgHeight = 230;
  const padLeft = 75;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const numDays = days.length;

  // Y Coordinate for 0–100 percentage score
  const getY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return padTop + chartHeight - (clamped / 100) * chartHeight;
  };

  // X Coordinate for Day Index (0 to numDays - 1)
  const getX = (index: number) => {
    if (numDays <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (numDays - 1)) * chartWidth;
  };

  // Group contiguous segments of days that have valid scores
  const segments: { index: number; x: number; y: number; score: number }[][] = [];
  let currentSegment: { index: number; x: number; y: number; score: number }[] = [];

  days.forEach((day, index) => {
    const rec = day.who5Record;
    if (rec && typeof rec.percentScore === 'number') {
      currentSegment.push({
        index,
        x: getX(index),
        y: getY(rec.percentScore),
        score: rec.percentScore
      });
    } else {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Active selected day for details card
  const selectedDay = activeDayIndex !== null && days[activeDayIndex]
    ? days[activeDayIndex] 
    : days.find(d => d.isToday && d.who5Record) || [...days].reverse().find(d => d.who5Record) || days.find(d => d.isToday) || days[0];

  const TrendIcon = trend.Icon;

  return (
    <div className="flex flex-col w-full">
      {/* ── Trend Summary Banner & Range Selector ────────────────────────── */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50/90 via-teal-50/20 to-sky-50/30 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-base shrink-0 shadow-2xs ${trend.badgeClass}`}>
            <TrendIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${trend.badgeClass}`}>
                {trend.badgeLabel}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {recordedCount} of {numDays} days completed ({timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 font-display">
              {trend.message}
            </p>
          </div>
        </div>

        {/* Time Range Selector Toggle */}
        <div className="flex items-center gap-1 self-start sm:self-center p-1 bg-white rounded-xl border border-gray-200 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setTimeRange('7d');
              setActiveDayIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === '7d'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => {
              setTimeRange('30d');
              setActiveDayIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === '30d'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* ── SVG Canvas ─────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-x-auto select-none bg-gradient-to-b from-gray-50/50 to-white rounded-2xl p-2 border border-gray-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[500px]"
          aria-label="Well-Being & Mood Trend Graph"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background Grid Lines & Scale Reference Labels */}
          {SCALE_Y_LEVELS.map(level => {
            const y = getY(level.score);
            const isCutoff = level.score === 50;
            return (
              <g key={level.score} className="text-gray-400">
                <line
                  x1={padLeft - 10}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={isCutoff ? '#94A3B8' : '#E5E7EB'}
                  strokeDasharray={isCutoff ? '5 3' : '4 4'}
                  strokeWidth={isCutoff ? '1.2' : '1'}
                />
                <text
                  x={padLeft - 14}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`text-[10px] font-sans font-medium ${
                    isCutoff ? 'fill-teal-700 font-semibold' : 'fill-gray-500'
                  }`}
                >
                  <tspan className="font-bold">{level.sublabel}</tspan>
                  <tspan className="text-[9px] fill-gray-400"> · {level.label}</tspan>
                </text>
              </g>
            );
          })}

          {/* Today Highlight Column */}
          {days.map((day, idx) => {
            if (!day.isToday) return null;
            const x = getX(idx);
            const colWidth = timeRange === '7d' ? 44 : 20;
            return (
              <g key="today-highlight">
                <rect
                  x={x - colWidth / 2}
                  y={padTop - 10}
                  width={colWidth}
                  height={chartHeight + 20}
                  rx={timeRange === '7d' ? 10 : 5}
                  fill="#0D9488"
                  fillOpacity="0.05"
                  stroke="#0D9488"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Line Segments between Contiguous Recorded Days */}
          {segments.map((seg, sIdx) => {
            if (seg.length < 2) return null;
            const pathD = seg.reduce((acc, pt, i) => {
              return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
            }, '');

            return (
              <g key={`seg-${sIdx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#0D9488"
                  strokeOpacity="0.2"
                  strokeWidth={timeRange === '7d' ? 6 : 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth={timeRange === '7d' ? 3 : 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Day Nodes & X-Axis Column Headers */}
          {days.map((day, idx) => {
            const x = getX(idx);
            const hasRecord = !!day.who5Record;
            const hasNumericScore = hasRecord && typeof day.who5Record?.percentScore === 'number';
            const y = hasNumericScore ? getY(day.who5Record!.percentScore) : null;
            const isSelected = selectedDay && selectedDay.dateStr === day.dateStr;

            // In 30-day view, show X-axis labels on selected ticks to prevent overcrowding
            const showXLabel = timeRange === '7d' || idx === 0 || idx === numDays - 1 || idx % 5 === 0 || day.isToday;

            return (
              <g
                key={day.dateStr}
                className="cursor-pointer group"
                onClick={() => setActiveDayIndex(idx)}
              >
                {/* Subtle vertical guide line */}
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartHeight}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />

                {/* Data Point Node */}
                {hasNumericScore && y !== null ? (
                  <g filter="url(#pointShadow)">
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r={timeRange === '7d' ? 14 : 10}
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="2.5"
                        strokeDasharray="3 3"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={timeRange === '7d' ? 7.5 : 5.5}
                      fill="#0D9488"
                      stroke="#FFFFFF"
                      strokeWidth={timeRange === '7d' ? 2.5 : 2}
                      className="transition-transform group-hover:scale-125"
                    />
                    <circle cx={x} cy={y} r={timeRange === '7d' ? 2.5 : 1.8} fill="#FFFFFF" />

                    {/* Score Label above Point */}
                    {(timeRange === '7d' || isSelected) && (
                      <text
                        x={x}
                        y={y - (timeRange === '7d' ? 12 : 9)}
                        textAnchor="middle"
                        className="text-[10px] font-bold font-display fill-teal-950 opacity-85 group-hover:opacity-100"
                      >
                        {day.who5Record!.percentScore}
                      </text>
                    )}
                  </g>
                ) : (
                  /* Missing Day (No Invented Data) */
                  <g opacity="0.6">
                    <circle
                      cx={x}
                      cy={padTop + chartHeight / 2}
                      r={timeRange === '7d' ? 4.5 : 3}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  </g>
                )}

                {/* X-Axis Labels */}
                {showXLabel && (
                  <>
                    <text
                      x={x}
                      y={svgHeight - padBottom + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-sans font-bold transition-colors ${
                        day.isToday
                          ? 'fill-teal-800'
                          : isSelected
                          ? 'fill-gray-900'
                          : 'fill-gray-500'
                      }`}
                    >
                      {timeRange === '7d' ? day.dayName : day.dayOfMonth}
                    </text>

                    {timeRange === '7d' && (
                      <text
                        x={x}
                        y={svgHeight - padBottom + 32}
                        textAnchor="middle"
                        className={`text-[10px] font-sans ${
                          day.isToday
                            ? 'fill-teal-700 font-bold'
                            : 'fill-gray-400 font-medium'
                        }`}
                      >
                        {day.dayOfMonth}
                      </text>
                    )}
                  </>
                )}

                {/* Today Pill */}
                {day.isToday && (
                  <rect
                    x={x - (timeRange === '7d' ? 13 : 8)}
                    y={svgHeight - padBottom + 36}
                    width={timeRange === '7d' ? 26 : 16}
                    height="3"
                    rx="1.5"
                    fill="#0D9488"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Non-Diagnostic Assurance */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 mt-2 px-1">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block shadow-2xs" />
            <span className="font-medium text-gray-700">Recorded Check-in</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400 inline-block" />
            <span>Unrecorded Day (No data invented)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-50 border border-teal-300 inline-block" />
            <span className="text-teal-800 font-semibold">Today</span>
          </span>
        </div>

        <span className="text-gray-400 text-[11px] italic">
          * Self-reflection trend · Not a clinical diagnosis
        </span>
      </div>

      {/* ── Interactive Inspector Card for Selected Day ───────────────── */}
      {selectedDay && (
        <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-gray-950 font-display">
                {selectedDay.fullDayName}
              </span>
              {selectedDay.isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  Today
                </span>
              )}
            </div>

            {selectedDay.who5Record ? (
              <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Check-in Recorded</span>
              </span>
            ) : (
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                No check-in entry
              </span>
            )}
          </div>

          {selectedDay.who5Record ? (
            (() => {
              const rec = selectedDay.who5Record;
              const status = getScoreStatus(rec.percentScore);
              return (
                <div className="space-y-3 text-xs">
                  {/* Score & Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-sm font-display">
                        {rec.percentScore}/100
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.badgeClass}`}>
                            {status.label}
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            Raw: {rec.rawScore}/25
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">{status.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* 5 Assessment Dimension Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {WHO5_QUESTIONS.map((q, idx) => {
                      const val = rec.answers && rec.answers[idx] !== undefined ? rec.answers[idx] : null;
                      const optLabel = val !== null ? WHO5_OPTIONS.find(o => o.value === val)?.label : 'Not recorded';
                      return (
                        <div key={q.id} className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Item {idx + 1}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-800 line-clamp-1 mt-0.5" title={q.topic}>
                              {q.topic}
                            </span>
                          </div>
                          <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-800 font-display">
                              {val !== null ? `${val} / 5` : '–'}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate max-w-[70px]" title={optLabel}>
                              {optLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500 py-1">
              <span>
                {selectedDay.isFuture
                  ? 'This day is in the future. You can check in when this day arrives.'
                  : selectedDay.isToday
                  ? 'No check-in recorded yet for today. Use the Daily Well-Being Check button above to log today\'s entry.'
                  : 'No check-in was recorded on this day. We keep it blank without guessing.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
