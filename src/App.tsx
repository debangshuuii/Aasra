import React, { useState, useEffect } from 'react';
import { ViewId, AssessmentCompositeResult, AssessmentRecord, DailyCheckIn } from './types';
import { 
  calculatePcPtsd5Score, 
  calculateGad7Score, 
  getGad7Severity, 
  determineRiskLevel, 
  INITIAL_HISTORY,
  loadStoredCheckIns,
  saveStoredCheckIns,
  formatDateKey
} from './data/screeningData';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CrisisModal } from './components/CrisisModal';
import { GroundingModal } from './components/GroundingModal';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { PreviousCheckInsModal } from './components/PreviousCheckInsModal';
import { AuthModal } from './components/AuthModal';
import { NearbyEmergencyModal } from './components/NearbyEmergencyModal';
import { useAuth } from './context/AuthContext';
import { supabase } from './utils/supabaseClient';

import { LandingView } from './views/LandingView';
import { ConsentView } from './views/ConsentView';
import { SafetyView } from './views/SafetyView';
import { IntroView } from './views/IntroView';
import { QuestionnaireView } from './views/QuestionnaireView';
import { ResultsView } from './views/ResultsView';
import { SymptomsView } from './views/SymptomsView';
import { ChatView } from './views/ChatView';
import { ResourcesView } from './views/ResourcesView';
import { DashboardView } from './views/DashboardView';
import { HistoryView } from './views/HistoryView';
import { StatesView } from './views/StatesView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewId>('landing');
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);
  const [isGroundingModalOpen, setIsGroundingModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isNearbyEmergencyModalOpen, setIsNearbyEmergencyModalOpen] = useState<boolean>(false);

  // Active Questionnaire Responses
  const [traumaExposure, setTraumaExposure] = useState<boolean | null>(null);
  const [ptsdAnswers, setPtsdAnswers] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [gad7Answers, setGad7Answers] = useState<(number | null)[]>([null, null, null, null, null, null, null]);
  const [urgentDistress, setUrgentDistress] = useState<boolean | null>(null);
  const [selfHarmOrDanger, setSelfHarmOrDanger] = useState<boolean | null>(null);

  // Saved Screening History
  const [historyList, setHistoryList] = useState<AssessmentRecord[]>(INITIAL_HISTORY);

  // Daily Check-ins State (persisted locally)
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => loadStoredCheckIns());
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isPreviousCheckInsModalOpen, setIsPreviousCheckInsModalOpen] = useState<boolean>(false);

  const { user } = useAuth();

  // Load user's saved screenings from Supabase upon login
  useEffect(() => {
    if (!user) return;
    const loadSupabaseData = async () => {
      try {
        const { data: assessmentsData, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && assessmentsData && assessmentsData.length > 0) {
          const mapped: AssessmentRecord[] = assessmentsData.map((item: any) => ({
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            score: item.ptsd_score,
            total: 5,
            isPositive: item.ptsd_positive,
            statusText: !item.trauma_exposure ? 'Trauma Neg (0/5)' : item.ptsd_positive ? 'Positive PTSD Screen' : 'Lower Indication (0–2)',
            summary: item.ai_summary || `Screening Record: PC-PTSD-5: ${item.ptsd_score}/5, GAD-7: ${item.gad7_score}/21.`,
            answers: item.ptsd_answers || [],
            traumaExposure: item.trauma_exposure,
            gad7Score: item.gad7_score,
            gad7Severity: item.gad7_severity,
            riskLevel: item.risk_level,
          }));
          setHistoryList(mapped);
        }
      } catch (e) {
        console.warn('[App] Could not fetch user assessments from Supabase:', e);
      }
    };
    loadSupabaseData();
  }, [user]);

  const handleSaveCheckIn = (newCheckIn: DailyCheckIn) => {
    setCheckIns(prev => {
      const filtered = prev.filter(c => c.date !== newCheckIn.date);
      const updated = [newCheckIn, ...filtered];
      saveStoredCheckIns(updated);
      return updated;
    });

    // Sync to Supabase if patient is signed in
    if (user) {
      supabase.from('daily_checkins').insert({
        user_id: user.id,
        checkin_date: newCheckIn.date,
        display_date: newCheckIn.displayDate,
        mood: newCheckIn.mood,
        mood_label: newCheckIn.moodLabel,
        day_overall: newCheckIn.dayOverall,
        stress_level: newCheckIn.stressLevel,
        sleep_quality: newCheckIn.sleepQuality,
        felt_supported: newCheckIn.feltSupported,
        notes: newCheckIn.notes,
      }).then(({ error }) => {
        if (error) console.warn('[App] Supabase check-in sync error:', error.message);
      });
    }
  };

  const todayKey = formatDateKey(new Date());
  const todayCheckIn = checkIns.find(c => c.date === todayKey);

  // Computed / Current Composite Assessment Result
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentCompositeResult>({
    traumaExposure: true,
    ptsdAnswers: [true, true, true, false, true],
    ptsdScore: 4,
    ptsdPositive: true,
    gad7Answers: [2, 2, 2, 2, 2, 2, 2],
    gad7Score: 14,
    gad7Severity: 'moderate',
    gad7NeedsReferral: true,
    riskLevel: 'routine',
    riskAnswers: {
      urgentDistress: false,
      selfHarmOrDanger: false,
    }
  });

  // Always glide smoothly to the top whenever navigation changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleNavigate = (view: ViewId) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleStartAssessment = () => {
    setTraumaExposure(null);
    setPtsdAnswers([null, null, null, null, null]);
    setGad7Answers([null, null, null, null, null, null, null]);
    setUrgentDistress(null);
    setSelfHarmOrDanger(null);
    handleNavigate('assessment');
  };

  const handleSetPtsdAnswer = (index: number, val: boolean) => {
    setPtsdAnswers(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleSetGad7Answer = (index: number, val: number) => {
    setGad7Answers(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleCompleteAssessment = () => {
    const ptsdScore = calculatePcPtsd5Score(traumaExposure, ptsdAnswers);
    const ptsdPositive = ptsdScore >= 3;
    const gad7Score = calculateGad7Score(gad7Answers);
    const gad7Severity = getGad7Severity(gad7Score);
    const gad7NeedsReferral = gad7Score >= 10;
    const riskLevel = determineRiskLevel(urgentDistress, selfHarmOrDanger);

    const completed: AssessmentCompositeResult = {
      traumaExposure,
      ptsdAnswers,
      ptsdScore,
      ptsdPositive,
      gad7Answers,
      gad7Score,
      gad7Severity,
      gad7NeedsReferral,
      riskLevel,
      riskAnswers: {
        urgentDistress,
        selfHarmOrDanger
      }
    };

    setCurrentAssessment(completed);

    // Save to historical timeline log
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newRecord: AssessmentRecord = {
      id: `rec-${Date.now()}`,
      date: dateStr,
      score: ptsdScore,
      total: 5,
      isPositive: ptsdPositive,
      statusText: !traumaExposure ? 'Trauma Neg (0/5)' : ptsdPositive ? 'Positive PTSD Screen' : 'Lower Indication (0–2)',
      summary: !traumaExposure
        ? `Criterion A trauma exposure was not reported (PC-PTSD-5: 0/5). GAD-7 Anxiety Score: ${gad7Score}/21 (${gad7Severity.toUpperCase()}).`
        : `Reported PC-PTSD-5 score of ${ptsdScore}/5 and GAD-7 anxiety score of ${gad7Score}/21 (${gad7Severity.toUpperCase()}). ${gad7NeedsReferral ? 'Referral threshold exceeded.' : ''}`,
      answers: ptsdAnswers,
      traumaExposure: !!traumaExposure,
      gad7Score,
      gad7Severity,
      riskLevel
    };

    setHistoryList(prev => [newRecord, ...prev]);

    // Sync to Supabase if patient is signed in
    if (user) {
      supabase.from('assessments').insert({
        user_id: user.id,
        trauma_exposure: !!traumaExposure,
        ptsd_score: ptsdScore,
        ptsd_positive: ptsdPositive,
        ptsd_answers: ptsdAnswers,
        gad7_score: gad7Score,
        gad7_severity: gad7Severity,
        gad7_needs_referral: gad7NeedsReferral,
        gad7_answers: gad7Answers,
        risk_level: riskLevel,
        urgent_distress: !!urgentDistress,
        self_harm_or_danger: !!selfHarmOrDanger,
        ai_summary: newRecord.summary
      }).then(({ error }) => {
        if (error) console.warn('[App] Supabase assessment sync error:', error.message);
      });
    }

    handleNavigate('results');
  };

  const handleInspectRecord = (rec: AssessmentRecord) => {
    const isPositive = rec.score >= 3;
    const gadScore = rec.gad7Score ?? 8;
    const gadSev = rec.gad7Severity ?? getGad7Severity(gadScore);

    setCurrentAssessment({
      traumaExposure: rec.traumaExposure ?? (rec.score > 0),
      ptsdAnswers: rec.answers,
      ptsdScore: rec.score,
      ptsdPositive: isPositive,
      gad7Answers: [1, 1, 1, 1, 1, 1, 2],
      gad7Score: gadScore,
      gad7Severity: gadSev,
      gad7NeedsReferral: gadScore >= 10,
      riskLevel: rec.riskLevel ?? 'routine',
      riskAnswers: { urgentDistress: false, selfHarmOrDanger: false }
    });
    handleNavigate('results');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFC] text-[#1b1c1c] font-sans antialiased">
      {/* Top Application Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCrisis={() => setIsCrisisModalOpen(true)}
        onOpenGrounding={() => setIsGroundingModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-20 md:pb-10 bg-[#F5FAFC]">
        {/* Dynamic View Pane */}
        <div className="flex-1 flex flex-col w-full">
          {currentView === 'landing' && (
            <LandingView
              onNavigate={handleNavigate}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
            />
          )}

          {currentView === 'consent' && (
            <ConsentView onNavigate={handleNavigate} />
          )}

          {currentView === 'safety' && (
            <SafetyView
              onNavigate={handleNavigate}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
            />
          )}

          {currentView === 'intro' && (
            <IntroView
              onNavigate={handleNavigate}
              onStartAssessment={handleStartAssessment}
            />
          )}

          {currentView === 'assessment' && (
            <QuestionnaireView
              traumaExposure={traumaExposure}
              onSetTraumaExposure={setTraumaExposure}
              ptsdAnswers={ptsdAnswers}
              onSetPtsdAnswer={handleSetPtsdAnswer}
              gad7Answers={gad7Answers}
              onSetGad7Answer={handleSetGad7Answer}
              urgentDistress={urgentDistress}
              onSetUrgentDistress={setUrgentDistress}
              selfHarmOrDanger={selfHarmOrDanger}
              onSetSelfHarmOrDanger={setSelfHarmOrDanger}
              onComplete={handleCompleteAssessment}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
              onCancelOrBackToIntro={() => handleNavigate('intro')}
            />
          )}

          {currentView === 'results' && (
            <ResultsView
              assessment={currentAssessment}
              onSimulate={setCurrentAssessment}
              onNavigate={handleNavigate}
              onRetake={handleStartAssessment}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
              onOpenNearbyHospitals={() => setIsNearbyEmergencyModalOpen(true)}
            />
          )}

          {currentView === 'symptoms' && (
            <SymptomsView onNavigate={handleNavigate} />
          )}

          {currentView === 'chat' && (
            <ChatView
              onOpenGrounding={() => setIsGroundingModalOpen(true)}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
            />
          )}

          {currentView === 'resources' && (
            <ResourcesView
              onOpenGrounding={() => setIsGroundingModalOpen(true)}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView 
              onNavigate={handleNavigate}
              checkIns={checkIns}
              onOpenCheckIn={() => setIsCheckInModalOpen(true)}
              onOpenPreviousCheckIns={() => setIsPreviousCheckInsModalOpen(true)}
              onOpenGrounding={() => setIsGroundingModalOpen(true)}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              historyList={historyList}
              onClearHistory={() => setHistoryList([])}
              onNavigate={handleNavigate}
              onInspectRecord={handleInspectRecord}
              checkIns={checkIns}
              onOpenCheckIn={() => setIsCheckInModalOpen(true)}
            />
          )}

          {currentView === 'states' && (
            <StatesView
              onNavigate={handleNavigate}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Persistent Mobile Bottom Navigation */}
      <BottomNav currentView={currentView} onNavigate={handleNavigate} />

      {/* Urgent Crisis Support Modal */}
      <CrisisModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        onOpenNearbyHospitals={() => setIsNearbyEmergencyModalOpen(true)}
      />

      {/* Emergency Centers & Hospitals Locator Modal */}
      <NearbyEmergencyModal
        isOpen={isNearbyEmergencyModalOpen}
        onClose={() => setIsNearbyEmergencyModalOpen(false)}
      />

      {/* Patient Authentication (Google OAuth + Magic Link) Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* 5-4-3-2-1 Somatic Grounding Interactive Modal */}
      <GroundingModal
        isOpen={isGroundingModalOpen}
        onClose={() => setIsGroundingModalOpen(false)}
      />

      {/* Daily Mood & Wellbeing Check-in Modal */}
      <DailyCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSave={handleSaveCheckIn}
        todayCheckIn={todayCheckIn}
        onOpenGrounding={() => {
          setIsCheckInModalOpen(false);
          setIsGroundingModalOpen(true);
        }}
        onOpenCrisis={() => {
          setIsCheckInModalOpen(false);
          setIsCrisisModalOpen(true);
        }}
        onOpenChat={() => {
          setIsCheckInModalOpen(false);
          handleNavigate('chat');
        }}
      />

      {/* Previous Daily Check-ins History Modal */}
      <PreviousCheckInsModal
        isOpen={isPreviousCheckInsModalOpen}
        onClose={() => setIsPreviousCheckInsModalOpen(false)}
        checkIns={checkIns}
        onOpenCheckIn={() => {
          setIsPreviousCheckInsModalOpen(false);
          setIsCheckInModalOpen(true);
        }}
      />
    </div>
  );
}
