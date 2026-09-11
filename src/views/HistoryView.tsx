import React, { useState } from 'react';
import { ViewId, AssessmentRecord, DailyCheckIn } from '../types';
import { MOOD_OPTIONS } from '../data/screeningData';
import { 
  FileDown, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  ShieldCheck, 
  PlusCircle, 
  Activity, 
  Heart, 
  ClipboardList,
  Bot,
  Lock
} from 'lucide-react';

interface HistoryViewProps {
  historyList: AssessmentRecord[];
  onClearHistory: () => void;
  onNavigate: (view: ViewId) => void;
  onInspectRecord: (rec: AssessmentRecord) => void;
  checkIns?: DailyCheckIn[];
  onOpenCheckIn?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  historyList,
  onClearHistory,
  onNavigate, 
  onInspectRecord,
  checkIns = [],
  onOpenCheckIn
}) => {
  const [activeTab, setActiveTab] = useState<'screeners' | 'checkins'>('screeners');
  const [showExportBanner, setShowExportBanner] = useState(false);

  const handleExportPdf = () => {
    setShowExportBanner(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleConfirmClear = () => {
    if (window.confirm('Are you sure you want to securely clear your clinical screening history from this browser?')) {
      onClearHistory();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-red-600 font-bold uppercase tracking-wider font-display">
              Timeline Tracking
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60 font-medium">
              PC-PTSD-5 &amp; GAD-7 Longitudinal Logs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 font-display">
            Assessment &amp; Screening History
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review your past symptom evaluations over time and generate reports for provider discussions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('intro')}
            className="px-4 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold shadow-xs hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Screener</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-gray-700" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector: Clinical Screeners vs Daily Check-ins */}
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('screeners')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'screeners'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Clinical Screeners ({historyList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checkins')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'checkins'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Heart className="w-4 h-4 text-teal-300" />
          <span>Daily Mood Check-ins ({checkIns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="ml-auto px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200/80 shadow-2xs"
          title="Open Saathi AI Chat & View PIN-Protected History"
        >
          <Bot className="w-4 h-4 text-teal-700" />
          <span className="hidden sm:inline">Saathi</span>
          <span>Chat History</span>
          <Lock className="w-3 h-3 text-amber-600" />
        </button>
      </div>

      {showExportBanner && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <span>Preparing printable clinical summary for healthcare provider discussion...</span>
          <button
            onClick={() => setShowExportBanner(false)}
            className="text-teal-800 font-bold underline hover:text-teal-950 ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'screeners' ? (
        historyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {historyList.map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold font-display ${
                          rec.score >= 3
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-100'
                        }`}
                      >
                        PTSD: {rec.score} / {rec.total}
                      </span>

                      {typeof rec.gad7Score === 'number' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold font-display bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-purple-600" />
                          <span>GAD-7: {rec.gad7Score}/21</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{rec.date}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-gray-900 font-display block mb-1.5">
                    {rec.statusText}
                  </span>

                  <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">{rec.summary}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                  <span className="text-gray-400 font-medium">PC-PTSD-5 &amp; GAD-7</span>
                  <button
                    type="button"
                    onClick={() => onInspectRecord(rec)}
                    className="text-black font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Full Clinical Result</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center mb-8">
            <p className="text-sm text-gray-500 mb-4">All screening records have been securely cleared from local storage.</p>
            <button
              onClick={() => onNavigate('consent')}
              className="px-6 py-3 bg-black text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Start a new assessment
            </button>
          </div>
        )
      ) : (
        /* Daily Mood Check-ins Tab */
        checkIns.length > 0 ? (
          <div className="space-y-4 mb-8">
            {[...checkIns]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((checkIn) => {
                const moodOpt = checkIn.mood !== null ? MOOD_OPTIONS.find(m => m.score === checkIn.mood) : null;
                return (
                  <div
                    key={checkIn.id}
                    className="p-5 rounded-3xl border border-gray-200 bg-white shadow-2xs hover:border-teal-200 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-700" />
                        <span className="text-xs sm:text-sm font-bold text-gray-950 font-display">
                          {checkIn.displayDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {moodOpt ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold font-display bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center gap-1.5">
                            <span className="text-sm">{moodOpt.emoji}</span>
                            <span>{checkIn.moodLabel}</span>
                            <span className="text-teal-600/80 font-normal">({checkIn.mood}/5)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Mood: Prefer not to say
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs mb-3">
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Energy</span>
                        <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                          {checkIn.energyLevel ? checkIn.energyLevel.split('/')[0].trim() : 'Stable'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Clarity</span>
                        <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                          {checkIn.mentalClarity ? checkIn.mentalClarity.split('/')[0].trim() : 'Steady'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Nervous System</span>
                        <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                          {checkIn.stressLevel.split('/')[0].trim()}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Sleep Rest</span>
                        <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                          {checkIn.sleepQuality.split('/')[0].trim()}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Connection</span>
                        <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                          {checkIn.feltSupported.split('/')[0].trim()}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Day Overall</span>
                        <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                          {checkIn.dayOverall.split('/')[0].trim()}
                        </span>
                      </div>
                    </div>

                    {checkIn.notes && (
                      <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-teal-950">
                        <span className="font-bold text-teal-800 mr-1.5">Reflection note:</span>
                        <span className="italic">{checkIn.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center mb-8">
            <p className="text-sm text-gray-500 mb-4">No daily check-ins recorded yet.</p>
            {onOpenCheckIn && (
              <button
                type="button"
                onClick={onOpenCheckIn}
                className="px-6 py-3 bg-black text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Complete your first check-in</span>
              </button>
            )}
          </div>
        )
      )}

      {/* Privacy Assurance Bar */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 shadow-2xs">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          Data is retained only within your local browser session storage.
        </span>

        {historyList.length > 0 && (
          <button
            onClick={handleConfirmClear}
            className="text-red-600 hover:text-red-700 font-semibold underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear local screening history</span>
          </button>
        )}
      </div>
    </div>
  );
};
