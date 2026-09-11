import React, { useState, useEffect } from 'react';
import { DailyCheckIn } from '../types';
import { 
  MOOD_OPTIONS, 
  DAY_OVERALL_OPTIONS, 
  STRESS_LEVEL_OPTIONS, 
  SLEEP_QUALITY_OPTIONS, 
  SUPPORT_CONNECTION_OPTIONS,
  formatDateKey,
  formatDisplayDate,
  isCheckInSupportNeeded
} from '../data/screeningData';
import { 
  X, 
  Heart, 
  ShieldCheck, 
  Wind, 
  PhoneCall, 
  Bot, 
  CheckCircle2, 
  Info,
  Calendar
} from 'lucide-react';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checkIn: DailyCheckIn) => void;
  todayCheckIn?: DailyCheckIn;
  onOpenGrounding?: () => void;
  onOpenCrisis?: () => void;
  onOpenChat?: () => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  onSave,
  todayCheckIn,
  onOpenGrounding,
  onOpenCrisis,
  onOpenChat
}) => {
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(3);
  const [dayOverall, setDayOverall] = useState<string>('Steady / Uneventful');
  const [stressLevel, setStressLevel] = useState<string>('Mild / Manageable');
  const [sleepQuality, setSleepQuality] = useState<string>('Fair / Okay');
  const [feltSupported, setFeltSupported] = useState<string>('Yes, had someone supportive');
  const [notes, setNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Sync state whenever modal opens or existing check-in changes
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      if (todayCheckIn) {
        setMood(todayCheckIn.mood);
        setDayOverall(todayCheckIn.dayOverall);
        setStressLevel(todayCheckIn.stressLevel);
        setSleepQuality(todayCheckIn.sleepQuality);
        setFeltSupported(todayCheckIn.feltSupported);
        setNotes(todayCheckIn.notes || '');
      } else {
        setMood(3);
        setDayOverall('Steady / Uneventful');
        setStressLevel('Mild / Manageable');
        setSleepQuality('Fair / Okay');
        setFeltSupported('Yes, had someone supportive');
        setNotes('');
      }
    }
  }, [isOpen, todayCheckIn]);

  if (!isOpen) return null;

  const now = new Date();
  const dateKey = formatDateKey(now);
  const displayDateStr = formatDisplayDate(now);

  const needsSupport = isCheckInSupportNeeded({ mood, stressLevel, sleepQuality });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const submitTime = new Date();
    const submitDateKey = formatDateKey(submitTime);
    const submitDisplayDate = formatDisplayDate(submitTime);

    const selectedMoodOption = MOOD_OPTIONS.find(m => m.score === mood);
    const moodLabel = selectedMoodOption ? selectedMoodOption.label : 'Prefer not to say';

    const record: DailyCheckIn = {
      id: todayCheckIn ? todayCheckIn.id : `checkin-${Date.now()}`,
      date: submitDateKey,
      displayDate: submitDisplayDate,
      timestamp: submitTime.getTime(),
      mood,
      moodLabel,
      dayOverall,
      stressLevel,
      sleepQuality,
      feltSupported,
      notes: notes.trim() || undefined
    };

    onSave(record);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-sky-700 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close daily check-in"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white flex items-center gap-1">
              <Heart className="w-3 h-3 text-teal-200" />
              Daily Reflection
            </span>
            <span className="text-white/60 text-xs">•</span>
            <span className="text-xs text-teal-100 flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3" />
              {displayDateStr}
            </span>
          </div>

          <h2 id="modal-headline" className="text-xl sm:text-2xl font-bold font-display text-white">
            Daily Mood &amp; Wellbeing Check-in
          </h2>
          <p className="text-xs sm:text-sm text-teal-50 mt-1 max-w-lg leading-relaxed">
            Take a quiet minute to tune into your body and mind. Your reflections remain private and stored only on this device.
          </p>
        </div>

        {/* Existing Check-in Notice */}
        {todayCheckIn && !submitted && (
          <div className="bg-teal-50 border-b border-teal-100 px-5 sm:px-6 py-2.5 flex items-center gap-2 text-xs text-teal-900">
            <Info className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              You already completed today's check-in. Updating your responses will refresh your daily record.
            </span>
          </div>
        )}

        {submitted ? (
          /* Submission Confirmation View */
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-display">Check-in Saved</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Thank you for honoring your experiences today. Your weekly trend has been updated.
              </p>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Question 1: Mood Today */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                1. How is your mood today?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((item) => {
                  const isSelected = mood === item.score;
                  return (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => setMood(item.score)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/80 shadow-xs ring-2 ring-teal-600/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl mb-1">{item.emoji}</span>
                      <span className="text-xs font-bold text-gray-900">{item.label}</span>
                      <span className="text-[10px] text-gray-500 leading-tight mt-0.5 hidden sm:block">
                        {item.description.split(',')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setMood(null)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  mood === null
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Prefer not to say
              </button>
            </div>

            {/* Question 2: Day Overall */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                2. How was your day overall?
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_OVERALL_OPTIONS.map((opt) => {
                  const isSelected = dayOverall === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDayOverall(opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 3: Stress Level */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                3. How would you describe your stress level today?
              </label>
              <div className="flex flex-wrap gap-2">
                {STRESS_LEVEL_OPTIONS.map((opt) => {
                  const isSelected = stressLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStressLevel(opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 4: Sleep Quality */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                4. How well did you sleep recently?
              </label>
              <div className="flex flex-wrap gap-2">
                {SLEEP_QUALITY_OPTIONS.map((opt) => {
                  const isSelected = sleepQuality === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSleepQuality(opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 5: Comfort Talking to Someone */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                5. Did you have someone you felt comfortable talking to today?
              </label>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_CONNECTION_OPTIONS.map((opt) => {
                  const isSelected = feltSupported === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFeltSupported(opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Gentle Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 font-display">
                Gentle reflection or note (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Write any thoughts, bodily sensations, or grounding moments from today..."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 resize-none text-gray-800"
              />
            </div>

            {/* Trauma-Informed Supportive Help Banner if High Stress or Low Mood */}
            {needsSupport && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/90 via-amber-50/70 to-teal-50/60 border border-red-200/80 shadow-2xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <Heart className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-950 font-display">
                      We hear you, and it is okay to have heavy days
                    </h4>
                    <p className="text-xs text-red-900/90 mt-0.5 leading-relaxed">
                      Your feelings are valid physiological responses to stress. You do not have to carry this alone. Immediate, gentle support tools are ready right here:
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onOpenGrounding && (
                    <button
                      type="button"
                      onClick={onOpenGrounding}
                      className="px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Wind className="w-3.5 h-3.5" />
                      <span>5-4-3-2-1 Grounding</span>
                    </button>
                  )}

                  {onOpenChat && (
                    <button
                      type="button"
                      onClick={onOpenChat}
                      className="px-3 py-1.5 rounded-lg bg-white border border-teal-200 text-teal-800 text-xs font-semibold hover:bg-teal-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-teal-600" />
                      <span>Talk with Saathi AI</span>
                    </button>
                  )}

                  {onOpenCrisis && (
                    <button
                      type="button"
                      onClick={onOpenCrisis}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 border border-red-200 text-xs font-semibold hover:bg-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                      <span>Crisis Support: 14416</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Non-Diagnostic Disclaimer */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-[11px] text-gray-500 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>
                <strong>Non-Diagnostic Notice:</strong> The Daily Check-in is a personal self-reflection log and is not a medical diagnostic test. It does not diagnose depression, PTSD, or any clinical condition.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>{todayCheckIn ? 'Update Today\'s Check-in' : 'Save Today\'s Check-in'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
