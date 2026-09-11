import React, { useState, useRef } from 'react';
import { ViewId, Who5Record, Who5TrendPoint, DailyCheckIn, WeeklyTrendDay } from '../types';
import {
  WHO5_QUESTIONS,
  WHO5_OPTIONS,
  calculateWho5Score,
  formatDateKey,
  formatDisplayDate,
  getCurrentWeekDays,
  MOOD_OPTIONS,
} from '../data/screeningData';
import { Who5TrendGraph } from '../components/Who5TrendGraph';
import { WeeklyMoodGraph } from '../components/WeeklyMoodGraph';
import {
  ClipboardCheck,
  BarChart2,
  Heart,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Info,
  Calendar,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface WellbeingViewProps {
  onNavigate: (view: ViewId) => void;
  who5Records: Who5Record[];
  onSaveWho5: (record: Who5Record) => void;
  checkIns: DailyCheckIn[];
  onOpenCheckIn: () => void;
  onOpenPreviousCheckIns: () => void;
  onOpenCrisis?: () => void;
}

type WellbeingSection = 'overview' | 'assessment' | 'who5-trend' | 'mood-trend';

const NULL_ANSWERS: (number | null)[] = [null, null, null, null, null];

export const WellbeingView: React.FC<WellbeingViewProps> = ({
  onNavigate,
  who5Records,
  onSaveWho5,
  checkIns,
  onOpenCheckIn,
  onOpenPreviousCheckIns,
  onOpenCrisis,
}) => {
  const [section, setSection] = useState<WellbeingSection>('overview');
  const [answers, setAnswers] = useState<(number | null)[]>([...NULL_ANSWERS]);
  const [submitted, setSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<{ raw: number; percent: number } | null>(null);

  const who5Ref = useRef<HTMLDivElement>(null);
  const moodRef = useRef<HTMLDivElement>(null);

  const todayKey = formatDateKey(new Date());
  const weeklyDays: WeeklyTrendDay[] = getCurrentWeekDays(checkIns, new Date());

  // Build WHO-5 trend points (chronological order)
  const who5TrendPoints: Who5TrendPoint[] = [...who5Records]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(r => ({
      label: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateStr: r.dateKey,
      score: r.percentScore,
    }));

  const latestWho5 = who5Records.length > 0
    ? [...who5Records].sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  const allAnswered = answers.every(a => a !== null);

  const handleSetAnswer = (qIdx: number, value: number) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[qIdx] = value;
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    const { raw, percent } = calculateWho5Score(answers);
    const now = new Date();
    const record: Who5Record = {
      id: `who5-${Date.now()}`,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateKey: formatDateKey(now),
      timestamp: now.getTime(),
      rawScore: raw,
      percentScore: percent,
      answers: answers as number[],
    };
    onSaveWho5(record);
    setLastResult({ raw, percent });
    setSubmitted(true);
  };

  const handleRestartAssessment = () => {
    setAnswers([...NULL_ANSWERS]);
    setSubmitted(false);
    setLastResult(null);
  };

  const scrollToWho5 = () => {
    setSection('who5-trend');
    setTimeout(() => who5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const scrollToMood = () => {
    setSection('mood-trend');
    setTimeout(() => moodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ─── Overview panel ─────────────────────────────────────────────────────────
  if (section === 'overview') {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-950 font-display">Well-Being Centre</h1>
            <p className="text-xs text-gray-500">Your personal well-being tracking hub</p>
          </div>
        </div>

        {/* WHO-5 Card */}
        <div className="bg-white rounded-3xl border border-violet-200/80 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white">
                WHO-5 Well-Being Index
              </span>
              <span className="text-white/60 text-xs">•</span>
              <span className="text-xs text-violet-100 font-medium">Validated Assessment</span>
            </div>
            <h2 className="text-xl font-bold font-display">WHO-5 Well-Being Assessment</h2>
            <p className="text-xs text-violet-100 mt-1 leading-relaxed max-w-lg">
              A brief, clinically validated questionnaire measuring your subjective well-being over the past two weeks. Score: 0–100 (higher = better reported well-being).
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Latest result or empty */}
            {latestWho5 ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet-50 border border-violet-100">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg font-display shrink-0">
                  {latestWho5.percentScore}
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 block">Last assessment</span>
                  <span className="text-sm font-bold text-gray-900 font-display block">
                    Score: {latestWho5.percentScore}/100 (raw {latestWho5.rawScore}/25)
                  </span>
                  <span className="text-[11px] text-gray-400">{latestWho5.date}</span>
                </div>
                {latestWho5.percentScore < 50 && (
                  <div className="ml-auto shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                      Below 50 — consider support
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600">No assessments completed yet.</p>
                <p className="text-xs text-gray-400 mt-0.5">Take your first WHO-5 to begin tracking.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                id="btn-start-who5"
                onClick={() => { setSection('assessment'); handleRestartAssessment(); }}
                className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs sm:text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Start WHO-5 Assessment</span>
              </button>

              <button
                type="button"
                id="btn-view-who5-trend"
                onClick={scrollToWho5}
                className="px-4 py-2.5 rounded-xl bg-violet-50 text-violet-800 border border-violet-200 text-xs sm:text-sm font-semibold hover:bg-violet-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-violet-600" />
                <span>View My Well-Being Trend</span>
              </button>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>
                <strong>Not a diagnosis:</strong> The WHO-5 is a screening tool, not a diagnostic instrument. It does not diagnose depression or any clinical condition. Results are personal and stored only on your device.
              </span>
            </div>
          </div>
        </div>

        {/* Daily Mood Check-in Card */}
        <div className="bg-white rounded-3xl border border-teal-200/80 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-sky-700 px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white">
                Daily Self Check-in
              </span>
              <span className="text-white/60 text-xs">•</span>
              <span className="text-xs text-teal-100 font-medium">Non-clinical · Personal reflection</span>
            </div>
            <h2 className="text-xl font-bold font-display">Daily Mood Check-in</h2>
            <p className="text-xs text-teal-100 mt-1 leading-relaxed max-w-lg">
              A simple daily self-reflection. Not related to or derived from the WHO-5 assessment. Scale: 1 (Very low) to 5 (Very good).
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Today's entry */}
            {checkIns.find(c => c.date === todayKey) ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-100">
                <div className="text-2xl">
                  {MOOD_OPTIONS.find(m => m.score === checkIns.find(c => c.date === todayKey)?.mood)?.emoji ?? '✅'}
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Today's mood recorded</span>
                  <span className="text-sm font-bold text-gray-900 font-display">
                    {checkIns.find(c => c.date === todayKey)?.moodLabel}
                  </span>
                </div>
                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200">
                  Logged
                </span>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No check-in yet today.</p>
                <p className="text-xs text-gray-400 mt-0.5">Take a moment to reflect on how you're feeling.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                id="btn-daily-mood-checkin"
                onClick={onOpenCheckIn}
                className="px-4 py-2.5 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-semibold hover:bg-teal-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Heart className="w-4 h-4" />
                <span>Daily Mood Check-in</span>
              </button>

              <button
                type="button"
                id="btn-view-mood-trend"
                onClick={scrollToMood}
                className="px-4 py-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs sm:text-sm font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>View 7-Day Mood Trend</span>
              </button>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>
                Daily mood values (1–5) are completely separate from WHO-5 scores. These are not converted to or derived from WHO-5 results. This graph is <strong>not clinically validated</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* WHO-5 Trend Section */}
        <div
          ref={who5Ref}
          id="who5-trend-section"
          className="bg-white rounded-3xl border border-violet-200/80 shadow-xs p-6 sm:p-7"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-violet-700 font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                  Periodic Assessment
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full border border-violet-200 font-medium">
                  Score 0–100
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-950 font-display">WHO-5 Well-Being Trend</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Validated well-being scores across all your completed WHO-5 assessments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSection('assessment'); handleRestartAssessment(); }}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </button>
          </div>

          <Who5TrendGraph
            points={who5TrendPoints}
            onStartAssessment={() => { setSection('assessment'); handleRestartAssessment(); }}
          />
        </div>

        {/* 7-Day Mood Trend Section */}
        <div
          ref={moodRef}
          id="mood-trend-section"
          className="bg-white rounded-3xl border border-teal-200/80 shadow-xs p-6 sm:p-7"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-teal-700 font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-teal-600" />
                  Daily Self Check-in
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200 font-medium">
                  Scale 1–5 · Non-clinical
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-950 font-display">7-Day Mood Trend</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Daily self-reported mood for the current week. Missing days are shown as absent — no values are invented.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCheckIn}
              className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Today's Check-in</span>
            </button>
          </div>

          {/* Scale legend */}
          <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
            {MOOD_OPTIONS.map(opt => (
              <span key={opt.score} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
                <span>{opt.emoji}</span>
                <span>{opt.score} = {opt.label}</span>
              </span>
            ))}
          </div>

          <WeeklyMoodGraph days={weeklyDays} onOpenCheckIn={onOpenCheckIn} />

          <p className="text-[11px] text-gray-400 mt-3 italic">
            ⚠ Mood scale (1–5) is entirely separate from WHO-5 scores (0–100). These are independent self-tracking tools and should not be confused.
          </p>
        </div>
      </div>
    );
  }

  // ─── Assessment Form ─────────────────────────────────────────────────────────
  if (section === 'assessment') {
    return (
      <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSection('overview')}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 font-display">
              WHO-5 Well-Being Assessment
            </h1>
            <p className="text-xs text-gray-500">5 questions • Takes about 1 minute</p>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-violet-50 border border-violet-200 text-xs text-violet-900">
          <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <strong>This is not a diagnostic test.</strong> The WHO-5 is a validated well-being screening tool. It does not diagnose depression, any disorder, or clinical condition. If you are in distress, please reach out to a professional.
            {onOpenCrisis && (
              <button
                type="button"
                onClick={onOpenCrisis}
                className="ml-2 underline text-violet-700 hover:text-violet-900 cursor-pointer"
              >
                Get crisis support →
              </button>
            )}
          </div>
        </div>

        {/* Result card (shown after submit) */}
        {submitted && lastResult ? (
          <div className="bg-white rounded-3xl border border-violet-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-950 font-display">Assessment Complete</h2>
              <p className="text-xs text-gray-500 mt-1">Your result has been saved to your well-being trend.</p>
            </div>

            {/* Score display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="bg-violet-50 border border-violet-200 rounded-2xl px-8 py-5 text-center">
                <span className="text-4xl font-bold text-violet-700 font-display block">{lastResult.percent}</span>
                <span className="text-xs text-gray-500 block mt-0.5">WHO-5 Score (out of 100)</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-5 text-center">
                <span className="text-4xl font-bold text-gray-700 font-display block">{lastResult.raw}</span>
                <span className="text-xs text-gray-500 block mt-0.5">Raw Score (out of 25)</span>
              </div>
            </div>

            {/* Supportive message */}
            {lastResult.percent < 50 ? (
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Your well-being may benefit from additional support.</strong>
                  A score below 50 can indicate that this period has felt heavier than usual. This is not a diagnosis. Speaking with a counsellor or trusted support person can make a meaningful difference.
                  {onOpenCrisis && (
                    <button
                      type="button"
                      onClick={onOpenCrisis}
                      className="block mt-2 underline text-amber-800 hover:text-amber-900 cursor-pointer"
                    >
                      View crisis & support resources →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-left">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Your well-being is in a positive range.</strong>
                  A score of 50 or above reflects a moderate to good sense of well-being over these two weeks. Keep nurturing what feels supportive.
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center pt-1">
              <button
                type="button"
                onClick={() => setSection('overview')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                <span>View My Well-Being Trend</span>
              </button>
              <button
                type="button"
                onClick={handleRestartAssessment}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Assessment</span>
              </button>
            </div>
          </div>
        ) : (
          /* Question form */
          <div className="space-y-5">
            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${(answers.filter(a => a !== null).length / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium shrink-0">
                {answers.filter(a => a !== null).length} / 5 answered
              </span>
            </div>

            {WHO5_QUESTIONS.map((q, qIdx) => {
              const selected = answers[qIdx];
              const isAnswered = selected !== null;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                    isAnswered ? 'border-violet-200' : 'border-gray-200'
                  }`}
                >
                  {/* Question header */}
                  <div className={`px-5 py-4 ${isAnswered ? 'bg-violet-50/50' : 'bg-gray-50/50'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                        isAnswered
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-500 border-gray-300'
                      }`}>
                        {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : q.id}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-0.5">
                          Question {q.id} · {q.topic}
                        </span>
                        <p className="text-sm sm:text-base font-medium text-gray-900 leading-snug">
                          {q.placeholder}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Response options */}
                  <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WHO5_OPTIONS.map(opt => {
                      const isSelected = selected === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSetAnswer(qIdx, opt.value)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50/50'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {opt.label}
                          </span>
                          <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                            Score: {opt.value} · {opt.sublabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Submit button */}
            <div className="sticky bottom-20 md:bottom-4 pt-2">
              <button
                type="button"
                id="btn-submit-who5"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  allAnswered
                    ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>
                  {allAnswered
                    ? 'Submit Assessment'
                    : `Answer all 5 questions to submit (${answers.filter(a => a !== null).length}/5 done)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback (WHO-5 trend or mood trend deep-link — handled by scrollIntoView from overview)
  return null;
};
