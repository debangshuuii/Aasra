import { generateWithRotation, getGeminiApiKeys } from '../server/geminiRotation';

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

  // General compassionate fallback — rotated by time to avoid repetition
  const fallbacks = [
    `Thank you for sharing that with me. Experiencing trauma reactions can feel overwhelming and isolating, but these responses are normal physiological adaptations to severe stress. What aspect of what you're feeling would be most supportive to focus on right now—understanding symptoms, practical grounding exercises, or next steps with a healthcare provider?`,
    `I hear you, and what you're describing is deeply valid. Healing from traumatic stress is not linear, and giving voice to these feelings is a courageous step. Would you like to explore how your body is feeling in this moment, or would you prefer information on coping strategies?`,
    `Thank you for opening up about this. Trauma can impact how safe we feel in our bodies and in our environments. Remember that you do not have to carry this all alone. We can take this one step at a time—would a calming breathing exercise or learning about symptom patterns feel more helpful right now?`,
    `What you're sharing takes real courage. The nervous system's response to overwhelming stress—whether it shows up as tension, exhaustion, or emotional numbness—is your body's protective intelligence at work. Would it help to talk through what you're noticing, or would you prefer some grounding support right now?`,
    `I'm here with you in this moment. Difficult feelings don't follow a set schedule, and there's no "right" way to process what you've been through. Would you like to explore what trauma-informed support looks like for your specific experience, or would a simple calming technique help first?`
  ];

  const timeSlot = Math.floor(Date.now() / 30000);
  const msgHash = Math.abs(message.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return fallbacks[(timeSlot + msgHash) % fallbacks.length];
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
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const availableKeys = getGeminiApiKeys();
    if (availableKeys.length === 0) {
      return res.status(200).json({
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

    // Always append the new user message — bridge with model turn if history ends on 'user'
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.push({
        role: 'model',
        parts: [{ text: 'I understand. Please continue.' }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

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
    res.status(200).json({ reply: replyText, isFallback: false, model: result.model, keyIndex: result.keyIndexUsed });
  } catch (error: any) {
    console.warn('[Vercel api/chat] Gemini API failed, using fallback:', error?.message);
    res.status(200).json({
      reply: getClinicalFallbackResponse(req.body?.message || ''),
      isFallback: true
    });
  }
}
