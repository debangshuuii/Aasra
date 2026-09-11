export type ViewId =
  | 'landing'
  | 'consent'
  | 'safety'
  | 'intro'
  | 'assessment'
  | 'results'
  | 'symptoms'
  | 'chat'
  | 'resources'
  | 'dashboard'
  | 'history'
  | 'states';

export interface Question {
  id: number;
  q: string;
  why: string;
  cluster: string;
}

export interface Gad7Question {
  id: number;
  q: string;
  why: string;
  area: string;
}

export type Gad7Severity = 'minimal' | 'mild' | 'moderate' | 'severe';

export type RiskLevel = 'routine' | 'elevated' | 'critical';

export interface AssessmentCompositeResult {
  traumaExposure: boolean | null;
  ptsdAnswers: (boolean | null)[];
  ptsdScore: number; // 0 to 5
  ptsdPositive: boolean; // score >= 3 (note VA cut-point is 4)
  gad7Answers: (number | null)[]; // 7 answers (0 to 3)
  gad7Score: number; // 0 to 21
  gad7Severity: Gad7Severity;
  gad7NeedsReferral: boolean; // score >= 10
  riskLevel: RiskLevel;
  riskAnswers: {
    urgentDistress: boolean | null;
    selfHarmOrDanger: boolean | null;
  };
  aiSummary?: string;
  date?: string; // Formatted date string (e.g. 'Sep 11, 2026')
  completedAt?: number; // Exact completion epoch timestamp
  formattedDateTime?: string; // e.g. 'Sep 11, 2026 at 3:45 PM'
}

export interface SymptomCluster {
  id: string;
  number: number;
  name: string;
  description: string;
  screenedIn: string;
  iconName: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: 'crisis' | 'grounding' | 'care' | 'sleep';
  badge: string;
  meta: string;
  description: string;
  actionType: 'modal' | 'external' | 'tel';
  actionUrl?: string;
  actionLabel: string;
  isBookmarked?: boolean;
}

export interface AssessmentRecord {
  id: string;
  date: string;
  timestamp?: number;
  score: number; // PC-PTSD-5 score
  total: number;
  isPositive: boolean;
  statusText: string;
  summary: string;
  answers: (boolean | null)[];
  traumaExposure?: boolean;
  gad7Score?: number;
  gad7Severity?: Gad7Severity;
  riskLevel?: RiskLevel;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  isFallback?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatHistoryAuth {
  isConfigured: boolean;
  salt: string;
  pinHash: string;
  updatedAt: number;
}

export interface GroundingStep {
  step: number;
  title: string;
  iconName: string;
  text: string;
}

export interface DailyCheckIn {
  id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  displayDate: string; // e.g. 'Wed, Sep 9, 2026'
  timestamp: number;
  mood: 1 | 2 | 3 | 4 | 5 | null; // 1: Very Low, 2: Low, 3: Okay, 4: Good, 5: Very Good, null: Prefer not to say
  moodLabel: string;
  dayOverall: string;
  stressLevel: string;
  sleepQuality: string;
  feltSupported: string;
  notes?: string;
}

export interface WeeklyTrendDay {
  dayName: string; // 'Mon', 'Tue', etc.
  fullDayName: string; // 'Monday', 'Tuesday', etc.
  dateStr: string; // 'YYYY-MM-DD'
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
  checkIn?: DailyCheckIn;
}
