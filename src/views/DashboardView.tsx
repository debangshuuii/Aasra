import React from 'react';
import { ViewId, AssessmentRecord, Who5Record } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  getCurrentWeekDays, 
  formatDateKey 
} from '../data/screeningData';
import { WeeklyMoodGraph } from '../components/WeeklyMoodGraph';
import { 
  PlusCircle, 
  History, 
  ToggleLeft, 
  ArrowRight, 
  Check, 
  Bot, 
  Wind, 
  ShieldCheck, 
  PhoneCall,
  Activity,
  Heart,
  Edit3,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: ViewId) => void;
  onOpenGrounding?: () => void;
  onOpenCrisis?: () => void;
  historyList?: AssessmentRecord[];
  who5Records?: Who5Record[];
  onStartAssessment?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigate,
  onOpenGrounding,
  onOpenCrisis,
  historyList,
  who5Records = [],
  onStartAssessment
}) => {
  const { user, displayName } = useAuth();
  const latestAssessment = historyList && historyList.length > 0 ? historyList[0] : undefined;
  const todayKey = formatDateKey(new Date());

  // Weekly trend days generated ONLY from WHO-5 assessment records
  const weeklyDays = getCurrentWeekDays(who5Records, new Date());
  const todayRecord = who5Records
    .filter(r => r.dateKey === todayKey)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  // Compute weekly statistics strictly from WHO-5 records
  const recordedWeeklyDays = weeklyDays.filter(d => d.who5Record);
  const numericScores = recordedWeeklyDays
    .map(d => d.who5Record?.percentScore)
    .filter((s): s is number => typeof s === 'number');

  const avgScore = numericScores.length > 0 
    ? (numericScores.reduce((a, b) => a + b, 0) / numericScores.length).toFixed(0)
    : null;

  const latestWho5 = who5Records.length > 0 
    ? [...who5Records].sort((a, b) => b.timestamp - a.timestamp)[0] 
    : undefined;

  // Distress indicator: WHO-5 score below clinical cutoff 50 indicates elevated distress
  const latestNeedsSupport = latestWho5 ? latestWho5.percentScore < 50 : false;

  const firstDay = weeklyDays[0];
  const lastDay = weeklyDays[6];
  const weekSpanText = `${firstDay.dayName}, ${firstDay.dateStr} – ${lastDay.dayName}, ${lastDay.dateStr}`;

  const handleStartCheck = () => {
    if (onStartAssessment) {
      onStartAssessment();
    } else {
      onNavigate('wellbeing');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-red-600 font-bold uppercase tracking-wider">
              Patient Overview
            </span>
            <span className="text-gray-300">•</span>
            {user ? (
              <span className="text-xs text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                Authenticated Session
              </span>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 font-medium flex items-center gap-1">
                Guest Session — Sign in to sync
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 font-display">
            {user
              ? `Welcome back, ${displayName || user.email?.split('@')[0] || 'User'}`
              : 'Welcome to Aasra'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {user
              ? 'Your clinical screener records, daily well-being check-ins, and coping tools are secured to your account.'
              : 'Your clinical screener records and coping tools are stored locally on your device with strict confidentiality.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('chat')}
            className="px-4 py-2.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200/80 text-xs sm:text-sm font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-teal-700" />
            <span>AI Check-in</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-xl border font-display shrink-0 ${
            !latestAssessment
              ? 'bg-gray-100 text-gray-500 border-gray-200'
              : latestAssessment.score >= 3
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}>
            {latestAssessment ? `${latestAssessment.score}/${latestAssessment.total || 5}` : '–'}
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Latest PC-PTSD-5</span>
            <span className="text-sm font-bold text-gray-900 font-display block">
              {latestAssessment ? latestAssessment.statusText : 'No screeners yet'}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              {latestAssessment ? `${latestAssessment.date} • VA Cut-point ≥4` : 'Take your first screener'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl border border-purple-200 font-display shrink-0">
            {latestAssessment && typeof latestAssessment.gad7Score === 'number' ? `${latestAssessment.gad7Score}/21` : '–'}
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Latest GAD-7</span>
            <span className="text-sm font-bold text-gray-900 font-display block">
              {latestAssessment && latestAssessment.gad7Severity
                ? `${latestAssessment.gad7Severity.charAt(0).toUpperCase() + latestAssessment.gad7Severity.slice(1)} Anxiety`
                : 'Not assessed'}
            </span>
            <span className="text-[11px] text-purple-700 font-medium block mt-0.5">
              {latestAssessment ? latestAssessment.date : 'Take your first screener'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl border border-teal-200 font-display shrink-0">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Primary Cluster</span>
            <span className="text-sm font-bold text-gray-900 font-display block">Hyperarousal</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">Somatic regulation</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xl border border-sky-100 font-display shrink-0">
            4
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Saved Resources</span>
            <span className="text-sm font-bold text-gray-900 font-display block">Guides &amp; Helplines</span>
            <span className="text-[11px] text-sky-700 font-medium block mt-0.5">Tele-MANAS ready</span>
          </div>
        </div>
      </div>

      {/* Weekly Well-Being & Mood Trend Section (Single unified graph source) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-2xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-teal-800 font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-teal-600" />
                Longitudinal Reflection
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-medium">
                {weekSpanText}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 font-display">
              Weekly Well-Being &amp; Mood Trend
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Daily validated check-ins tracking your emotional well-being throughout the current week. Missing days are unrecorded without guesswork.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {todayRecord ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-xs font-semibold text-teal-900 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-700" />
                  <span>Logged Today ({todayRecord.percentScore}/100)</span>
                </span>
                <button
                  type="button"
                  onClick={handleStartCheck}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Update today's responses"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-start-daily-check-dashboard"
                onClick={handleStartCheck}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Daily Well-Being Check</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('wellbeing')}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
              <span>All Trends</span>
            </button>
          </div>
        </div>

        {/* Weekly Mood SVG Graph (Driven exclusively by completed assessment results) */}
        <WeeklyMoodGraph who5Records={who5Records} days={weeklyDays} onStartAssessment={handleStartCheck} />

        {/* Weekly Summary Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100 text-xs">
          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
            <span className="text-gray-500">Check-in Consistency</span>
            <span className="font-bold text-gray-900 font-display">
              {recordedWeeklyDays.length} / 7 Days Logged
            </span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
            <span className="text-gray-500">Average Well-Being</span>
            <span className="font-bold text-teal-800 font-display">
              {avgScore ? `${avgScore} / 100` : 'No scores yet'}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
            <span className="text-gray-500">Assessment Standard</span>
            <span className="font-medium text-gray-600">
              Validated (Non-Diagnostic)
            </span>
          </div>
        </div>

        {/* Supportive Prompt if latest check-in indicated distress */}
        {latestNeedsSupport && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Your recent check-in indicated lower well-being or noticeable stress. Be gentle with your body today.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenGrounding && (
                <button
                  type="button"
                  onClick={onOpenGrounding}
                  className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Sensory Grounding</span>
                </button>
              )}
              {onOpenCrisis && (
                <button
                  type="button"
                  onClick={onOpenCrisis}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <span>14416 Helpline</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Healing Pathway & Screening History Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Healing Journey Pathway */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-950 font-display flex items-center gap-2">
                <span>Clinical Healing Pathway</span>
              </h3>
              <span className="text-xs text-gray-500 font-medium">Step 3 of 4 In Progress</span>
            </div>

            <div className="relative flex flex-col gap-6 pl-2">
              <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200" />

              {/* Step 1 */}
              <div className="relative flex items-start sm:items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs z-10 shadow-2xs shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block font-display">
                    1. PC-PTSD-5 Screening Completed
                  </span>
                  <span className="text-xs text-gray-500">
                    Validated screener recorded with 4/5 affirmative criteria
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200 shrink-0">
                  Completed
                </span>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start sm:items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs z-10 shadow-2xs shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block font-display">
                    2. Trauma Clusters Evaluated
                  </span>
                  <span className="text-xs text-gray-500">
                    Analyzed Hyperarousal, Avoidance, and Intrusions
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200 shrink-0">
                  Reviewed
                </span>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start sm:items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs z-10 shadow-2xs font-display shrink-0">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-black block font-display">
                    3. Psychoeducation &amp; Somatic Support
                  </span>
                  <span className="text-xs text-gray-500">
                    Explore grounding exercises and AI-guided coping strategies
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('chat')}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 text-xs font-semibold hover:bg-sky-100 transition-colors shrink-0 cursor-pointer"
                >
                  Resume
                </button>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start sm:items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs z-10 font-display shrink-0">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-600 block">
                    4. Professional Consultation &amp; Care
                  </span>
                  <span className="text-xs text-gray-500">
                    Share clinical outcome summary with a licensed therapist or physician
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors border border-gray-200 shrink-0 cursor-pointer"
                >
                  Find Care
                </button>
              </div>
            </div>
          </div>

          {/* Quick Route Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigate('history')}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 font-display">
                    Screener History
                  </h4>
                  <p className="text-xs text-gray-500">Timeline &amp; PDF export</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            <div
              onClick={() => onNavigate('states')}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                  <ToggleLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 font-display">
                    System UI States
                  </h4>
                  <p className="text-xs text-gray-500">Preview states &amp; alerts</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Right Column: Grounding Tool, Clinical Helplines, & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Somatic Regulation Quick Launcher */}
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-sky-50/50 p-6 rounded-3xl border border-teal-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider font-display mb-2">
              <Wind className="w-4 h-4 text-teal-600" />
              <span>Somatic Nervous System Tool</span>
            </div>
            <h4 className="text-lg font-bold text-gray-950 font-display mb-1.5">
              5-4-3-2-1 Sensory Grounding
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Gently signal to your amygdala and sympathetic nervous system that you are safe in the present physical space.
            </p>
            <button
              onClick={() => onNavigate('resources')}
              className="w-full py-3 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wind className="w-4 h-4" />
              <span>Open Sensory Grounding</span>
            </button>
          </div>

          {/* Crisis & Safety Support Card */}
          <div className="bg-red-50/80 p-6 rounded-3xl border border-red-200 shadow-2xs">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider font-display mb-2">
              <PhoneCall className="w-4 h-4 text-red-600" />
              <span>24/7 Crisis Assistance</span>
            </div>
            <h4 className="text-base font-bold text-red-950 font-display mb-1">
              You do not have to carry this alone
            </h4>
            <p className="text-xs text-red-900 leading-relaxed mb-4">
              Free, confidential counseling available 24/7 across India via Tele-MANAS (14416), KIRAN (1800-599-0019), and National Emergency (112).
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="tel:14416"
                className="py-2.5 px-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700 transition-colors text-center block"
              >
                Tele-MANAS (14416)
              </a>
              <a
                href="tel:112"
                className="py-2.5 px-3 rounded-xl bg-white text-red-700 border border-red-200 text-xs font-bold shadow-2xs hover:bg-red-50 transition-colors text-center block"
              >
                Emergency (112)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
