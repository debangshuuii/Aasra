import React from 'react';
import { DailyCheckIn } from '../types';
import { MOOD_OPTIONS } from '../data/screeningData';
import { X, Calendar, Heart, ShieldCheck, ArrowRight, Clock, PlusCircle } from 'lucide-react';

interface PreviousCheckInsModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkIns: DailyCheckIn[];
  onOpenCheckIn: () => void;
}

export const PreviousCheckInsModal: React.FC<PreviousCheckInsModalProps> = ({
  isOpen,
  onClose,
  checkIns,
  onOpenCheckIn
}) => {
  if (!isOpen) return null;

  // Sort newest first
  const sortedCheckIns = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prev-checkins-headline"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-sky-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close check-in history"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white flex items-center gap-1">
              <Calendar className="w-3 h-3 text-teal-200" />
              Longitudinal Log
            </span>
            <span className="text-white/60 text-xs">•</span>
            <span className="text-xs text-teal-100 font-medium">
              {checkIns.length} {checkIns.length === 1 ? 'Check-in' : 'Check-ins'} Logged
            </span>
          </div>

          <h2 id="prev-checkins-headline" className="text-xl sm:text-2xl font-bold font-display text-white">
            Daily Check-in History
          </h2>
          <p className="text-xs sm:text-sm text-teal-50 mt-1 max-w-lg leading-relaxed">
            Review your daily self-reflections over time. Notice patterns in your stress, sleep, and emotional rhythm.
          </p>
        </div>

        {/* Check-ins List */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {sortedCheckIns.length > 0 ? (
            sortedCheckIns.map((rec) => {
              const moodOpt = rec.mood !== null ? MOOD_OPTIONS.find(m => m.score === rec.mood) : null;

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs hover:border-teal-200 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-700" />
                      <span className="text-xs sm:text-sm font-bold text-gray-950 font-display">
                        {rec.displayDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {moodOpt ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold font-display bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center gap-1.5">
                          <span className="text-sm">{moodOpt.emoji}</span>
                          <span>{rec.moodLabel}</span>
                          <span className="text-teal-600/80 font-normal">({rec.mood}/5)</span>
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
                        {rec.energyLevel ? rec.energyLevel.split('/')[0].trim() : 'Stable'}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Clarity</span>
                      <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                        {rec.mentalClarity ? rec.mentalClarity.split('/')[0].trim() : 'Steady'}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Nervous System</span>
                      <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                        {rec.stressLevel.split('/')[0].trim()}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Sleep Rest</span>
                      <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                        {rec.sleepQuality.split('/')[0].trim()}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Connection</span>
                      <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                        {rec.feltSupported.split('/')[0].trim()}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 block">Day Overall</span>
                      <span className="font-semibold text-gray-900 block mt-0.5 truncate">
                        {rec.dayOverall.split('/')[0].trim()}
                      </span>
                    </div>
                  </div>

                  {rec.notes && (
                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-teal-950">
                      <span className="font-bold text-teal-800 mr-1.5">Reflection note:</span>
                      <span className="italic">{rec.notes}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-500 mb-3">
                No daily check-ins recorded yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckIn();
                }}
                className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Complete your first check-in</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            Check-ins are stored privately in local browser storage only.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
