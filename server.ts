import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { generateWithRotation, getGeminiApiKeys } from './server/geminiRotation';

dotenv.config();

function getClinicalFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  // Crisis & Emergency
  if (['die', 'suicide', 'kill myself', 'hurt myself', 'end it', 'emergency', 'harm', 'overdose'].some(w => lower.includes(w))) {
    return `⚠️ Your immediate safety is the highest priority. Please connect with caring human support right now:
• Call Tele-MANAS: 14416 or 1800-891-4416 (Govt of India 24/7 free toll-free helpline across 20+ Indian languages).
• Call KIRAN: 1800-599-0019 (24/7 Mental Health Helpline by Ministry of Social Justice & Empowerment).
• Call or WhatsApp Vandrevala Foundation: +91 9999 666 555 (Free 24/7 counseling across India).
• For immediate physical or medical danger in India, please dial 112 (National Emergency) or 108/102 (Ambulance), or visit the nearest emergency room. You do not have to carry this alone.`;
  }

  // Screening & Assessment Scores
  if (lower.includes('score') || lower.includes('result') || lower.includes('screening') || lower.includes('pc-ptsd') || lower.includes('gad-7')) {
    return `The Primary Care PTSD Screen (PC-PTSD-5) measures reactions experienced over the past month. A score of 3 or higher is considered a "positive screen," suggesting that post-traumatic symptoms may be significantly present. Remember that this is a clinical screener, not a formal diagnosis. Discussing these results with a licensed healthcare provider or trauma-informed therapist (such as one certified in EMDR or CPT) can help you explore personalized support.`;
  }

  // Hyperarousal & Nervous System Activation
  if (lower.includes('hyperarousal') || lower.includes('startled') || lower.includes('on guard') || lower.includes('fight or flight') || lower.includes('edge') || lower.includes('jumpy') || lower.includes('shaking') || lower.includes('heart racing')) {
    return `Hyperarousal occurs when your nervous system's threat-detection center (the amygdala) remains in a state of high alert long after a traumatic stressor has passed. Common signs include feeling easily startled, irritability, sleep disruptions, and physical muscle tension. Somatic practices, such as diaphragmatic breathing and 5-4-3-2-1 sensory grounding, can help gently signal to your nervous system that you are safe in this moment.`;
  }

  // Grounding & Somatic Regulation
  if (lower.includes('grounding') || lower.includes('exercise') || lower.includes('calm') || lower.includes('panic') || lower.includes('anxiety') || lower.includes('breathe') || lower.includes('breathing')) {
    return `Let's practice the 5-4-3-2-1 sensory grounding technique right now:
1. Look around: Name 5 things you can see (e.g., a chair, a window, a beam of light).
2. Feel: Notice 4 things you can touch (e.g., your feet on the floor, your clothing's texture).
3. Listen: Identify 3 sounds you can hear (e.g., ambient room hum, distant traffic).
4. Smell: Notice 2 scents around you (or imagine a soothing scent like lavender).
5. Taste: Notice 1 taste, or take a gentle sip of cool water.

Take a slow, deep breath in, and let your shoulders drop as you exhale.`;
  }

  // Sleep, Nightmares & Intrusive Memories
  if (lower.includes('sleep') || lower.includes('nightmare') || lower.includes('insomnia') || lower.includes('flashback') || lower.includes('memory') || lower.includes('dream') || lower.includes('reliving')) {
    return `Intrusive memories and sleep disturbances are hallmark symptoms of trauma reactions (DSM-5 Criterion B). The brain has difficulty filing the traumatic memory into past storage, so it continues to replay as if happening right now.
Tips for right now:
• Keep a nightlight or grounding object by your bed.
• Remind yourself upon waking: "Today is [day], I am in my bed, and the danger has passed."
• Evidence-based therapies like EMDR or Imagery Rehearsal Therapy (IRT) are particularly helpful for recurring nightmares.`;
  }

  // Numbness, Depersonalization & Dissociation
  if (lower.includes('numb') || lower.includes('frozen') || lower.includes('disconnected') || lower.includes('unreal') || lower.includes('blank') || lower.includes('empty') || lower.includes('dissociat')) {
    return `Feeling emotionally numb or detached is the nervous system's "freeze" response. When fight or flight feels impossible, the dorsal vagal system steps in to dull overwhelming sensations. 
You are not "broken" or unfeeling—this is a protective defense mechanism. Gentle physical sensations, like washing your hands with cool water or touching textured fabric, can help safely invite feeling back into your body at your own pace.`;
  }

  // Guilt, Shame & Self-Blame
  if (lower.includes('guilt') || lower.includes('blame') || lower.includes('shame') || lower.includes('my fault') || lower.includes('should have') || lower.includes('could have')) {
    return `Guilt and self-blame are very common after traumatic events (DSM-5 Criterion D). In psychology, this is known as "hindsight bias"—evaluating your past survival actions with knowledge you only have today.
Please be gentle with yourself: Your brain did whatever it believed necessary in that moment to ensure your survival. Exploring these stuck points with a Cognitive Processing Therapy (CPT) practitioner can help relieve this heavy burden.`;
  }

  // Professional Help & Communication
  if (lower.includes('doctor') || lower.includes('therapist') || lower.includes('talk') || lower.includes('provider') || lower.includes('psychiatrist') || lower.includes('counselor')) {
    return `When speaking with a physician or therapist about trauma, you can keep it simple: "I recently completed a validated PC-PTSD-5 screening and noticed that lingering reactions from past events are affecting my daily life, sleep, or mood. I would like to discuss an evaluation or referral to an evidence-based trauma specialist." You don't have to share all traumatic details until you feel comfortable and safe.`;
  }

  // Evidence-Based Treatments
  if (lower.includes('emdr') || lower.includes('cpt') || lower.includes('treatment') || lower.includes('therapy') || lower.includes('cure') || lower.includes('heal')) {
    return `Evidence-based trauma therapies have high success rates in helping the brain reprocess traumatic memories:
• EMDR (Eye Movement Desensitization and Reprocessing): Uses bilateral stimulation to reduce emotional charge attached to traumatic memories.
• CPT (Cognitive Processing Therapy): Helps identify and reframe stuck points, self-blame, and safety beliefs.
• Somatic Experiencing: Focuses on releasing stored physical stress and restoring autonomic regulation.`;
  }

  // Triggers & Avoidance
  if (lower.includes('trigger') || lower.includes('avoid') || lower.includes('scared of') || lower.includes('remind')) {
    return `Triggers are sensory cues (sounds, smells, places) that your amygdala linked to the traumatic event. Avoidance is a natural protective reaction, but over time it can shrink your world.
A trauma-informed approach involves gradual, safe desensitization paired with somatic grounding, helping your brain learn that the trigger is a reminder of the past, not an active danger in the present.`;
  }

  // Varied Compassionate Fallbacks — rotated by time to avoid repetition
  const fallbacks = [
    `Thank you for sharing that with me. Experiencing trauma reactions can feel overwhelming and isolating, but these responses are normal physiological adaptations to severe stress. What aspect of what you're feeling would be most supportive to focus on right now—understanding symptoms, practical grounding exercises, or next steps with a healthcare provider?`,
    `I hear you, and what you're describing is deeply valid. Healing from traumatic stress is not linear, and giving voice to these feelings is a courageous step. Would you like to explore how your body is feeling in this moment, or would you prefer information on coping strategies?`,
    `Thank you for opening up about this. Trauma can impact how safe we feel in our bodies and in our environments. Remember that you do not have to carry this all alone. We can take this one step at a time—would a calming breathing exercise or learning about symptom patterns feel more helpful right now?`,
    `What you're sharing takes real courage. The nervous system's response to overwhelming stress—whether it shows up as tension, exhaustion, or emotional numbness—is your body's protective intelligence at work. Would it help to talk through what you're noticing, or would you prefer some grounding support right now?`,
    `I'm here with you in this moment. Difficult feelings don't follow a set schedule, and there's no "right" way to process what you've been through. Would you like to explore what trauma-informed support looks like for your specific experience, or would a simple calming technique help first?`
  ];

  // Use timestamp-based modulo so the same message sent twice gets a different response
  const timeSlot = Math.floor(Date.now() / 30000); // rotates every 30 seconds
  const msgHash = Math.abs(message.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return fallbacks[(timeSlot + msgHash) % fallbacks.length];
}

/**
 * Timeout wrapper for Gemini generateContent to prevent hanging during API spikes.
 */
async function generateWithTimeout(
  ai: GoogleGenAI,
  model: string,
  params: { contents: any[]; config?: any },
  timeoutMs = 7000
): Promise<any> {
  return Promise.race([
    ai.models.generateContent({
      model,
      ...params,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Model ${model} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Assessment Synthesis Endpoint (PC-PTSD-5 + GAD-7 + Risk)
  app.post('/api/assess', async (req, res) => {
    try {
      const {
        traumaExposure,
        ptsdScore = 0,
        ptsdAnswers = [],
        gad7Score = 0,
        gad7Severity = 'minimal',
        riskLevel = 'routine',
        assessmentDate
      } = req.body;

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
        return res.json({ summary: fallbackText, isFallback: true });
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
      res.json({ summary, isFallback: false, model: result.model, keyIndex: result.keyIndexUsed });
    } catch (error: any) {
      console.warn('API /api/assess error, falling back:', error?.message);
      const fallbackText = getClinicalAssessmentFallback({
        traumaExposure: !!req.body?.traumaExposure,
        ptsdScore: Number(req.body?.ptsdScore) || 0,
        ptsdAnswers: req.body?.ptsdAnswers || [],
        gad7Score: Number(req.body?.gad7Score) || 0,
        gad7Severity: req.body?.gad7Severity || 'minimal',
        riskLevel: req.body?.riskLevel || 'routine',
        assessmentDate: req.body?.assessmentDate ? String(req.body.assessmentDate) : undefined
      });
      res.json({ summary: fallbackText, isFallback: true });
    }
  });

  // AI Chat Endpoint with Gemini 3.8 Flash + Clinical Safe Fallback
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const availableKeys = getGeminiApiKeys();
      if (availableKeys.length === 0) {
        return res.json({
          reply: getClinicalFallbackResponse(message),
          isFallback: true
        });
      }

      const systemInstruction = `You are Saathi, an empathetic, trauma-informed psychoeducational assistant.
You provide supportive information, explain PTSD symptoms according to DSM-5 (Intrusive memories, Avoidance, Hyperarousal & reactivity, Negative cognitions & mood), and guide users through nervous system regulation exercises (5-4-3-2-1 grounding, box breathing).
CLINICAL BOUNDARIES & SAFETY PROTOCOLS:
1. You are NOT a doctor, therapist, or emergency service. Never diagnose.
2. If the user expresses thoughts of suicide, self-harm, severe crisis, or immediate danger, lead immediately with Indian Crisis Helplines: Tele-MANAS (14416 / 1800-891-4416), KIRAN (1800-599-0019), Vandrevala Foundation (+91 9999 666 555), and National Emergency (112).
3. Keep responses warm, non-judgmental, validating, gentle, concise (2-3 short paragraphs maximum), and easily readable.
4. IMPORTANT: Never repeat a response you have already given in this conversation. Read the conversation history carefully and build upon what has been shared. Vary your language and approach with each response. Acknowledge what the user just said specifically before continuing.`;

      // Build conversation contents ensuring clean alternation (user -> model -> user)
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        for (const item of history) {
          if (!item || !item.text || typeof item.text !== 'string') continue;
          const trimmed = item.text.trim();
          if (!trimmed) continue;

          const role: 'user' | 'model' = item.sender === 'user' ? 'user' : 'model';

          // Prevent consecutive duplicate turns with the same role
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += `\n\n${trimmed}`;
          } else {
            contents.push({
              role,
              parts: [{ text: trimmed }]
            });
          }
        }
      }

      // Append new user message — if history already ends in a 'user' turn, bridge it first
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        // Insert a model bridge to maintain user->model->user alternation
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand. Please continue.' }]
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });

      // Gemini API multi-turn requires the first turn to be 'user'
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({
          role: 'user',
          parts: [{ text: 'Hello Saathi.' }]
        });
      }

      const result = await generateWithRotation(
        ['gemini-3.1-flash-lite', 'gemini-3.6-flash'],
        {
          contents,
          config: {
            systemInstruction,
          }
        },
        18000
      );

      const replyText = result.text || getClinicalFallbackResponse(message);
      console.log(`[Chat API] Responded using ${result.model} on key #${result.keyIndexUsed} (${replyText.length} chars)`);
      res.json({ reply: replyText, isFallback: false, model: result.model, keyIndex: result.keyIndexUsed });
    } catch (error: any) {
      console.warn('Gemini API call failed, using clinical fallback:', error?.message);
      res.json({
        reply: getClinicalFallbackResponse(req.body?.message || ''),
        isFallback: true
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Aasra', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
