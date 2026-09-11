import React, { useState, useEffect } from 'react';
import { 
  TRAUMA_EXPOSURE_QUESTION, 
  PC_PTSD_5_QUESTIONS, 
  GAD_7_QUESTIONS, 
  GAD_7_OPTIONS,
  RISK_QUESTIONS 
} from '../data/screeningData';
import { 
  Calendar, 
  HelpCircle, 
  ChevronDown, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  HeartHandshake
} from 'lucide-react';

interface QuestionnaireViewProps {
  traumaExposure: boolean | null;
  onSetTraumaExposure: (val: boolean) => void;
  ptsdAnswers: (boolean | null)[];
  onSetPtsdAnswer: (index: number, val: boolean) => void;
  gad7Answers: (number | null)[];
  onSetGad7Answer: (index: number, val: number) => void;
  urgentDistress: boolean | null;
  onSetUrgentDistress: (val: boolean) => void;
  selfHarmOrDanger: boolean | null;
  onSetSelfHarmOrDanger: (val: boolean) => void;
  onComplete: () => void;
  onOpenCrisis: () => void;
  onCancelOrBackToIntro: () => void;
}

type Stage = 'trauma_gate' | 'ptsd' | 'gad7' | 'risk';

export const QuestionnaireView: React.FC<QuestionnaireViewProps> = ({
  traumaExposure,
  onSetTraumaExposure,
  ptsdAnswers,
  onSetPtsdAnswer,
  gad7Answers,
  onSetGad7Answer,
  urgentDistress,
  onSetUrgentDistress,
  selfHarmOrDanger,
  onSetSelfHarmOrDanger,
  onComplete,
  onOpenCrisis,
  onCancelOrBackToIntro,
}) => {
  const [stage, setStage] = useState<Stage>('trauma_gate');
  const [ptsdIndex, setPtsdIndex] = useState<number>(0);
  const [gad7Index, setGad7Index] = useState<number>(0);
  const [whyOpen, setWhyOpen] = useState<boolean>(true);

  // Smoothly scroll to the top of the question container whenever advancing
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, ptsdIndex, gad7Index]);

  // Overall progress calculation across the 5 steps
  let completedCount = 0;
  let totalSteps = 1 + (traumaExposure === false ? 0 : 5) + 7 + 1; // gate + (5 PTSD if yes) + 7 GAD7 + 1 Risk

  if (traumaExposure !== null) completedCount += 1;
  if (traumaExposure !== false) {
    completedCount += ptsdAnswers.filter(a => a !== null).length;
  }
  completedCount += gad7Answers.filter(a => a !== null).length;
  if (urgentDistress !== null && selfHarmOrDanger !== null) completedCount += 1;

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (stage === 'trauma_gate') {
        if (e.key === 'y' || e.key === 'Y') onSetTraumaExposure(true);
        if (e.key === 'n' || e.key === 'N') onSetTraumaExposure(false);
        if (e.key === 'Enter' && traumaExposure !== null) handleNext();
      } else if (stage === 'ptsd') {
        if (e.key === 'y' || e.key === 'Y') onSetPtsdAnswer(ptsdIndex, true);
        if (e.key === 'n' || e.key === 'N') onSetPtsdAnswer(ptsdIndex, false);
        if (e.key === 'Enter' && ptsdAnswers[ptsdIndex] !== null) handleNext();
      } else if (stage === 'gad7') {
        if (['0', '1', '2', '3'].includes(e.key)) {
          onSetGad7Answer(gad7Index, parseInt(e.key, 10));
        }
        if (e.key === 'Enter' && gad7Answers[gad7Index] !== null) handleNext();
      } else if (stage === 'risk') {
        if (e.key === 'Enter' && urgentDistress !== null && selfHarmOrDanger !== null) {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    stage, 
    traumaExposure, 
    ptsdIndex, 
    ptsdAnswers, 
    gad7Index, 
    gad7Answers, 
    urgentDistress, 
    selfHarmOrDanger
  ]);

  const handleNext = () => {
    if (stage === 'trauma_gate') {
      if (traumaExposure === true) {
        setStage('ptsd');
        setPtsdIndex(0);
      } else {
        // Trauma negative: skip PTSD questions, move straight to GAD-7
        setStage('gad7');
        setGad7Index(0);
      }
    } else if (stage === 'ptsd') {
      if (ptsdIndex < PC_PTSD_5_QUESTIONS.length - 1) {
        setPtsdIndex(prev => prev + 1);
      } else {
        setStage('gad7');
        setGad7Index(0);
      }
    } else if (stage === 'gad7') {
      if (gad7Index < GAD_7_QUESTIONS.length - 1) {
        setGad7Index(prev => prev + 1);
      } else {
        setStage('risk');
      }
    } else if (stage === 'risk') {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (stage === 'trauma_gate') {
      onCancelOrBackToIntro();
    } else if (stage === 'ptsd') {
      if (ptsdIndex > 0) {
        setPtsdIndex(prev => prev - 1);
      } else {
        setStage('trauma_gate');
      }
    } else if (stage === 'gad7') {
      if (gad7Index > 0) {
        setGad7Index(prev => prev - 1);
      } else {
        if (traumaExposure === true) {
          setStage('ptsd');
          setPtsdIndex(PC_PTSD_5_QUESTIONS.length - 1);
        } else {
          setStage('trauma_gate');
        }
      }
    } else if (stage === 'risk') {
      setStage('gad7');
      setGad7Index(GAD_7_QUESTIONS.length - 1);
    }
  };

  // Determine current stage canAdvance
  const canAdvance = () => {
    if (stage === 'trauma_gate') return traumaExposure !== null;
    if (stage === 'ptsd') return ptsdAnswers[ptsdIndex] !== null;
    if (stage === 'gad7') return gad7Answers[gad7Index] !== null;
    if (stage === 'risk') return urgentDistress !== null && selfHarmOrDanger !== null;
    return false;
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Step Progression Breadcrumb Bar */}
      <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Step 1 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            stage === 'trauma_gate'
              ? 'bg-black text-white border-black shadow-xs'
              : traumaExposure !== null
              ? 'bg-teal-50 border-teal-200 text-teal-900'
              : 'bg-gray-50 border-gray-200 text-gray-400'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>Step 1: Trauma</span>
            </div>
            <span className="text-[11px] block mt-0.5 truncate font-medium">
              {traumaExposure === true ? 'Criterion A Yes' : traumaExposure === false ? 'Bypassed (No)' : 'Exposure Gate'}
            </span>
          </div>

          {/* Step 2 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            stage === 'ptsd'
              ? 'bg-black text-white border-black shadow-xs'
              : traumaExposure === false
              ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
              : ptsdAnswers.every(a => a !== null)
              ? 'bg-teal-50 border-teal-200 text-teal-900'
              : 'bg-gray-50 border-gray-200 text-gray-400'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Step 2: PTSD (5)</span>
            </div>
            <span className="text-[11px] block mt-0.5 truncate font-medium">
              {traumaExposure === false ? 'Skipped (0/5)' : stage === 'ptsd' ? `Q${ptsdIndex + 1} of 5` : 'DSM-5 Screen'}
            </span>
          </div>

          {/* Step 3 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            stage === 'gad7'
              ? 'bg-black text-white border-black shadow-xs'
              : gad7Answers.every(a => a !== null)
              ? 'bg-teal-50 border-teal-200 text-teal-900'
              : 'bg-gray-50 border-gray-200 text-gray-400'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>Step 3: GAD-7</span>
            </div>
            <span className="text-[11px] block mt-0.5 truncate font-medium">
              {stage === 'gad7' ? `Q${gad7Index + 1} of 7` : 'Anxiety Scale'}
            </span>
          </div>

          {/* Step 4 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            stage === 'risk'
              ? 'bg-black text-white border-black shadow-xs'
              : (urgentDistress !== null && selfHarmOrDanger !== null)
              ? 'bg-teal-50 border-teal-200 text-teal-900'
              : 'bg-gray-50 border-gray-200 text-gray-400'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Step 4: Safety</span>
            </div>
            <span className="text-[11px] block mt-0.5 truncate font-medium">
              {stage === 'risk' ? 'Risk Triage' : 'Urgency Check'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAGE 1: TRAUMA EXPOSURE GATE (PC-PTSD-5 CRITERION A)                     */}
      {/* ========================================================================= */}
      {stage === 'trauma_gate' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-xs mb-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-bold border border-red-200/80">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>PC-PTSD-5 Initial Trauma Gate (Criterion A)</span>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border text-gray-700 font-mono text-[10px]">Y</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border text-gray-700 font-mono text-[10px]">N</kbd>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl text-gray-950 font-bold mb-6 leading-snug font-display">
            {TRAUMA_EXPOSURE_QUESTION.q}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* YES Choice */}
            <button
              type="button"
              onClick={() => onSetTraumaExposure(true)}
              className={`p-5 sm:p-6 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer ${
                traumaExposure === true
                  ? 'border-black bg-teal-50/50 shadow-xs ring-2 ring-black/5'
                  : 'bg-gray-50/70 hover:bg-white hover:border-gray-300 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
                  traumaExposure === true ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                }`}>
                  Y
                </span>
                <div>
                  <span className="text-lg font-bold font-display text-gray-950 block">Yes</span>
                  <span className="text-xs text-gray-500">I have experienced or witnessed such an event</span>
                </div>
              </div>
              <CheckCircle2 className={`w-7 h-7 text-teal-700 transition-opacity ${traumaExposure === true ? 'opacity-100' : 'opacity-0'}`} />
            </button>

            {/* NO Choice */}
            <button
              type="button"
              onClick={() => onSetTraumaExposure(false)}
              className={`p-5 sm:p-6 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer ${
                traumaExposure === false
                  ? 'border-black bg-teal-50/50 shadow-xs ring-2 ring-black/5'
                  : 'bg-gray-50/70 hover:bg-white hover:border-gray-300 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
                  traumaExposure === false ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                }`}>
                  N
                </span>
                <div>
                  <span className="text-lg font-bold font-display text-gray-950 block">No</span>
                  <span className="text-xs text-gray-500">I have not experienced such an event</span>
                </div>
              </div>
              <CheckCircle2 className={`w-7 h-7 text-teal-700 transition-opacity ${traumaExposure === false ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </div>

          {/* Conditional Clinical Explanation for NO */}
          {traumaExposure === false && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-sky-950">Clinical rule applied: Score = 0</strong>
                Because trauma exposure is not indicated, your PC-PTSD-5 score is set to <strong>0 of 5 (Negative Screen)</strong>. Clicking <strong>Next</strong> will automatically bypass the 5 PTSD symptom questions and advance directly to the GAD-7 anxiety assessment.
              </div>
            </div>
          )}

          {/* Clinical Rationale Accordion */}
          <div className="rounded-2xl bg-gray-50/90 border border-gray-200/90 overflow-hidden">
            <button
              type="button"
              onClick={() => setWhyOpen(prev => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-gray-800 text-xs sm:text-sm hover:text-black transition-colors text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>Why are clinicians asking this initial gate question?</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${whyOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {whyOpen && (
              <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-200/60">
                {TRAUMA_EXPOSURE_QUESTION.why}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: PTSD 5-ITEM SCREENER                                             */}
      {/* ========================================================================= */}
      {stage === 'ptsd' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-xs mb-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200/80">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Timeframe: In the past month</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                PTSD Question {ptsdIndex + 1} of {PC_PTSD_5_QUESTIONS.length}
              </span>
            </div>
          </div>

          <span className="text-xs text-teal-700 font-bold uppercase tracking-wider block mb-2 font-display">
            In the past month, have you:
          </span>

          <h2 className="text-xl sm:text-2xl text-gray-950 font-bold mb-8 leading-snug font-display">
            {PC_PTSD_5_QUESTIONS[ptsdIndex].q}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => onSetPtsdAnswer(ptsdIndex, true)}
              className={`p-5 sm:p-6 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer ${
                ptsdAnswers[ptsdIndex] === true
                  ? 'border-black bg-teal-50/50 shadow-xs ring-2 ring-black/5'
                  : 'bg-gray-50/70 hover:bg-white hover:border-gray-300 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
                  ptsdAnswers[ptsdIndex] === true ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                }`}>
                  Y
                </span>
                <div>
                  <span className="text-lg font-bold font-display text-gray-950 block">Yes</span>
                  <span className="text-xs text-gray-500">I have experienced this</span>
                </div>
              </div>
              <CheckCircle2 className={`w-7 h-7 text-teal-700 transition-opacity ${ptsdAnswers[ptsdIndex] === true ? 'opacity-100' : 'opacity-0'}`} />
            </button>

            <button
              type="button"
              onClick={() => onSetPtsdAnswer(ptsdIndex, false)}
              className={`p-5 sm:p-6 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer ${
                ptsdAnswers[ptsdIndex] === false
                  ? 'border-black bg-teal-50/50 shadow-xs ring-2 ring-black/5'
                  : 'bg-gray-50/70 hover:bg-white hover:border-gray-300 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
                  ptsdAnswers[ptsdIndex] === false ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                }`}>
                  N
                </span>
                <div>
                  <span className="text-lg font-bold font-display text-gray-950 block">No</span>
                  <span className="text-xs text-gray-500">I have not experienced this</span>
                </div>
              </div>
              <CheckCircle2 className={`w-7 h-7 text-teal-700 transition-opacity ${ptsdAnswers[ptsdIndex] === false ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </div>

          {/* Clinical Rationale Accordion */}
          <div className="rounded-2xl bg-gray-50/90 border border-gray-200/90 overflow-hidden">
            <button
              type="button"
              onClick={() => setWhyOpen(prev => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-gray-800 text-xs sm:text-sm hover:text-black transition-colors text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>Why are clinicians asking this question? ({PC_PTSD_5_QUESTIONS[ptsdIndex].cluster})</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${whyOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {whyOpen && (
              <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-200/60">
                {PC_PTSD_5_QUESTIONS[ptsdIndex].why}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: GAD-7 ANXIETY ASSESSMENT (7 QUESTIONS, 4 LIKERT OPTIONS)         */}
      {/* ========================================================================= */}
      {stage === 'gad7' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-xs mb-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200/80">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>Timeframe: Over the last 2 weeks</span>
            </div>
            <span className="text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
              GAD-7 Question {gad7Index + 1} of {GAD_7_QUESTIONS.length}
            </span>
          </div>

          <span className="text-xs text-purple-700 font-bold uppercase tracking-wider block mb-2 font-display">
            Over the last 2 weeks, how often have you been bothered by:
          </span>

          <h2 className="text-xl sm:text-2xl text-gray-950 font-bold mb-8 leading-snug font-display">
            {GAD_7_QUESTIONS[gad7Index].q}
          </h2>

          {/* 4 Tactile Frequency Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
            {GAD_7_OPTIONS.map((opt, idx) => {
              const isSelected = gad7Answers[gad7Index] === opt.value;
              const optionLetters = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSetGad7Answer(gad7Index, opt.value)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] text-left cursor-pointer ${
                    isSelected
                      ? 'border-black bg-purple-50/50 shadow-xs ring-2 ring-black/5'
                      : 'bg-gray-50/70 hover:bg-white hover:border-gray-300 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
                      isSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                    }`}>
                      {optionLetters[idx] || (idx + 1)}
                    </span>
                    <div>
                      <span className="text-sm sm:text-base font-bold text-gray-950 block font-display">
                        {opt.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className={`w-6 h-6 text-purple-700 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>

          {/* Clinical Rationale Accordion */}
          <div className="rounded-2xl bg-gray-50/90 border border-gray-200/90 overflow-hidden">
            <button
              type="button"
              onClick={() => setWhyOpen(prev => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-gray-800 text-xs sm:text-sm hover:text-black transition-colors text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <HelpCircle className="w-4 h-4 text-purple-700" />
                <span>Clinical Area: {GAD_7_QUESTIONS[gad7Index].area}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${whyOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {whyOpen && (
              <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-200/60">
                {GAD_7_QUESTIONS[gad7Index].why}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: RISK / URGENCY ASSESSMENT                                        */}
      {/* ========================================================================= */}
      {stage === 'risk' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-xs mb-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-bold border border-red-200/80">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Step 4: Clinical Risk &amp; Urgency Triage</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl text-gray-950 font-bold mb-2 font-display">
            Final Safety &amp; Emotional Well-Being Check
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-8 leading-relaxed">
            These questions ensure our system tailors appropriate immediate care pathways and crisis helplines to your current situation.
          </p>

          <div className="space-y-6 mb-8">
            {/* Question 1: Urgent Distress */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-950 mb-3 font-display">
                1. {RISK_QUESTIONS[0].q}
              </h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onSetUrgentDistress(true)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                    urgentDistress === true
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Yes, I feel overwhelmed
                </button>
                <button
                  type="button"
                  onClick={() => onSetUrgentDistress(false)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                    urgentDistress === false
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  No, I feel manageable
                </button>
              </div>
            </div>

            {/* Question 2: Self-Harm or Danger */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-950 mb-3 font-display">
                2. {RISK_QUESTIONS[1].q}
              </h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onSetSelfHarmOrDanger(true)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                    selfHarmOrDanger === true
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onSetSelfHarmOrDanger(false)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                    selfHarmOrDanger === false
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Urgent Hotline Callout if self-harm or severe distress flagged */}
          {(urgentDistress === true || selfHarmOrDanger === true) && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-950 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs sm:text-sm font-bold text-red-900 block">
                    Immediate Support is Available Right Now
                  </strong>
                  <span className="text-xs text-red-800">
                    You do not have to carry this alone. Free 24/7 confidential counseling across India:
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCrisis}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Helplines (14416 / 112)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* NAVIGATION FOOTER CONTROLS                                                */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePrev}
          className="px-5 py-3 rounded-xl bg-white text-gray-800 text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 border border-gray-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance()}
          className={`px-8 py-3.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2 ${
            canAdvance()
              ? 'opacity-100 hover:bg-gray-800 cursor-pointer active:scale-98'
              : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <span>
            {stage === 'risk' ? 'Review Clinical Assessment & AI Synthesis' : 'Next'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Safety & Confidentiality Bar */}
      <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 text-center sm:text-left">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          Responses processed locally &bull; No sensitive data saved to third-party databases
        </span>

        <button
          type="button"
          onClick={onOpenCrisis}
          className="text-gray-600 hover:text-red-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5 text-red-600" />
          <span>Need immediate emotional support? <strong>Call Tele-MANAS (14416) or 112</strong></span>
        </button>
      </div>
    </div>
  );
};
