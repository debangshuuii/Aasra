import React, { useState } from 'react';
import { WeeklyTrendDay } from '../types';
import { MOOD_OPTIONS } from '../data/screeningData';
import { Calendar, HelpCircle, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

interface WeeklyMoodGraphProps {
  days: WeeklyTrendDay[];
  onOpenCheckIn?: () => void;
}

export const WeeklyMoodGraph: React.FC<WeeklyMoodGraphProps> = ({ days, onOpenCheckIn }) => {
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  // SVG Chart Geometry
  const svgWidth = 640;
  const svgHeight = 230;
  const padLeft = 85;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 45;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Y Coordinate for Mood score (1 to 5)
  const getY = (score: number) => {
    // score 5 at padTop (30), score 1 at padTop + chartHeight (185)
    return padTop + chartHeight - ((score - 1) / 4) * chartHeight;
  };

  // X Coordinate for Day Index (0 to 6)
  const getX = (index: number) => {
    return padLeft + (index / 6) * chartWidth;
  };

  // Group contiguous segments of days that have valid numeric mood scores
  // Strict rule: do not connect across missing days or "prefer not to say"
  const segments: { index: number; x: number; y: number; score: number }[][] = [];
  let currentSegment: { index: number; x: number; y: number; score: number }[] = [];

  days.forEach((day, index) => {
    if (day.checkIn && typeof day.checkIn.mood === 'number') {
      currentSegment.push({
        index,
        x: getX(index),
        y: getY(day.checkIn.mood),
        score: day.checkIn.mood
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

  // Active selected day for details card (default to today if has check-in or last recorded)
  const selectedDay = activeDayIndex !== null 
    ? days[activeDayIndex] 
    : days.find(d => d.isToday && d.checkIn) || [...days].reverse().find(d => d.checkIn) || days.find(d => d.isToday) || days[0];

  const recordedCount = days.filter(d => d.checkIn).length;

  return (
    <div className="flex flex-col w-full">
      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto select-none bg-gradient-to-b from-gray-50/50 to-white rounded-2xl p-2 border border-gray-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[500px]"
          aria-label="Weekly Mood Trend Graph"
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

          {/* Background Grid Lines & Mood Labels */}
          {MOOD_OPTIONS.slice().reverse().map(mood => {
            const y = getY(mood.score);
            return (
              <g key={mood.score} className="text-gray-400">
                {/* Subtle horizontal gridline */}
                <line
                  x1={padLeft - 10}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                {/* Y-axis Mood Label & Emoji */}
                <text
                  x={padLeft - 16}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-sans fill-gray-500 font-medium"
                >
                  <tspan className="text-[12px]">{mood.emoji} </tspan>
                  <tspan>{mood.label.split(' ')[0]}</tspan>
                </text>
              </g>
            );
          })}

          {/* Today Highlight Column */}
          {days.map((day, idx) => {
            if (!day.isToday) return null;
            const x = getX(idx);
            return (
              <g key="today-highlight">
                <rect
                  x={x - 22}
                  y={padTop - 10}
                  width="44"
                  height={chartHeight + 20}
                  rx="10"
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
                {/* Thick background line for glow */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#0D9488"
                  strokeOpacity="0.2"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Primary Trend Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Day Nodes & X-Axis Column Headers */}
          {days.map((day, idx) => {
            const x = getX(idx);
            const hasCheckIn = !!day.checkIn;
            const hasNumericMood = hasCheckIn && typeof day.checkIn?.mood === 'number';
            const y = hasNumericMood ? getY(day.checkIn!.mood!) : null;
            const isSelected = selectedDay && selectedDay.dateStr === day.dateStr;

            return (
              <g
                key={day.dateStr}
                className="cursor-pointer group"
                onClick={() => setActiveDayIndex(idx)}
              >
                {/* Vertical subtle guide */}
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartHeight}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />

                {/* Data Point Node */}
                {hasNumericMood && y !== null ? (
                  <g filter="url(#pointShadow)">
                    {/* Pulsing selection ring */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="2.5"
                        strokeDasharray="3 3"
                      />
                    )}
                    {/* Node base circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r="7.5"
                      fill="#0D9488"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-125"
                    />
                    {/* Inner core */}
                    <circle cx={x} cy={y} r="2.5" fill="#FFFFFF" />
                  </g>
                ) : hasCheckIn && day.checkIn?.mood === null ? (
                  /* Answered "Prefer not to say" */
                  <g>
                    <circle
                      cx={x}
                      cy={padTop + chartHeight / 2}
                      r="7"
                      fill="#F3F4F6"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={x}
                      y={padTop + chartHeight / 2 + 3}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-gray-500 font-sans"
                    >
                      ?
                    </text>
                  </g>
                ) : (
                  /* Missing Day (No Invented Data) */
                  <g opacity="0.6">
                    <circle
                      cx={x}
                      cy={padTop + chartHeight / 2}
                      r="4.5"
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  </g>
                )}

                {/* X-Axis Labels */}
                <text
                  x={x}
                  y={svgHeight - padBottom + 18}
                  textAnchor="middle"
                  className={`text-xs font-sans font-bold transition-colors ${
                    day.isToday
                      ? 'fill-teal-800'
                      : isSelected
                      ? 'fill-gray-900'
                      : 'fill-gray-500'
                  }`}
                >
                  {day.dayName}
                </text>

                <text
                  x={x}
                  y={svgHeight - padBottom + 32}
                  textAnchor="middle"
                  className={`text-[11px] font-sans ${
                    day.isToday
                      ? 'fill-teal-700 font-bold'
                      : 'fill-gray-400 font-medium'
                  }`}
                >
                  {day.dayOfMonth}
                </text>

                {/* Today Small Pill */}
                {day.isToday && (
                  <rect
                    x={x - 13}
                    y={svgHeight - padBottom + 36}
                    width="26"
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

      {/* Legend & Missing Day Assurance */}
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

        <span className="text-gray-400 text-[11px]">
          {recordedCount} of 7 days completed this week
        </span>
      </div>

      {/* Interactive Inspector Card for Selected Day */}
      {selectedDay && (
        <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-gray-950 font-display">
                {selectedDay.fullDayName}, {selectedDay.dateStr}
              </span>
              {selectedDay.isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  Today
                </span>
              )}
            </div>

            {selectedDay.checkIn ? (
              <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                Check-in Recorded
              </span>
            ) : (
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                No check-in entry
              </span>
            )}
          </div>

          {selectedDay.checkIn ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Mood</span>
                <span className="font-bold text-gray-900 text-xs flex items-center gap-1 mt-0.5">
                  {selectedDay.checkIn.mood !== null ? (
                    <>
                      <span>{MOOD_OPTIONS.find(m => m.score === selectedDay.checkIn?.mood)?.emoji}</span>
                      <span className="truncate">{selectedDay.checkIn.moodLabel.split('/')[0].trim()}</span>
                    </>
                  ) : (
                    <span className="text-gray-500 font-normal">Prefer not to say</span>
                  )}
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Energy</span>
                <span className="font-semibold text-gray-900 block mt-0.5 truncate" title={selectedDay.checkIn.energyLevel || 'Not recorded'}>
                  {selectedDay.checkIn.energyLevel ? selectedDay.checkIn.energyLevel.split('/')[0].trim() : 'Stable'}
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Mental Clarity</span>
                <span className="font-semibold text-gray-900 block mt-0.5 truncate" title={selectedDay.checkIn.mentalClarity || 'Not recorded'}>
                  {selectedDay.checkIn.mentalClarity ? selectedDay.checkIn.mentalClarity.split('/')[0].trim() : 'Steady'}
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Nervous System</span>
                <span className="font-semibold text-gray-900 block mt-0.5 truncate" title={selectedDay.checkIn.stressLevel}>
                  {selectedDay.checkIn.stressLevel.split('/')[0].trim()}
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Sleep Rest</span>
                <span className="font-semibold text-gray-900 block mt-0.5 truncate" title={selectedDay.checkIn.sleepQuality}>
                  {selectedDay.checkIn.sleepQuality.split('/')[0].trim()}
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Connection</span>
                <span className="font-semibold text-gray-900 block mt-0.5 truncate" title={selectedDay.checkIn.feltSupported}>
                  {selectedDay.checkIn.feltSupported.split('/')[0].trim()}
                </span>
              </div>

              {selectedDay.checkIn.notes && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-6 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100 text-xs text-teal-950">
                  <span className="font-bold text-teal-800 mr-1">Reflection:</span>
                  <span className="italic">{selectedDay.checkIn.notes}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500 py-1">
              <span>
                {selectedDay.isFuture
                  ? 'This day is in the future. You can check in when this day arrives.'
                  : 'No check-in was recorded on this day. We keep it blank without guessing.'}
              </span>
              {selectedDay.isToday && onOpenCheckIn && (
                <button
                  type="button"
                  onClick={onOpenCheckIn}
                  className="px-3 py-1.5 rounded-lg bg-black text-white font-semibold text-xs hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Complete Today's Check-in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
