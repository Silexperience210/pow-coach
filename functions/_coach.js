/* PoW Coach — coach IA (helpers purs, testés) 🧠
   Prépare les appels à un LLM compatible OpenAI (Kimi/Moonshot par défaut).
   RÈGLE DE SÉCURITÉ : aucune chaîne libre de l'utilisateur ne part vers le LLM.
   On ne transmet que des NOMBRES bornés et des identifiants d'une liste blanche
   → pas d'injection de prompt possible, pas de donnée personnelle, coût borné. */

// identifiants d'exercice connus (miroir du catalogue client)
export const COACH_EX = new Set([
  "squat", "pushup", "lunge", "plank", "warrior", "tree", "bridge",
  "jacks", "jsquat", "jab", "knee", "punch2", "run",
]);
// fautes détectables côté client (enum fermé)
export const COACH_FAULTS = ["valgus", "shallow", "rushed", "partial", "high", "low"];

const int = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v)) || 0));

/* Nettoie un résumé de séance client → objet sûr (nombres bornés + enums). */
export function sanitizeSession(s) {
  if (!s || typeof s !== "object" || !COACH_EX.has(s.ex)) return null;
  const faults = {};
  for (const f of COACH_FAULTS) {
    const n = int(s.faults && s.faults[f], 0, 999);
    if (n > 0) faults[f] = n;
  }
  return {
    ex: s.ex,
    reps: int(s.reps, 0, 5000),
    perfect: int(s.perfect, 0, 5000),
    avgForm: int(s.avgForm, 0, 100),
    durMin: int(s.durMin, 0, 300),
    maxCombo: int(s.maxCombo, 0, 5000),
    target: int(s.target, 0, 1000),
    daysAgo: int(s.daysAgo, 0, 90),
    faults,
  };
}

/* Nettoie l'état hebdo pour le plan (progression par exercice, bornée). */
export function sanitizeWeek(w) {
  const out = [];
  if (!w || !Array.isArray(w.progress)) return { progress: out, streak: 0 };
  for (const p of w.progress.slice(0, 20)) {
    if (!p || !COACH_EX.has(p.ex)) continue;
    out.push({ ex: p.ex, done: int(p.done, 0, 100000), goal: int(p.goal, 0, 100000) });
  }
  return { progress: out, streak: int(w.streak, 0, 3650) };
}

const FAULT_TXT = {
  fr: { valgus: "genoux qui rentrent", shallow: "amplitude trop courte", rushed: "répétitions expédiées",
    partial: "amplitude incomplète", high: "poing trop haut", low: "poing trop bas" },
  en: { valgus: "knees caving in", shallow: "too-shallow range", rushed: "rushed reps",
    partial: "partial range of motion", high: "fist too high", low: "fist too low" },
  es: { valgus: "rodillas hacia dentro", shallow: "rango demasiado corto", rushed: "repeticiones apresuradas",
    partial: "rango incompleto", high: "puño muy alto", low: "puño muy bajo" },
};
const SYS = {
  fr: `Tu es le coach sportif de PoW Coach, direct et motivant. Tu tutoies. Tu reçois des métriques de séance (jamais de vidéo). Réponds en français, 4 phrases maximum, concret et spécifique aux chiffres reçus. Ne donne JAMAIS de diagnostic médical ; en cas de douleur, conseille de voir un professionnel. Termine toujours par une ligne « Focus prochaine séance : … ».`,
  en: `You are PoW Coach's trainer: direct and motivating. You receive workout metrics (never video). Answer in English, 4 sentences max, concrete and specific to the numbers. NEVER give medical diagnoses; if pain is involved, advise seeing a professional. Always end with a line "Next session focus: …".`,
  es: `Eres el entrenador de PoW Coach: directo y motivador. Recibes métricas de entrenamiento (nunca vídeo). Responde en español, máximo 4 frases, concreto y específico a los números. NUNCA des diagnósticos médicos; ante dolor, aconseja ver a un profesional. Termina siempre con una línea «Enfoque próxima sesión: …».`,
};
const SYS_PLAN = {
  fr: `Tu es le coach sportif de PoW Coach. À partir de la progression hebdomadaire reçue (métriques uniquement), propose un plan simple pour finir la semaine : 3 séances datées « Jour 1/2/3 », chacune avec 2-3 exercices (séries × reps ou minutes), en priorisant les objectifs en retard. Français, tutoiement, 120 mots max, format liste. Pas de conseil médical.`,
  en: `You are PoW Coach's trainer. From the weekly progress received (metrics only), propose a simple plan to finish the week: 3 sessions labeled "Day 1/2/3", each with 2-3 exercises (sets × reps or minutes), prioritizing lagging goals. English, 120 words max, list format. No medical advice.`,
  es: `Eres el entrenador de PoW Coach. A partir del progreso semanal recibido (solo métricas), propone un plan simple para terminar la semana: 3 sesiones «Día 1/2/3», cada una con 2-3 ejercicios (series × reps o minutos), priorizando los objetivos atrasados. Español, máximo 120 palabras, formato lista. Sin consejos médicos.`,
};

function fmtSession(s, lang) {
  const F = FAULT_TXT[lang] || FAULT_TXT.fr;
  const faults = Object.entries(s.faults).map(([k, n]) => `${F[k] || k}×${n}`).join(", ") || "-";
  return `${s.daysAgo}j: ${s.ex} ${s.reps} reps (cible ${s.target || "?"}), ${s.perfect} parfaites, forme moy ${s.avgForm}%, combo max ${s.maxCombo}, ${s.durMin} min, fautes: ${faults}`;
}

/* Construit les messages chat (system+user) pour le débrief ou le plan. */
export function buildMessages(type, lang, data) {
  const l = ["fr", "en", "es"].includes(lang) ? lang : "fr";
  if (type === "plan") {
    const w = sanitizeWeek(data);
    const lines = w.progress.map((p) => `${p.ex}: ${p.done}/${p.goal}`).join("\n") || "(rien cette semaine)";
    return [
      { role: "system", content: SYS_PLAN[l] },
      { role: "user", content: `Streak: ${w.streak} jours\nProgression de la semaine (fait/objectif):\n${lines}` },
    ];
  }
  const last = sanitizeSession(data && data.last);
  if (!last) return null;
  const hist = (Array.isArray(data.history) ? data.history : [])
    .map(sanitizeSession).filter(Boolean).slice(0, 5);
  const histTxt = hist.length ? "\nSéances précédentes:\n" + hist.map((s) => fmtSession(s, l)).join("\n") : "";
  return [
    { role: "system", content: SYS[l] },
    { role: "user", content: `Séance du jour:\n${fmtSession(last, l)}${histTxt}` },
  ];
}

/* Paramètres d'appel selon le mode (validés en réel contre kimi-k2.6) :
   - thinking DÉSACTIVÉ (défaut) : temperature 0.6 exigée, ~10 s, ~130 tokens/débrief.
   - KIMI_THINKING=1 : mode raisonnement → temperature 1 exigée, il faut un gros
     budget de tokens (le raisonnement en consomme ~1000) et un timeout large. */
export function llmParams(env, maxTokens) {
  const thinking = env.KIMI_THINKING === "1";
  return thinking
    ? { temperature: 1, max_tokens: Math.max(2048, (maxTokens || 260) + 1800), timeoutMs: 110000 }
    : { temperature: 0.6, max_tokens: maxTokens || 260, thinking: { type: "disabled" }, timeoutMs: 25000 };
}

/* Appelle un endpoint chat/completions compatible OpenAI (Kimi/Moonshot).
   fetchFn(url, opts, timeoutMs) permet d'injecter tfetch (et les tests). */
export async function llmChat(env, messages, maxTokens, fetchFn) {
  const base = (env.KIMI_URL || "https://api.moonshot.ai/v1").replace(/\/+$/, "");
  const model = env.KIMI_MODEL || "kimi-k2.6";
  const p = llmParams(env, maxTokens);
  const body = { model, messages, temperature: p.temperature, max_tokens: p.max_tokens };
  if (p.thinking) body.thinking = p.thinking;
  const r = await (fetchFn || fetch)(base + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.KIMI_API_KEY },
    body: JSON.stringify(body),
  }, p.timeoutMs);
  if (!r.ok) throw new Error("llm_" + r.status);
  const d = await r.json();
  const text = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
  if (!text) throw new Error("llm_empty");
  return String(text).trim().slice(0, 2000);
}
