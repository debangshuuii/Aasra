import { generateWithRotation, getGeminiApiKeys } from '../server/geminiRotation';

function getClinicalAssessmentFallback(data: {
  traumaExposure: boolean;
  ptsdScore: number;
  ptsdAnswers: boolean[];
  gad7Score: number;
  gad7Severity: string;
  riskLevel: string;
  assessmentDate?: string;
}): string {
  const { traumaExposure, ptsdScore, gad7Score, gad7Severity, riskLevel, assessmentDate } = data;

  let riskNote = '';
  if (riskLevel === 'critical' || riskLevel === 'elevated') {
    riskNote = `⚠️ **URGENT SAFETY NOTICE**: Elevated distress or safety concerns were indicated during triage. Immediate, compassionate support is available 24/7 across India:\n• **Tele-MANAS**: 14416 or 1800-891-4416 (Govt of India, 24/7 Toll-Free)\n• **KIRAN**: 1800-599-0019 (Ministry of Social Justice)\n• **Vandrevala Foundation**: +91 9999 666 555 (Call / WhatsApp)\n• **National Emergency**: 112\n\n`;
  }

  let traumaSection = '';
  if (!traumaExposure) {
    traumaSection = `• **PC-PTSD-5 Screener**: Criterion A trauma exposure was not reported. By clinical screening rules, the PTSD score is **0/5 (Negative Screen)**.`;
  } else {
    const isPtsdPositive = ptsdScore >= 3;
    const isVaCutpoint = ptsdScore >= 4;
    traumaSection = `• **PC-PTSD-5 Trauma Screener**: Score is **${ptsdScore}/5 Affirmative**. ${
      isVaCutpoint
        ? 'Meets the established VA research clinical cut-point (≥4) and general screening threshold (≥3), indicating prominent traumatic stress reactions requiring professional evaluation.'
        : isPtsdPositive
        ? 'Meets the clinical screening threshold (≥3), suggesting notable post-traumatic stress reactions over the past month.'
        : 'Below the screening cutoff (0–2), indicating lower indication of clinical post-traumatic stress on this screen.'
    }`;
  }

  const isGadReferral = gad7Score >= 10;
  const gadSection = `• **GAD-7 Anxiety Scale**: Score is **${gad7Score}/21 (${gad7Severity.toUpperCase()} ANXIETY)**. ${
    isGadReferral
      ? 'Meets the clinical referral flag threshold (10+), indicating that generalized anxiety symptoms may be causing significant emotional or functional disruption.'
      : 'Within the low-to-mild range, suggesting manageable baseline anxiety symptoms over the past two weeks.'
  }`;

  const pathways = `• **Evidence-Based Care Pathways**:
  - **EMDR & Cognitive Processing Therapy (CPT)**: Recommended first-line therapies for trauma memory reprocessing and relieving intrusive thoughts.
  - **Somatic Nervous System Regulation**: 5-4-3-2-1 sensory grounding and rhythmic box breathing help down-regulate sympathetic fight-or-flight hyperarousal.
  - **Cognitive Behavioral Strategies**: Effective for breaking loops of uncontrollable worry, catastrophizing, and muscle tension.`;

  const referral = `• **Provider Referral Guidance**:
  Discuss these results with a licensed physician or clinical psychologist. You can share:
  *"I completed validated PC-PTSD-5 and GAD-7 screeners. My results indicated a PTSD screen score of ${traumaExposure ? ptsdScore : 0}/5 and a GAD-7 anxiety score of ${gad7Score}/21. I would like to explore an evaluation and trauma-informed support."*`;

  const disclaimer = `*Clinical Boundary: The PC-PTSD-5 and GAD-7 are screening instruments designed to identify individuals who may benefit from further evaluation. They do not constitute a formal psychiatric diagnosis. A positive screen warrants comprehensive assessment by a qualified clinician.*`;

  const dateHeader = assessmentDate ? ` (${assessmentDate})` : '';
  return `${riskNote}### Comprehensive Clinical Synthesis${dateHeader}\n\n${traumaSection}\n\n${gadSection}\n\n### Care & Treatment Pathways\n${pathways}\n\n### Next Steps & Referral\n${referral}\n\n---\n${disclaimer}`;
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      traumaExposure,
      ptsdScore = 0,
      ptsdAnswers = [],
      gad7Score = 0,
      gad7Severity = 'minimal',
      riskLevel = 'routine',
      assessmentDate
    } = req.body || {};

    const fallbackText = getClinicalAssessmentFallback({
      traumaExposure: !!traumaExposure,
      ptsdScore: Number(ptsdScore) || 0,
      ptsdAnswers: Array.isArray(ptsdAnswers) ? ptsdAnswers : [],
      gad7Score: Number(gad7Score) || 0,
      gad7Severity: String(gad7Severity),
      riskLevel: String(riskLevel),
      assessmentDate: assessmentDate ? String(assessmentDate) : undefined
    });

    const availableKeys = getGeminiApiKeys();
    if (availableKeys.length === 0) {
      return res.status(200).json({ summary: fallbackText, isFallback: true });
    }

    const prompt = `Synthesize these clinical screening results for a victim/patient into an empathetic, structured preliminary assessment report with referral recommendations:
- Assessment Date: ${assessmentDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
- PC-PTSD-5 Criterion A Trauma Exposure: ${traumaExposure ? 'YES' : 'NO'}
- PC-PTSD-5 PTSD Score: ${traumaExposure ? ptsdScore : 0} of 5 (Cut-point: 3+ indicates positive screen, 4 is VA research cut-point)
- GAD-7 Anxiety Score: ${gad7Score} of 21 (Severity: ${gad7Severity}, Referral threshold: 10+)
- Risk / Urgency Triage Level: ${riskLevel}

Format requirements:
1. Executive Clinical Synthesis (warm, validating, non-diagnostic).
2. Trauma Symptom Profile (PC-PTSD-5 breakdown).
3. Generalized Anxiety Profile (GAD-7 breakdown & functional impact).
4. Evidence-Based Next Steps (EMDR, CPT, Somatic grounding, GP discussion guide).
5. Indian Helplines (Tele-MANAS 14416, KIRAN 1800-599-0019, Vandrevala Foundation +91 9999 666 555).
6. Mandatory Clinical Disclaimer: "The PC-PTSD-5 and GAD-7 are screening tools, not diagnostic tests; a positive result warrants further evaluation by a qualified professional." Keep concise (3-4 concise sections).`;

    const result = await generateWithRotation(
      ['gemini-3.1-flash-lite', 'gemini-3.6-flash'],
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: 'You are Saathi, an empathetic, trauma-informed clinical assistant synthesizing screening questionnaires for victims and survivors.'
        }
      },
      18000
    );

    const summary = result.text || fallbackText;
    res.status(200).json({ summary, isFallback: false, model: result.model, keyIndex: result.keyIndexUsed });
  } catch (error: any) {
    console.warn('[Vercel api/assess] Error, falling back:', error?.message);
    const fallbackText = getClinicalAssessmentFallback({
      traumaExposure: !!req.body?.traumaExposure,
      ptsdScore: Number(req.body?.ptsdScore) || 0,
      ptsdAnswers: req.body?.ptsdAnswers || [],
      gad7Score: Number(req.body?.gad7Score) || 0,
      gad7Severity: req.body?.gad7Severity || 'minimal',
      riskLevel: req.body?.riskLevel || 'routine'
    });
    res.status(200).json({ summary: fallbackText, isFallback: true });
  }
}
