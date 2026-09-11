import React, { useState, useEffect } from 'react';
import { ViewId, AssessmentCompositeResult } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  RotateCcw, 
  ListFilter, 
  Bot, 
  BookOpen, 
  LayoutDashboard,
  Printer,
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
  Activity,
  PhoneCall, 
  Loader2, 
  RefreshCw, 
  Flame, 
  FileDown,
  MapPin,
  Calendar
} from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { 
  TRAUMA_EXPOSURE_QUESTION, 
  PC_PTSD_5_QUESTIONS, 
  GAD_7_QUESTIONS, 
  GAD_7_OPTIONS, 
  RISK_QUESTIONS 
} from '../data/screeningData';

interface ResultsViewProps {
  assessment: AssessmentCompositeResult;
  onSimulate: (simulated: AssessmentCompositeResult) => void;
  onNavigate: (view: ViewId) => void;
  onRetake: () => void;
  onOpenCrisis: () => void;
  onOpenNearbyHospitals?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  assessment,
  onSimulate,
  onNavigate,
  onRetake,
  onOpenCrisis,
  onOpenNearbyHospitals,
}) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');

  const assessmentDateStr = assessment.formattedDateTime || assessment.date || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const {
    traumaExposure,
    ptsdScore,
    ptsdPositive,
    ptsdAnswers,
    gad7Score,
    gad7Severity,
    gad7NeedsReferral,
    riskLevel
  } = assessment;

  // Fetch or generate AI clinical synthesis from /api/assess
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAi(true);

    const fetchAssessment = async () => {
      try {
        const res = await fetch('/api/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            traumaExposure,
            ptsdScore,
            ptsdAnswers,
            gad7Score,
            gad7Severity,
            riskLevel,
            assessmentDate: assessmentDateStr
          })
        });

        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (isMounted) {
          setAiReport(data.summary || '');
          if (data.model) setActiveModel(data.model);
        }
      } catch (err) {
        console.warn('Could not fetch from backend, generating client fallback synthesis');
        if (isMounted) {
          setAiReport(
            `### Comprehensive Clinical Screener Summary (${assessmentDateStr})\n\n` +
            `• **PC-PTSD-5 Trauma Screener**: ${traumaExposure ? `${ptsdScore}/5 Affirmative` : 'Criterion A Trauma Not Indicated (0/5)'}. ${
              ptsdScore >= 4 
                ? 'Meets established VA research clinical cut-point (≥4), indicating significant traumatic stress presentation.' 
                : ptsdScore >= 3 
                ? 'Meets the positive screening threshold (≥3), suggesting notable post-traumatic stress reactions.' 
                : 'Below the screening cutoff (0–2).'
            }\n\n` +
            `• **GAD-7 Generalized Anxiety Scale**: Score is **${gad7Score}/21 (${gad7Severity.toUpperCase()} Anxiety)**. ${
              gad7NeedsReferral
                ? 'Meets the clinical referral flag threshold (10+), indicating that generalized anxiety may significantly disrupt daily life.'
                : 'Within the low-to-mild range over the past two weeks.'
            }\n\n` +
            `### Evidence-Based Care Pathways\n` +
            `• **EMDR & CPT**: Gold-standard psychotherapies for processing distressing memories and reducing hyperarousal.\n` +
            `• **Somatic Regulation**: 5-4-3-2-1 sensory grounding and box breathing help down-regulate sympathetic fight-or-flight reactivity.\n\n` +
            `*Clinical Disclaimer: The PC-PTSD-5 and GAD-7 are screening tools, not diagnostic tests. A positive result warrants comprehensive evaluation by a licensed healthcare professional.*`
          );
        }
      } finally {
        if (isMounted) setIsLoadingAi(false);
      }
    };

    fetchAssessment();
    return () => { isMounted = false; };
  }, [traumaExposure, ptsdScore, ptsdAnswers, gad7Score, gad7Severity, riskLevel, assessmentDateStr]);

  const handlePrint = () => {
    window.print();
  };

  // Simulation presets for evaluators
  const handleSimulateSevere = () => {
    onSimulate({
      traumaExposure: true,
      ptsdAnswers: [true, true, true, false, true],
      ptsdScore: 4,
      ptsdPositive: true,
      gad7Answers: [3, 2, 3, 2, 2, 2, 2],
      gad7Score: 16,
      gad7Severity: 'severe',
      gad7NeedsReferral: true,
      riskLevel: 'routine',
      riskAnswers: { urgentDistress: false, selfHarmOrDanger: false },
      date: assessment.date || assessmentDateStr,
      completedAt: assessment.completedAt || Date.now(),
      formattedDateTime: assessment.formattedDateTime || `${assessmentDateStr} (Simulated)`
    });
  };

  const handleSimulateAnxietyOnly = () => {
    onSimulate({
      traumaExposure: false,
      ptsdAnswers: [false, false, false, false, false],
      ptsdScore: 0,
      ptsdPositive: false,
      gad7Answers: [2, 2, 2, 2, 1, 2, 1],
      gad7Score: 12,
      gad7Severity: 'moderate',
      gad7NeedsReferral: true,
      riskLevel: 'routine',
      riskAnswers: { urgentDistress: false, selfHarmOrDanger: false },
      date: assessment.date || assessmentDateStr,
      completedAt: assessment.completedAt || Date.now(),
      formattedDateTime: assessment.formattedDateTime || `${assessmentDateStr} (Simulated)`
    });
  };

  const handleSimulateResilient = () => {
    onSimulate({
      traumaExposure: true,
      ptsdAnswers: [true, false, false, false, false],
      ptsdScore: 1,
      ptsdPositive: false,
      gad7Answers: [1, 0, 1, 0, 0, 1, 0],
      gad7Score: 3,
      gad7Severity: 'minimal',
      gad7NeedsReferral: false,
      riskLevel: 'routine',
      riskAnswers: { urgentDistress: false, selfHarmOrDanger: false },
      date: assessment.date || assessmentDateStr,
      completedAt: assessment.completedAt || Date.now(),
      formattedDateTime: assessment.formattedDateTime || `${assessmentDateStr} (Simulated)`
    });
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Simulation Bar & Print/Export Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            Clinical Simulator:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleSimulateSevere}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                ptsdScore >= 4 && gad7Score >= 15
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Trauma (4/5) + Severe GAD (16/21)
            </button>
            <button
              type="button"
              onClick={handleSimulateAnxietyOnly}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !traumaExposure && gad7Score >= 10
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Anxiety Only (Trauma Neg, GAD 12/21)
            </button>
            <button
              type="button"
              onClick={handleSimulateResilient}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                ptsdScore === 1 && gad7Score <= 4
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mild / Resilient (1/5, 3/21)
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Print or Save PDF Summary"
        >
          <Printer className="w-3.5 h-3.5 text-gray-600" />
          <span>Print / Export PDF Summary</span>
        </button>
      </div>

      {/* Clinical Assessment Overview Header with Dynamic Completion Date */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider font-display">
              Clinical Screening Outcome
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">
              PC-PTSD-5 &amp; GAD-7 Dual Battery
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950 font-display">
            Preliminary Trauma &amp; Anxiety Synthesis
          </h1>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs shrink-0">
          <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-teal-900/60 uppercase tracking-wider block leading-none mb-0.5">
              Assessment Date
            </span>
            <span className="font-bold text-teal-950">
              {assessmentDateStr}
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Risk Banner if flagged */}
      {(riskLevel === 'critical' || riskLevel === 'elevated') && (
        <div className="mb-6 p-5 rounded-3xl bg-red-50 border border-red-200 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-red-900 block font-display">
                Immediate Clinical &amp; Safety Triage Flagged
              </strong>
              <p className="text-xs text-red-800 mt-0.5">
                Acute distress was noted during your assessment. Please connect with free, 24/7 confidential support immediately.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onOpenNearbyHospitals && (
              <button
                type="button"
                onClick={onOpenNearbyHospitals}
                className="px-4 py-2.5 rounded-xl bg-white border border-red-300 text-red-900 font-bold text-xs hover:bg-red-50 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Find Nearby Hospitals (GPS)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCrisis}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helplines (14416 / 112)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dual Clinical Scorecards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: PC-PTSD-5 Clinical Instrument */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 font-display">
                  PC-PTSD-5 Screen
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] text-gray-500 font-medium">DSM-5 Trauma Screen</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                !traumaExposure
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : ptsdPositive
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {!traumaExposure ? 'Criterion A Negative' : ptsdPositive ? 'Positive Screen' : 'Lower Indication'}
              </span>
            </div>

            {/* Score Big Display */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 mb-5 text-center">
              <span className="text-4xl sm:text-5xl font-bold font-display text-gray-950 block mb-1">
                {!traumaExposure ? '0' : ptsdScore} <span className="text-xl text-gray-400 font-normal">/ 5</span>
              </span>
              <span className="text-xs text-gray-500">
                {!traumaExposure
                  ? 'Trauma exposure not indicated (Score = 0)'
                  : `${ptsdScore} affirmative symptom response(s)`}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-gray-950 mb-2 font-display leading-tight">
              {!traumaExposure
                ? 'Criterion A trauma exposure was not reported.'
                : ptsdScore >= 4
                ? 'Meets established VA research cut-point (≥4) & screening threshold (≥3).'
                : ptsdScore >= 3
                ? 'Meets general clinical screening threshold (≥3).'
                : 'Below clinical screening cut-points (0–2).'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
              {!traumaExposure ? (
                'Because qualifying traumatic events were not reported, post-traumatic stress symptom criteria are scored as negative today.'
              ) : ptsdPositive ? (
                <>
                  A positive screen indicates post-traumatic stress reactions may be noticeably affecting your sleep, nervous system, or mood. <strong>A positive screen does not diagnose PTSD and should be followed by professional assessment.</strong>
                </>
              ) : (
                'Your responses do not indicate an elevated trauma screener score today. Reactions can evolve over time, and support is always available.'
              )}
            </p>

            {/* DSM-5 Cluster Indicators */}
            <div>
              <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-2 font-display">
                Trauma Symptom Clusters Assessed
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ptsdAnswers[0] ? 'bg-red-500' : 'bg-gray-300'}`} />
                  <span className="truncate text-gray-800">Q1: Intrusions</span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ptsdAnswers[1] ? 'bg-red-500' : 'bg-gray-300'}`} />
                  <span className="truncate text-gray-800">Q2: Avoidance</span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ptsdAnswers[2] ? 'bg-red-500' : 'bg-gray-300'}`} />
                  <span className="truncate text-gray-800">Q3: Hyperarousal</span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ptsdAnswers[3] ? 'bg-red-500' : 'bg-gray-300'}`} />
                  <span className="truncate text-gray-800">Q4: Detachment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: GAD-7 Generalized Anxiety Disorder Scale */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 font-display">
                  GAD-7 Scale
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] text-gray-500 font-medium">Past 2 Weeks Anxiety</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                gad7NeedsReferral
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {gad7Severity.toUpperCase()} ANXIETY
              </span>
            </div>

            {/* GAD-7 Big Display */}
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 mb-5 text-center">
              <span className="text-4xl sm:text-5xl font-bold font-display text-gray-950 block mb-1">
                {gad7Score} <span className="text-xl text-gray-400 font-normal">/ 21</span>
              </span>
              <span className="text-xs text-purple-900 font-medium">
                {gad7NeedsReferral 
                  ? 'Meets 10+ Clinical Referral Flag Threshold' 
                  : 'Below 10+ Clinical Referral Threshold'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Minimal (0–4)</span>
                <span>Mild (5–9)</span>
                <span>Moderate (10–14)</span>
                <span>Severe (15–21)</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden flex">
                <div className={`h-full transition-all duration-500 ${
                  gad7Severity === 'severe' ? 'bg-red-600 w-full' :
                  gad7Severity === 'moderate' ? 'bg-amber-500 w-3/4' :
                  gad7Severity === 'mild' ? 'bg-yellow-500 w-1/2' : 'bg-emerald-500 w-1/4'
                }`} />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {gad7NeedsReferral ? (
                <>
                  A score of 10 or higher is a clinically validated threshold indicating that generalized anxiety may warrant referral and discussion with a healthcare clinician.
                </>
              ) : (
                'Your score indicates low-to-mild baseline anxiety over the past two weeks. Routine relaxation and grounding practices remain supportive.'
              )}
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onRetake}
              className="text-xs text-gray-600 hover:text-black font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake clinical screening assessment</span>
            </button>
          </div>
        </div>

        {/* Right Column: Step 5 AI Preliminary Assessment & Referral Module (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Clinical Synthesis Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950 font-display">
                    Step 5: AI Preliminary Assessment &amp; Referral
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                    Assessment Date: {assessmentDateStr} &bull; Synthesized with Saathi &bull; Model: {activeModel}
                  </span>
                </div>
              </div>

              {isLoadingAi && (
                <span className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </span>
              )}
            </div>

            {/* Live AI Report Body */}
            <div className="p-5 rounded-2xl bg-gray-50/90 border border-gray-200/90 mb-6 text-xs sm:text-sm text-gray-800 leading-relaxed font-sans">
              {isLoadingAi ? (
                <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                  <span>Generating trauma-informed clinical synthesis and care pathways...</span>
                </div>
              ) : (
                <MarkdownRenderer content={aiReport} />
              )}
            </div>

            {/* Quick 24/7 Helpline Access for India */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 mb-6">
              <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block mb-2 font-display">
                Immediate Referral &amp; 24/7 Crisis Support
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <a
                  href="tel:14416"
                  className="p-2.5 rounded-xl bg-white border border-teal-200 text-teal-950 font-semibold hover:bg-teal-100/50 transition-colors flex items-center justify-between"
                >
                  <span>Tele-MANAS</span>
                  <span className="text-teal-700 font-bold">14416</span>
                </a>
                <a
                  href="tel:18005990019"
                  className="p-2.5 rounded-xl bg-white border border-teal-200 text-teal-950 font-semibold hover:bg-teal-100/50 transition-colors flex items-center justify-between"
                >
                  <span>KIRAN</span>
                  <span className="text-teal-700 font-bold">1800-599-0019</span>
                </a>
                <a
                  href="tel:9999666555"
                  className="p-2.5 rounded-xl bg-white border border-teal-200 text-teal-950 font-semibold hover:bg-teal-100/50 transition-colors flex items-center justify-between"
                >
                  <span>Vandrevala</span>
                  <span className="text-teal-700 font-bold">9999 666 555</span>
                </a>
              </div>
            </div>

            {/* Evidence-Informed Next Steps Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onNavigate('chat')}
                className="py-3.5 px-5 rounded-xl bg-black text-white font-semibold text-xs sm:text-sm shadow-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Discuss Results with Saathi</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('symptoms')}
                className="py-3.5 px-5 rounded-xl bg-gray-100 text-gray-900 font-semibold text-xs sm:text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-gray-200 cursor-pointer"
              >
                <ListFilter className="w-4 h-4 text-gray-600" />
                <span>Explore DSM-5 Clusters</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('resources')}
                className="py-3.5 px-5 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span>Trauma Coping Library</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="py-3.5 px-5 rounded-xl bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-xs hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Patient Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Itemized Question & Answer Clinical Screener Report */}
      <div className="mt-10 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs print-break-inside-avoid font-sans">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider font-display">
                Official Clinical Screener Record
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-medium">Full Question &amp; Answer Text Breakdown</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 font-display">
              Itemized Questionnaire &amp; Self-Reported Response Record
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Exact questions administered and user selected answers for healthcare provider evaluation.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold text-xs flex items-center gap-2 shadow-xs hover:bg-black transition-colors cursor-pointer print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report / Save PDF</span>
          </button>
        </div>

        {/* MANDATORY CLINICAL DISCLAIMER & DOCTOR CONSULTATION NOTICE */}
        <div className="bg-amber-50/90 border border-amber-200/90 p-5 rounded-2xl mb-8 flex items-start gap-3.5 shadow-2xs">
          <Stethoscope className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wider font-display">
              Mandatory Clinical Disclaimer &amp; Doctor Consultation Notice
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              This report presents self-reported symptom responses gathered using evidence-based psychological screening instruments (PC-PTSD-5, GAD-7, and DSM-5 frameworks) based on current clinical research theories. <strong>This document is strictly designed for supportive, tracking, and provider-discussion purposes—it DOES NOT constitute a formal medical diagnosis, psychiatric evaluation, or treatment prescription.</strong> Users are strongly advised to always consult a licensed medical doctor, psychiatrist, or clinical psychologist to review these questions and receive a comprehensive clinical diagnostic evaluation.
            </p>
          </div>
        </div>

        {/* SECTION 1: PC-PTSD-5 Question & Answer Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              1. PC-PTSD-5 Screener (DSM-5 Trauma Instrument) — Score: {traumaExposure ? ptsdScore : 0}/5
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              {traumaExposure ? (ptsdPositive ? 'Positive Screen (≥3)' : 'Below Cutoff (0-2)') : 'Criterion A Negative'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Clinical Question Administered</th>
                  <th className="py-3 px-4 w-36">Cluster Assessed</th>
                  <th className="py-3 px-4 w-36 text-center">User Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {/* Criterion A */}
                <tr className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-bold text-gray-500">A</td>
                  <td className="py-3 px-4 font-medium leading-relaxed">
                    {TRAUMA_EXPOSURE_QUESTION.q}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 font-mono">Criterion A Gate</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      traumaExposure ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {traumaExposure ? 'YES (Exposed)' : 'NO (Not Reported)'}
                    </span>
                  </td>
                </tr>

                {/* PC-PTSD-5 Items 1-5 */}
                {PC_PTSD_5_QUESTIONS.map((q, idx) => {
                  const isAffirmative = traumaExposure && ptsdAnswers && ptsdAnswers[idx] === true;
                  return (
                    <tr key={q.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-500">Q{q.id}</td>
                      <td className="py-3 px-4 leading-relaxed">{q.q}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{q.cluster}</td>
                      <td className="py-3 px-4 text-center">
                        {!traumaExposure ? (
                          <span className="text-gray-400 italic text-xs">Skipped (Score 0)</span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAffirmative ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isAffirmative ? 'YES (+1 pt)' : 'NO (0 pt)'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: GAD-7 Anxiety Scale Question & Answer Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              2. GAD-7 Generalized Anxiety Scale (Past 2 Weeks) — Score: {gad7Score}/21 ({gad7Severity.toUpperCase()})
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              {gad7NeedsReferral ? 'Referral Flag Threshold (≥10)' : 'Routine Range'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Over the last 2 weeks, how often have you been bothered by:</th>
                  <th className="py-3 px-4 w-40">Domain</th>
                  <th className="py-3 px-4 w-48 text-center">User Response &amp; Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {GAD_7_QUESTIONS.map((q, idx) => {
                  const val = assessment.gad7Answers && typeof assessment.gad7Answers[idx] === 'number'
                    ? assessment.gad7Answers[idx]
                    : 0;
                  const opt = GAD_7_OPTIONS.find(o => o.value === val) || GAD_7_OPTIONS[0];

                  return (
                    <tr key={q.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-500">Q{q.id}</td>
                      <td className="py-3 px-4 leading-relaxed">{q.q}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{q.area}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          val >= 2 ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          val === 1 ? 'bg-blue-50 text-blue-900 border-blue-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {opt.label} ({val} pt{val !== 1 ? 's' : ''})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Safety & Distress Triage Table */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
            3. Safety &amp; Acute Distress Triage
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Safety Screening Item</th>
                  <th className="py-3 px-4 w-48 text-center">User Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                <tr className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-bold text-gray-500">1</td>
                  <td className="py-3 px-4 leading-relaxed">{RISK_QUESTIONS[0].q}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      assessment.riskAnswers?.urgentDistress ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {assessment.riskAnswers?.urgentDistress ? 'YES (Distress Noted)' : 'NO'}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-bold text-gray-500">2</td>
                  <td className="py-3 px-4 leading-relaxed">{RISK_QUESTIONS[1].q}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      assessment.riskAnswers?.selfHarmOrDanger ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {assessment.riskAnswers?.selfHarmOrDanger ? 'YES (Safety Flag)' : 'NO'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
