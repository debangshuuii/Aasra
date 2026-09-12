import { 
  Question, 
  Gad7Question, 
  Gad7Severity, 
  RiskLevel, 
  SymptomCluster, 
  ResourceItem, 
  GroundingStep, 
  AssessmentRecord,
  DailyCheckIn,
  WeeklyTrendDay,
  Who5Record
} from '../types';

export const TRAUMA_EXPOSURE_QUESTION: Question = {
  id: 0,
  q: 'Have you ever experienced an unusually frightening, horrible, or traumatic event, such as a serious accident/fire, physical or sexual assault or abuse, natural disaster, war, witnessing someone being killed or seriously injured, or losing someone through homicide or suicide?',
  why: 'This serves as the official PC-PTSD-5 Criterion A trauma exposure gate. In clinical practice, if someone has not experienced a qualifying traumatic stressor, the PTSD screener is scored as 0 and symptom questions are skipped.',
  cluster: 'Trauma Exposure (Criterion A)'
};

export const PC_PTSD_5_QUESTIONS: Question[] = [
  {
    id: 1,
    q: 'Had nightmares about the event(s) or thought about the event(s) when you did not want to?',
    why: 'This evaluates intrusive memories or involuntary re-experiencing, which is a hallmark indicator of post-traumatic stress.',
    cluster: 'Intrusive memories'
  },
  {
    id: 2,
    q: 'Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?',
    why: 'This screens for situational and psychological avoidance—a natural self-protective behavior that can inadvertently prolong stress.',
    cluster: 'Avoidance'
  },
  {
    id: 3,
    q: 'Been constantly on guard, watchful, or easily startled?',
    why: "This assesses autonomic nervous system arousal and hypervigilance, where the brain's alarm center (amygdala) remains active.",
    cluster: 'Hyperarousal & reactivity'
  },
  {
    id: 4,
    q: 'Felt numb or detached from people, activities, or your surroundings?',
    why: 'This gauges emotional blunting or depersonalization, often experienced when overwhelming emotions cause the body to numb itself.',
    cluster: 'Emotional detachment'
  },
  {
    id: 5,
    q: 'Felt guilty or unable to stop blaming yourself or others for the event(s) or problems caused by the event(s)?',
    why: 'This evaluates persistent negative alterations in cognitions, moral injury, and self-blame that frequently accompany traumatic events.',
    cluster: 'Negative cognitions & guilt'
  }
];

export const GAD_7_QUESTIONS: Gad7Question[] = [
  {
    id: 1,
    q: 'Feeling nervous, anxious, or on edge',
    why: 'Assesses psychomotor arousal, vigilance, and physical manifestations of anxiety.',
    area: 'Nervousness & Tension'
  },
  {
    id: 2,
    q: 'Not being able to stop or control worrying',
    why: 'Evaluates perceived loss of control over repetitive, intrusive worry processes.',
    area: 'Uncontrollable Worry'
  },
  {
    id: 3,
    q: 'Worrying too much about different things',
    why: 'Screens for generalized diffusion of worry across multiple life domains and scenarios.',
    area: 'Excessive Worry'
  },
  {
    id: 4,
    q: 'Trouble relaxing',
    why: 'Gauges baseline autonomic nervous tension and inability to settle into somatic rest.',
    area: 'Restlessness & Inability to Relax'
  },
  {
    id: 5,
    q: 'Being so restless that it is hard to sit still',
    why: 'Measures motor restlessness, somatic agitation, and physical release of nervous energy.',
    area: 'Psychomotor Agitation'
  },
  {
    id: 6,
    q: 'Becoming easily annoyed or irritable',
    why: 'Evaluates emotional reactivity, frustration tolerance, and sensory overload thresholds.',
    area: 'Irritability'
  },
  {
    id: 7,
    q: 'Feeling afraid, as if something awful might happen',
    why: 'Evaluates catastrophic anticipation, impending dread, and panic expectancy.',
    area: 'Catastrophic Dread'
  }
];

export const GAD_7_OPTIONS = [
  { value: 0, label: 'Not at all', subtitle: '0 days' },
  { value: 1, label: 'Several days', subtitle: '1–6 days' },
  { value: 2, label: 'More than half the days', subtitle: '7–11 days' },
  { value: 3, label: 'Nearly every day', subtitle: '12–14 days' }
];

export const RISK_QUESTIONS = [
  {
    id: 'risk-1',
    q: 'Are you currently feeling overwhelmed, in acute distress, or having difficulty staying safe?',
    why: 'Ensures immediate clinical safety support is prioritized before reviewing secondary evaluations.'
  },
  {
    id: 'risk-2',
    q: 'In the past two weeks, have you had thoughts of suicide, self-harm, or wishing you were not here?',
    why: 'Direct risk screening enables immediate referral to 24/7 confidential helplines (Tele-MANAS 14416 / 112).'
  }
];

export function calculatePcPtsd5Score(traumaExposure: boolean | null, ptsdAnswers: (boolean | null)[]): number {
  if (traumaExposure !== true) {
    return 0;
  }
  return ptsdAnswers.filter(ans => ans === true).length;
}

export function calculateGad7Score(gad7Answers: (number | null)[]): number {
  return gad7Answers.reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
}

export function getGad7Severity(score: number): Gad7Severity {
  if (score <= 4) return 'minimal';
  if (score <= 9) return 'mild';
  if (score <= 14) return 'moderate';
  return 'severe';
}

export function determineRiskLevel(urgentDistress: boolean | null, selfHarmOrDanger: boolean | null): RiskLevel {
  if (selfHarmOrDanger === true) return 'critical';
  if (urgentDistress === true) return 'elevated';
  return 'routine';
}

export const DSM5_CLUSTERS: SymptomCluster[] = [
  {
    id: 'cluster-1',
    number: 1,
    name: 'Intrusive Memories',
    description: 'Involuntary, distressing thoughts, recurrent nightmares, or emotional flashbacks where the event feels like it is happening again in real time.',
    screenedIn: 'Screened in PC-PTSD-5 Q1',
    iconName: 'Brain'
  },
  {
    id: 'cluster-2',
    number: 2,
    name: 'Avoidance',
    description: 'Deliberately avoiding thoughts, conversations, places, people, or activities that serve as painful sensory triggers of the event.',
    screenedIn: 'Screened in PC-PTSD-5 Q2',
    iconName: 'ShieldAlert'
  },
  {
    id: 'cluster-3',
    number: 3,
    name: 'Hyperarousal & Reactivity',
    description: 'The nervous system stays in "fight or flight"—characterized by being easily startled, irritability, sleep disturbances, and hypervigilance.',
    screenedIn: 'Screened in PC-PTSD-5 Q3',
    iconName: 'Shield'
  },
  {
    id: 'cluster-4',
    number: 4,
    name: 'Mood & Cognition Changes',
    description: 'Persistent feelings of numbness, detachment from loved ones, difficulty feeling positive emotions, or distorted self-blame and guilt.',
    screenedIn: 'Screened in PC-PTSD-5 Q4 & Q5',
    iconName: 'HeartCrack'
  }
];

export const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'res-telemanas',
    title: 'Tele-MANAS: National Tele Mental Health Programme of India',
    category: 'crisis',
    badge: 'Govt of India • 24/7',
    meta: 'Toll-Free 14416',
    description: 'Free, confidential mental health counseling across 20+ regional Indian languages run by the Ministry of Health and NIMHANS Bangalore.',
    actionType: 'external',
    actionUrl: 'tel:14416',
    actionLabel: 'Call 14416 Toll-Free →'
  },
  {
    id: 'res-kiran',
    title: 'KIRAN National Mental Health Helpline',
    category: 'crisis',
    badge: 'Ministry of Social Justice',
    meta: 'Toll-Free 1800-599-0019',
    description: '24/7 helpline by Govt of India offering psychological first aid, crisis intervention, and mental health rehabilitation support in 13 languages.',
    actionType: 'external',
    actionUrl: 'tel:18005990019',
    actionLabel: 'Call 1800-599-0019 →'
  },
  {
    id: 'res-vandrevala',
    title: 'Vandrevala Foundation Mental Health Helpline',
    category: 'crisis',
    badge: '24/7 Phone & WhatsApp',
    meta: 'Helpline +91 9999 666 555',
    description: 'Experienced clinical psychologists providing free, compassionate crisis counseling and emotional support across India via call and WhatsApp.',
    actionType: 'external',
    actionUrl: 'tel:9999666555',
    actionLabel: 'Call 9999 666 555 →'
  },
  {
    id: 'res-nimhans',
    title: 'NIMHANS Trauma & Disaster Care Centre',
    category: 'care',
    badge: 'Premier Institute • India',
    meta: 'NIMHANS Bengaluru',
    description: 'Apex clinical neuropsychiatry institute in India providing specialized treatment for PTSD, complex trauma, and psychological support.',
    actionType: 'external',
    actionUrl: 'https://nimhans.ac.in',
    actionLabel: 'Visit NIMHANS Portal ↗'
  },
  {
    id: 'res-1',
    title: '5-4-3-2-1 Sensory Grounding Guide',
    category: 'grounding',
    badge: 'Somatic & Grounding',
    meta: '5 min exercise',
    description: 'A somatic anchor technique to calm the nervous system when hyperarousal, startle, or intrusive memories surge.',
    actionType: 'modal',
    actionLabel: 'Launch interactive guide →'
  },
  {
    id: 'res-4',
    title: 'Pranayama & Diaphragmatic Box Breathing',
    category: 'sleep',
    badge: 'Sleep & Calming',
    meta: '4 min somatic practice',
    description: 'Traditional rhythmic breathing (Sama Vritti / 4-4-4-4) to stimulate the vagus nerve and down-regulate autonomic nervous tension.',
    actionType: 'modal',
    actionLabel: 'Practice breathing exercise →'
  },
  {
    id: 'res-icall',
    title: 'iCALL Psychosocial Helpline (TISS)',
    category: 'care',
    badge: 'Tata Institute of Social Sciences',
    meta: 'Mon-Sat 10am-8pm • 9152987821',
    description: 'Professional counseling service run by trained mental health professionals from the School of Human Ecology, TISS Mumbai.',
    actionType: 'external',
    actionUrl: 'https://icallhelpline.org',
    actionLabel: 'Explore iCALL Resources ↗'
  }
];

export const GROUNDING_STEPS: GroundingStep[] = [
  {
    step: 5,
    title: 'Look around you (5 things)',
    iconName: 'Eye',
    text: 'Notice 5 things you can see: light reflecting on a wall, your shoes, a plant, an interesting texture, or a doorknob.'
  },
  {
    step: 4,
    title: 'Touch & sensation (4 things)',
    iconName: 'Hand',
    text: 'Notice 4 physical sensations: your back supported by the seat, feet grounded on the floor, clothing on your skin, or room temperature.'
  },
  {
    step: 3,
    title: 'Listen attentively (3 things)',
    iconName: 'Ear',
    text: 'Identify 3 distinct sounds: distant ambient traffic, the hum of electronics, or the gentle sound of your own quiet breath.'
  },
  {
    step: 2,
    title: 'Scent & memory (2 things)',
    iconName: 'Wind',
    text: 'Notice 2 scents in the room, or call to mind a soothing familiar aroma such as fresh pine, rain, or lavender.'
  },
  {
    step: 1,
    title: 'Taste & release (1 thing)',
    iconName: 'Smile',
    text: 'Notice 1 taste, take a sip of cool water if available, unclench your jaw, and let out a full, slow exhale.'
  }
];

export function getInitialHistory(): AssessmentRecord[] {
  const now = new Date();
  
  // Calculate relative baseline dates using current device year & month in local timezone
  const date1 = new Date(now);
  date1.setDate(now.getDate() - 14); // 2 weeks ago
  
  const date2 = new Date(now);
  date2.setDate(now.getDate() - 45); // ~1.5 months ago

  return [
    {
      id: 'rec-1',
      date: date1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: date1.getTime(),
      score: 4,
      total: 5,
      isPositive: true,
      statusText: 'Positive PTSD Screen',
      summary: 'Reported Criterion A trauma exposure, intrusive memories, avoidance, and hypervigilance. GAD-7 score: 14 (Moderate Anxiety). Flagged for trauma-informed referral.',
      answers: [true, true, true, false, true],
      traumaExposure: true,
      gad7Score: 14,
      gad7Severity: 'moderate',
      riskLevel: 'routine'
    },
    {
      id: 'rec-2',
      date: date2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: date2.getTime(),
      score: 3,
      total: 5,
      isPositive: true,
      statusText: 'Borderline Screen',
      summary: 'Avoidance and hyperarousal noted during workplace transition. GAD-7 score: 8 (Mild Anxiety). Somatic grounding recommended.',
      answers: [true, true, true, false, false],
      traumaExposure: true,
      gad7Score: 8,
      gad7Severity: 'mild',
      riskLevel: 'routine'
    }
  ];
}

export const INITIAL_HISTORY: AssessmentRecord[] = getInitialHistory();

export const BRAND_ASSETS = {
  logoUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1Xw8qGu_DVrHKNXQwm6z8cDtlI8h9BIEuzHwJAa5hXG_3F2_8DRyekp1UAu45MHepP-HSGKo2GL90xOLSQLXoPN3eno-xiw9GJA6Q7wG0H2XXMpfCkNpVWz1mCZ2DL9XNt67c4KlHAf9iGCjeDA0VluInPaTRLc_zUXZ_5uU3A8Awkvgwl-uf9k3MXVEVjuG9qQnRruxcqGhiVyALG3FOLcCkH8a5g318RlrlrT9lX8D-0cupn42gVblDEh',
  heroIllustration: 'https://lh3.googleusercontent.com/aida/AEtjO1WDrmAZMOeuCvlc-RCcWYMhVg2lV0Gwf6qi00j7PWfIC5JWEF45PLk9XppdTcN6HStzskXCujrae_cbARs-VGJ6zv_6C0abnQmm9Ucz9LyM4rJr8_cPy4uq5ANQrPMZomOmGOwi_IQLEAqL8JIwcPPYcR-u6zp_tmi7OW69flmewBAySrS99hszFAxY0DZstJpIQxRzyuRr13rwV_oFAlm5yeduuBHDaOuDSazb5TK1rrXHUa_k5MrBLdDL'
};

// ==========================================
// DAILY MOOD CHECK-IN DEFINITIONS & HELPERS
// ==========================================

export const MOOD_OPTIONS: { score: 1 | 2 | 3 | 4 | 5; label: string; emoji: string; description: string; color: string }[] = [
  { score: 1, label: 'Very Low / Distressed', emoji: '😔', description: 'Feeling deeply down, exhausted, overwhelmed, or numb', color: '#DC2626' },
  { score: 2, label: 'Low / Fragile', emoji: '🙁', description: 'Feeling sad, drained, anxious, or struggling to cope', color: '#EA580C' },
  { score: 3, label: 'Steady / Holding On', emoji: '😐', description: 'Holding steady, neither high nor low, getting through the day', color: '#D97706' },
  { score: 4, label: 'Good / Grounded', emoji: '🙂', description: 'Feeling calm, content, present, and safe in your body', color: '#0D9488' },
  { score: 5, label: 'Very Good / Peaceful', emoji: '😊', description: 'Feeling peaceful, uplifted, resilient, or joyful', color: '#059669' }
];

export const ENERGY_LEVEL_OPTIONS = [
  { value: 'Depleted / Heavy exhaustion', label: 'Depleted / Exhausted' },
  { value: 'Low / Sluggish energy', label: 'Low / Sluggish' },
  { value: 'Moderate / Balanced energy', label: 'Moderate / Balanced' },
  { value: 'Vibrant / Recharged & active', label: 'Vibrant / Energized' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const MENTAL_CLARITY_OPTIONS = [
  { value: 'Racing thoughts / Overstimulated', label: 'Racing / Overstimulated' },
  { value: 'Brain fog / Hard to concentrate', label: 'Brain fog / Sluggish' },
  { value: 'Steady / Manageable focus', label: 'Steady / Manageable' },
  { value: 'Clear, sharp & present', label: 'Clear & Focused' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const STRESS_LEVEL_OPTIONS = [
  { value: 'Deeply calm / Grounded', label: 'Deeply calm / Grounded' },
  { value: 'Mild tension / Manageable', label: 'Mild tension / Manageable' },
  { value: 'Moderate / Noticeable stress', label: 'Moderate / Noticeable stress' },
  { value: 'High alert / On edge', label: 'High alert / On edge' },
  { value: 'Overwhelmed / Frozen or numb', label: 'Overwhelmed / Frozen' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const SLEEP_QUALITY_OPTIONS = [
  { value: 'Sound, deep & restful', label: 'Sound & Restful' },
  { value: 'Fair / Adequate rest', label: 'Fair / Adequate' },
  { value: 'Broken / Restless or light', label: 'Broken / Restless' },
  { value: 'Disturbed by nightmares or insomnia', label: 'Nightmares / Insomnia' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const SUPPORT_CONNECTION_OPTIONS = [
  { value: 'Strongly supported by someone caring', label: 'Strongly supported' },
  { value: 'Brief / Comforting interaction', label: 'Brief interaction' },
  { value: 'Peaceful / Grounding solitude', label: 'Grounding solitude' },
  { value: 'Isolated / Felt alone or misunderstood', label: 'Felt isolated / alone' },
  { value: 'Did not feel like talking to anyone', label: 'Withdrew from others' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const DAY_OVERALL_OPTIONS = [
  { value: 'Overwhelming / Difficult', label: 'Overwhelming / Difficult' },
  { value: 'Tiring / Heavy', label: 'Tiring / Heavy' },
  { value: 'Steady / Uneventful', label: 'Steady / Uneventful' },
  { value: 'Calm / Pleasant', label: 'Calm / Pleasant' },
  { value: 'Energizing / Uplifting', label: 'Energizing / Uplifting' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  // Diff to reach Monday (if Sunday 0, subtract 6 days; if Mon 1, subtract 0, etc.)
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getCurrentWeekDays(
  items: (DailyCheckIn | Who5Record)[] = [], 
  refDate = new Date()
): WeeklyTrendDay[] {
  const monday = getMondayOfWeek(refDate);
  const todayKey = formatDateKey(refDate);
  const days: WeeklyTrendDay[] = [];

  const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    current.setHours(12, 0, 0, 0);
    const dateStr = formatDateKey(current);
    const isToday = dateStr === todayKey;
    const isFuture = dateStr > todayKey;

    // Find latest matching WHO-5 record for this date
    const matchingWho5 = (items as Who5Record[])
      .filter(item => item && 'percentScore' in item && item.dateKey === dateStr)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    // Find legacy check-in if present
    const checkIn = (items as DailyCheckIn[])
      .find(item => item && 'date' in item && item.date === dateStr);

    days.push({
      dayName: shortNames[i],
      fullDayName: fullNames[i],
      dateStr,
      dayOfMonth: current.getDate(),
      isToday,
      isFuture,
      checkIn,
      who5Record: matchingWho5
    });
  }

  return days;
}

export function getWeeklyWho5Days(who5Records: Who5Record[] = [], refDate = new Date()): WeeklyTrendDay[] {
  return getCurrentWeekDays(who5Records, refDate);
}

export function isCheckInSupportNeeded(checkIn: Partial<DailyCheckIn>): boolean {
  if (checkIn.mood === 1) return true;
  if (checkIn.stressLevel && (
    checkIn.stressLevel.toLowerCase().includes('high') ||
    checkIn.stressLevel.toLowerCase().includes('edge') ||
    checkIn.stressLevel.toLowerCase().includes('frozen') ||
    checkIn.stressLevel.toLowerCase().includes('overwhelm')
  )) return true;
  if (checkIn.sleepQuality && (
    checkIn.sleepQuality.toLowerCase().includes('nightmares') ||
    checkIn.sleepQuality.toLowerCase().includes('insomnia') ||
    checkIn.sleepQuality.toLowerCase().includes('disturbed')
  )) return true;
  if (checkIn.feltSupported && (
    checkIn.feltSupported.toLowerCase().includes('isolated') ||
    checkIn.feltSupported.toLowerCase().includes('alone')
  )) return true;
  if (checkIn.energyLevel && checkIn.energyLevel.toLowerCase().includes('depleted')) return true;
  if (checkIn.mentalClarity && checkIn.mentalClarity.toLowerCase().includes('racing')) return true;
  return false;
}

export function generateSeedCheckIns(refDate = new Date()): DailyCheckIn[] {
  const monday = getMondayOfWeek(refDate);
  const todayKey = formatDateKey(refDate);

  const monDate = new Date(monday);
  const monKey = formatDateKey(monDate);

  const tueDate = new Date(monday);
  tueDate.setDate(monday.getDate() + 1);
  const tueKey = formatDateKey(tueDate);

  const list: DailyCheckIn[] = [];

  // Seed Monday if today is not Monday
  if (monKey !== todayKey) {
    list.push({
      id: `seed-${monKey}`,
      date: monKey,
      displayDate: formatDisplayDate(monDate),
      timestamp: monDate.getTime() + 9 * 3600 * 1000,
      mood: 3,
      moodLabel: 'Steady / Holding On',
      dayOverall: 'Steady / Uneventful',
      stressLevel: 'Mild tension / Manageable',
      sleepQuality: 'Fair / Adequate rest',
      feltSupported: 'Strongly supported by someone caring',
      energyLevel: 'Moderate / Balanced energy',
      mentalClarity: 'Steady / Manageable focus',
      notes: 'Grounded myself with quiet music in the afternoon.'
    });
  }

  // Seed Tuesday if today is past Tuesday
  if (tueKey !== todayKey && refDate.getDay() !== 1 && refDate.getDay() !== 2) {
    list.push({
      id: `seed-${tueKey}`,
      date: tueKey,
      displayDate: formatDisplayDate(tueDate),
      timestamp: tueDate.getTime() + 10 * 3600 * 1000,
      mood: 4,
      moodLabel: 'Good / Grounded',
      dayOverall: 'Calm / Pleasant',
      stressLevel: 'Deeply calm / Grounded',
      sleepQuality: 'Sound, deep & restful',
      feltSupported: 'Strongly supported by someone caring',
      energyLevel: 'Vibrant / Recharged & active',
      mentalClarity: 'Clear, sharp & present',
      notes: 'Felt calm and present during work.'
    });
  }

  return list;
}

const CHECKIN_STORAGE_KEY = (userId?: string) =>
  `mindtrauma_daily_checkins_${userId || 'guest'}`;

export function loadStoredCheckIns(userId?: string): DailyCheckIn[] {
  const key = CHECKIN_STORAGE_KEY(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const currentYear = new Date().getFullYear();
        let migrated = false;
        const cleaned = parsed.map((c: DailyCheckIn) => {
          if ((c.date && c.date.includes('2025')) || (c.displayDate && c.displayDate.includes('2025'))) {
            migrated = true;
            return {
              ...c,
              date: c.date ? c.date.replace('2025', String(currentYear)) : c.date,
              displayDate: c.displayDate ? c.displayDate.replace('2025', String(currentYear)) : c.displayDate
            };
          }
          return c;
        });
        if (migrated) {
          try { localStorage.setItem(key, JSON.stringify(cleaned)); } catch {}
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Could not read check-ins from localStorage:', e);
  }
  const seed = generateSeedCheckIns();
  try {
    localStorage.setItem(key, JSON.stringify(seed));
  } catch {
    // Ignore storage issues in test/sandboxed envs
  }
  return seed;
}

export function saveStoredCheckIns(checkIns: DailyCheckIn[], userId?: string): void {
  try {
    localStorage.setItem(CHECKIN_STORAGE_KEY(userId), JSON.stringify(checkIns));
  } catch (e) {
    console.warn('Could not save check-ins to localStorage:', e);
  }
}

const HISTORY_STORAGE_KEY = (userId?: string) =>
  `mindtrauma_assessment_history_${userId || 'guest'}`;


export function loadStoredHistory(userId?: string): AssessmentRecord[] {
  const key = HISTORY_STORAGE_KEY(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const currentYear = new Date().getFullYear();
        let migrated = false;
        const cleaned = parsed.map((item: AssessmentRecord) => {
          if (item.date && item.date.includes('2025')) {
            migrated = true;
            return {
              ...item,
              date: item.date.replace('2025', String(currentYear))
            };
          }
          return item;
        });
        if (migrated) {
          saveStoredHistory(cleaned, userId);
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Could not read history from localStorage:', e);
  }
  // New user — show baseline dynamic history (not stale)
  const initial = getInitialHistory();
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {
    // Ignore in test envs
  }
  return initial;
}

export function saveStoredHistory(list: AssessmentRecord[], userId?: string): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY(userId), JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save history to localStorage:', e);
  }
}

// ============================================================
// WHO-5 WELL-BEING ASSESSMENT — QUESTIONS, OPTIONS & HELPERS
// ============================================================

/**
 * WHO-5 Well-Being Index questions.
 * The WHO-5 is copyright © WHO Regional Office for Europe, 1998.
 * License required for commercial or clinical deployment.
 * Placeholder text below uses the canonical topic descriptors from
 * the public domain summary; replace with licensed wording when obtained.
 */
export const WHO5_QUESTIONS: { id: number; topic: string; placeholder: string }[] = [
  {
    id: 1,
    topic: 'Cheerful mood',
    placeholder: 'I have felt cheerful and in good spirits.',
  },
  {
    id: 2,
    topic: 'Calm and relaxed',
    placeholder: 'I have felt calm and relaxed.',
  },
  {
    id: 3,
    topic: 'Active and vigorous',
    placeholder: 'I have felt active and vigorous.',
  },
  {
    id: 4,
    topic: 'Woke up fresh and rested',
    placeholder: 'I woke up feeling fresh and rested.',
  },
  {
    id: 5,
    topic: 'Daily life filled with interesting things',
    placeholder: 'My daily life has been filled with things that interest me.',
  },
];

/**
 * WHO-5 response options.
 * Scores range from 0 (At no time) to 5 (All of the time).
 */
export const WHO5_OPTIONS: { value: number; label: string; sublabel?: string }[] = [
  { value: 0, label: 'At no time' },
  { value: 1, label: 'Some of the time' },
  { value: 2, label: 'Less than half the time' },
  { value: 3, label: 'More than half the time' },
  { value: 4, label: 'Most of the time' },
  { value: 5, label: 'All of the time' },
];

/**
 * Calculate WHO-5 raw score (0–25) and percentage score (0–100).
 * rawScore = sum of 5 question values (each 0–5)
 * percentScore = rawScore × 4
 */
export function calculateWho5Score(answers: (number | null)[]): { raw: number; percent: number } {
  const raw = answers.reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  return { raw, percent: raw * 4 };
}

// localStorage key for WHO-5 assessments
const WHO5_STORAGE_KEY = (userId?: string) =>
  `mindtrauma_who5_assessments_${userId || 'guest'}`;


export function loadStoredWho5(userId?: string): Who5Record[] {
  const key = WHO5_STORAGE_KEY(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Who5Record[];
    }
  } catch (e) {
    console.warn('Could not read WHO-5 data from localStorage:', e);
  }
  return [];
}

export function saveStoredWho5(records: Who5Record[], userId?: string): void {
  try {
    localStorage.setItem(WHO5_STORAGE_KEY(userId), JSON.stringify(records));
  } catch (e) {
    console.warn('Could not save WHO-5 data to localStorage:', e);
  }
}
