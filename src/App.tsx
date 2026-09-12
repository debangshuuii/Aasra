import React, { useState, useEffect } from 'react';
import { ViewId, AssessmentCompositeResult, AssessmentRecord, DailyCheckIn, Who5Record } from './types';
import { 
  calculatePcPtsd5Score, 
  calculateGad7Score, 
  getGad7Severity, 
  determineRiskLevel,
  INITIAL_HISTORY,
  loadStoredCheckIns,
  saveStoredCheckIns,
  loadStoredHistory,
  saveStoredHistory,
  loadStoredWho5,
  saveStoredWho5,
  formatDateKey,
  formatDisplayDate
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
import { WellbeingView } from './views/WellbeingView';

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

  // Saved Screening History - init with guest store (user scope applied after auth loads)
  const [historyList, setHistoryList] = useState<AssessmentRecord[]>(() => loadStoredHistory());

  // Daily Check-ins State (persisted locally)
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => loadStoredCheckIns());
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isPreviousCheckInsModalOpen, setIsPreviousCheckInsModalOpen] = useState<boolean>(false);

  // WHO-5 Well-Being Assessment Records (persisted locally)
  const [who5Records, setWho5Records] = useState<Who5Record[]>(() => loadStoredWho5());
  const [wellbeingSection, setWellbeingSection] = useState<'overview' | 'assessment'>('overview');

  const { user } = useAuth();

  // Switch to the user-scoped localStorage store and load Supabase data when user changes
  useEffect(() => {
    const userId = user?.id;

    // Load the correct scoped local data for this user (or guest)
    const localHistory = loadStoredHistory(userId);
    const localCheckIns = loadStoredCheckIns(userId);
    const localWho5 = loadStoredWho5(userId);
    setHistoryList(localHistory);
    setCheckIns(localCheckIns);
    setWho5Records(localWho5);

    if (!userId) return;

    // Merge Supabase cloud assessments for this user
    const loadSupabaseData = async () => {
      try {
        const { data: assessmentsData, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && assessmentsData && assessmentsData.length > 0) {
          const mapped: AssessmentRecord[] = assessmentsData.map((item: any) => ({
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: new Date(item.created_at).getTime(),
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
          // Save merged cloud records to user-scoped localStorage
          saveStoredHistory(mapped, userId);
          setHistoryList(mapped);
        }

        // Also fetch check-ins from Supabase
        const { data: checkInData, error: ciError } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .order('checkin_date', { ascending: false });

        if (!ciError && checkInData && checkInData.length > 0) {
          const mappedCheckIns: DailyCheckIn[] = checkInData.map((item: any) => ({
            id: item.id,
            date: item.checkin_date,
            displayDate: item.display_date || new Date(item.checkin_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: new Date(item.checkin_date).getTime(),
            mood: item.mood,
            moodLabel: item.mood_label,
            dayOverall: item.day_overall,
            stressLevel: item.stress_level,
            sleepQuality: item.sleep_quality,
            feltSupported: item.felt_supported,
            notes: item.notes,
          }));
          saveStoredCheckIns(mappedCheckIns, userId);
          setCheckIns(mappedCheckIns);
        }
      } catch (e) {
        console.warn('[App] Could not fetch user data from Supabase:', e);
      }
    };
    loadSupabaseData();
  }, [user]);

  const handleSaveCheckIn = (newCheckIn: DailyCheckIn) => {
    const userId = user?.id;
    setCheckIns(prev => {
      const filtered = prev.filter(c => c.date !== newCheckIn.date);
      const updated = [newCheckIn, ...filtered];
      saveStoredCheckIns(updated, userId);
      return updated;
    });

    // Sync to Supabase if patient is signed in
    if (userId) {
      supabase.from('daily_checkins').insert({
        user_id: userId,
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

  const handleSaveWho5 = (newRecord: Who5Record) => {
    const userId = user?.id;
    setWho5Records(prev => {
      const existingIdx = prev.findIndex(r => r.dateKey === newRecord.dateKey);
      const updated = existingIdx >= 0
        ? prev.map((r, i) => (i === existingIdx ? newRecord : r))
        : [newRecord, ...prev];
      saveStoredWho5(updated, userId);
      return updated;
    });

    // Optional Supabase sync (table must exist — see supabase_schema.sql)
    if (userId) {
      supabase.from('who5_assessments').upsert({
        user_id: userId,
        raw_score: newRecord.rawScore,
        percent_score: newRecord.percentScore,
        answers: newRecord.answers,
        assessment_date: newRecord.dateKey,
      }, { onConflict: 'user_id,assessment_date' }).then(({ error }) => {
        if (error) console.warn('[App] Supabase WHO-5 sync error (table may not exist yet):', error.message);
      });
    }
  };

  const todayKey = formatDateKey(new Date());
  const todayCheckIn = checkIns.find(c => c.date === todayKey);

  // Computed / Current Composite Assessment Result
  const initialNow = new Date();
  const initialDateStr = initialNow.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const initialTimeStr = initialNow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

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
    },
    date: initialDateStr,
    completedAt: initialNow.getTime(),
    formattedDateTime: `${initialDateStr} at ${initialTimeStr}`
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedDateTime = `${dateStr} at ${timeStr}`;

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
      },
      date: dateStr,
      completedAt: now.getTime(),
      formattedDateTime
    };

    setCurrentAssessment(completed);

    // Save to historical timeline log
    const newRecord: AssessmentRecord = {
      id: `rec-${Date.now()}`,
      date: dateStr,
      timestamp: now.getTime(),
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

    setHistoryList(prev => {
      const updated = [newRecord, ...prev];
      saveStoredHistory(updated, user?.id);
      return updated;
    });

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

    const formattedDateTime = rec.timestamp
      ? `${rec.date} at ${new Date(rec.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      : rec.date;

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
      riskAnswers: { urgentDistress: false, selfHarmOrDanger: false },
      date: rec.date,
      completedAt: rec.timestamp,
      formattedDateTime
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
              onOpenGrounding={() => setIsGroundingModalOpen(true)}
              onOpenCrisis={() => setIsCrisisModalOpen(true)}
              historyList={historyList}
              who5Records={who5Records}
              onStartAssessment={() => {
                setWellbeingSection('assessment');
                handleNavigate('wellbeing');
              }}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              historyList={historyList}
              onClearHistory={() => {
                setHistoryList([]);
                saveStoredHistory([], user?.id);
              }}
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

          {currentView === 'wellbeing' && (
            <WellbeingView
              initialSection={wellbeingSection}
              onNavigate={(view) => {
                setWellbeingSection('overview');
                handleNavigate(view);
              }}
              who5Records={who5Records}
              onSaveWho5={handleSaveWho5}
              checkIns={checkIns}
              onOpenCheckIn={() => setIsCheckInModalOpen(true)}
              onOpenPreviousCheckIns={() => setIsPreviousCheckInsModalOpen(true)}
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
