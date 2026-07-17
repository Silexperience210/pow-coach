/* PoW Coach — coach IA (helpers purs, testés) 🧠
   Prépare les appels à un LLM compatible OpenAI (Kimi/Moonshot par défaut).
   RÈGLE DE SÉCURITÉ : aucune chaîne libre de l'utilisateur ne part vers le LLM.
   On ne transmet que des NOMBRES bornés et des identifiants d'une liste blanche
   → pas d'injection de prompt possible, pas de donnée personnelle, coût borné.
   Exception type "posture" : une image JPEG/PNG en data URL (visage flouté côté
   client, jamais de méta-données) — bornée en taille. */

// identifiants d'exercice connus (miroir du catalogue client)
export const COACH_EX = new Set([
  "squat", "pushup", "lunge", "plank", "warrior", "tree", "bridge",
  "jacks", "jsquat", "jab", "knee", "punch2", "run",
  "burpee", "situp", "climber",
]);
// fautes détectables côté client (enum fermé)
export const COACH_FAULTS = ["valgus", "shallow", "rushed", "partial", "high", "low", "fatigue"];
// personas du coach (enum fermé — tout autre valeur retombe sur "coach")
export const COACH_PERSONAS = new Set(["coach", "drill", "zen", "nerd"]);
const HOLD_EX = new Set(["plank", "warrior", "tree"]); // exercices en secondes

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
    // VBT : perte de vitesse concentrique (%) entre la meilleure et la dernière rep
    velDrop: int(s.velDrop, 0, 100),
    // dispersion de la forme sur la séance (0-100) — min/med/max des reps
    formMin: int(s.formMin, 0, 100), formMax: int(s.formMax, 0, 100),
    faults,
  };
}

/* Nettoie l'état hebdo pour le plan (progression par exercice, bornée).
   acwr = ratio charge 7 j / charge 28 j ×100 (sport-science : 80-130 = zone saine,
   >150 = surcharge → le plan doit alléger). null si historique insuffisant. */
export function sanitizeWeek(w) {
  const out = [];
  if (!w || !Array.isArray(w.progress)) return { progress: out, streak: 0, acwr: null };
  for (const p of w.progress.slice(0, 20)) {
    if (!p || !COACH_EX.has(p.ex)) continue;
    out.push({ ex: p.ex, done: int(p.done, 0, 100000), goal: int(p.goal, 0, 100000) });
  }
  const acwr = w.acwr === null || w.acwr === undefined ? null : int(w.acwr, 0, 400);
  return { progress: out, streak: int(w.streak, 0, 3650), acwr };
}

/* Garde-fou de l'image "posture" : data URL JPEG/PNG, ~675 Ko max (base64). */
export function sanitizeImage(img) {
  if (typeof img !== "string") return null;
  if (!/^data:image\/(jpeg|png);base64,/.test(img)) return null;
  if (img.length > 900000) return null;
  return img;
}

const FAULT_TXT = {
  fr: { valgus: "genoux qui rentrent", shallow: "amplitude trop courte", rushed: "répétitions expédiées",
    partial: "amplitude incomplète", high: "poing trop haut", low: "poing trop bas", fatigue: "perte de vitesse en fin de série" },
  en: { valgus: "knees caving in", shallow: "too-shallow range", rushed: "rushed reps",
    partial: "partial range of motion", high: "fist too high", low: "fist too low", fatigue: "velocity loss late in the set" },
  es: { valgus: "rodillas hacia dentro", shallow: "rango demasiado corto", rushed: "repeticiones apresuradas",
    partial: "rango incompleto", high: "puño muy alto", low: "puño muy bajo", fatigue: "pérdida de velocidad al final de la serie" },
};
/* Personas : tonalité ajoutée au prompt système (jamais de contenu utilisateur). */
const PERSONA_TXT = {
  coach: { fr: "", en: "", es: "" },
  drill: {
    fr: " Ton style : sergent instructeur — sec, exigeant, impératif, zéro excuse, mais juste.",
    en: " Your style: drill sergeant — blunt, demanding, imperative, zero excuses, but fair.",
    es: " Tu estilo: sargento — seco, exigente, imperativo, cero excusas, pero justo.",
  },
  zen: {
    fr: " Ton style : maître zen — calme, précis, orienté respiration et alignement, encourage sans pression.",
    en: " Your style: zen master — calm, precise, focused on breathing and alignment, encouraging without pressure.",
    es: " Tu estilo: maestro zen — calmado, preciso, centrado en respiración y alineación, anima sin presión.",
  },
  nerd: {
    fr: " Ton style : nerd des données — cite les chiffres (%, dispersion, vitesse), compare à la séance précédente, zéro blabla.",
    en: " Your style: data nerd — quote the numbers (%, spread, velocity), compare with the previous session, zero fluff.",
    es: " Tu estilo: nerd de los datos — cita las cifras (%, dispersión, velocidad), compara con la sesión anterior, cero palabrería.",
  },
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
/* Générateur de SÉANCE JOUABLE : le LLM ne répond QUE du JSON (parsé + borné
   côté serveur par validateSessionPlan) → l'app l'exécute en mode guidé. */
const SYS_SESSION = {
  fr: `Tu es le programmateur d'entraînement de PoW Coach. Réponds UNIQUEMENT par un objet JSON valide, rien d'autre (pas de markdown, pas de commentaire). Schéma exact : {"titre": string (max 40 car., français), "exercices": [{"ex": string, "series": number, "reps": number} ou {"ex": string, "series": number, "sec": number}], "repos": number (secondes entre séries, 30-120)}. Règles : 2 à 4 exercices ; "series" entre 1 et 5 ; "reps" entre 5 et 60 ; "sec" (uniquement pour plank, warrior, tree) entre 15 et 120. Adapte le volume à la progression reçue : vise légèrement AU-DESSUS du niveau actuel, sauf si le ratio de charge (ACWR) dépasse 150 → séance allégée.`,
  en: `You are PoW Coach's workout programmer. Reply with ONLY a valid JSON object, nothing else (no markdown, no comment). Exact schema: {"titre": string (max 40 chars, English), "exercices": [{"ex": string, "series": number, "reps": number} or {"ex": string, "series": number, "sec": number}], "repos": number (rest seconds between sets, 30-120)}. Rules: 2 to 4 exercises; "series" 1-5; "reps" 5-60; "sec" (only for plank, warrior, tree) 15-120. Scale volume to the progress received: aim slightly ABOVE current level, unless the workload ratio (ACWR) exceeds 150 → lighter session.`,
  es: `Eres el programador de entrenamiento de PoW Coach. Responde SOLO con un objeto JSON válido, nada más (sin markdown, sin comentarios). Esquema exacto: {"titre": string (máx 40 car., español), "exercices": [{"ex": string, "series": number, "reps": number} o {"ex": string, "series": number, "sec": number}], "repos": number (segundos de descanso, 30-120)}. Reglas: 2 a 4 ejercicios; "series" 1-5; "reps" 5-60; "sec" (solo plank, warrior, tree) 15-120. Adapta el volumen al progreso: ligeramente POR ENCIMA del nivel actual, salvo si el ratio de carga (ACWR) supera 150 → sesión ligera.`,
};
const SYS_POSTURE = {
  fr: `Tu es le coach posture de PoW Coach. Tu reçois UNE photo d'un exercice (le visage est masqué volontairement — ignore-le, ne commente JAMAIS l'identité). Analyse uniquement l'alignement visible : dos, hanches, genoux, épaules, placement des pieds/mains. Réponds en français : 1 phrase de constat + 2-3 corrections concrètes et actionnables (impératif, tutoiement). Aucun diagnostic médical.`,
  en: `You are PoW Coach's posture trainer. You receive ONE workout photo (the face is deliberately masked — ignore it, NEVER comment on identity). Analyze only visible alignment: back, hips, knees, shoulders, foot/hand placement. Answer in English: 1 sentence of observation + 2-3 concrete, actionable corrections (imperative). No medical diagnosis.`,
  es: `Eres el entrenador de postura de PoW Coach. Recibes UNA foto de ejercicio (la cara está oculta a propósito — ignórala, NUNCA comentes la identidad). Analiza solo la alineación visible: espalda, caderas, rodillas, hombros, colocación de pies/manos. Responde en español: 1 frase de observación + 2-3 correcciones concretas (imperativo). Sin diagnóstico médico.`,
};

function fmtSession(s, lang) {
  const F = FAULT_TXT[lang] || FAULT_TXT.fr;
  const faults = Object.entries(s.faults).map(([k, n]) => `${F[k] || k}×${n}`).join(", ") || "-";
  let t = `${s.daysAgo}j: ${s.ex} ${s.reps} reps (cible ${s.target || "?"}), ${s.perfect} parfaites, forme moy ${s.avgForm}%`;
  if (s.formMax > 0) t += ` [${s.formMin}-${s.formMax}]`;
  t += `, combo max ${s.maxCombo}, ${s.durMin} min`;
  if (s.velDrop > 0) t += `, perte de vitesse ${s.velDrop}%`;
  return t + `, fautes: ${faults}`;
}

function personaOf(p) { return COACH_PERSONAS.has(p) ? p : "coach"; }

/* Construit les messages chat (system+user) pour un type donné.
   types : "debrief" | "plan" | "session" (séance JSON jouable) | "posture" (image). */
export function buildMessages(type, lang, data, persona) {
  const l = ["fr", "en", "es"].includes(lang) ? lang : "fr";
  const pers = (PERSONA_TXT[personaOf(persona)] || PERSONA_TXT.coach)[l] || "";
  if (type === "plan" || type === "session") {
    const w = sanitizeWeek(data);
    const lines = w.progress.map((p) => `${p.ex}: ${p.done}/${p.goal}`).join("\n") || "(rien cette semaine)";
    const acwrTxt = w.acwr === null ? "inconnu (nouvel utilisateur)" : w.acwr + "%";
    const user = `Streak: ${w.streak} jours\nRatio de charge ACWR (7j/28j): ${acwrTxt}\nProgression de la semaine (fait/objectif):\n${lines}`;
    if (type === "plan")
      return [{ role: "system", content: SYS_PLAN[l] + pers }, { role: "user", content: user }];
    const exList = [...COACH_EX].filter((e) => e !== "run").join(", ");
    return [
      { role: "system", content: SYS_SESSION[l] + ` Exercices autorisés (champ "ex") : ${exList}.` + pers },
      { role: "user", content: user },
    ];
  }
  if (type === "posture") {
    const img = sanitizeImage(data && data.image);
    const ex = data && COACH_EX.has(data.ex) ? data.ex : null;
    if (!img || !ex) return null;
    return [
      { role: "system", content: SYS_POSTURE[l] + pers },
      { role: "user", content: [
        { type: "text", text: `Exercice : ${ex}` },
        { type: "image_url", image_url: { url: img } },
      ] },
    ];
  }
  const last = sanitizeSession(data && data.last);
  if (!last) return null;
  const hist = (Array.isArray(data.history) ? data.history : [])
    .map(sanitizeSession).filter(Boolean).slice(0, 5);
  const histTxt = hist.length ? "\nSéances précédentes:\n" + hist.map((s) => fmtSession(s, l)).join("\n") : "";
  return [
    { role: "system", content: SYS[l] + pers },
    { role: "user", content: `Séance du jour:\n${fmtSession(last, l)}${histTxt}` },
  ];
}

/* Valide + borne la séance JSON renvoyée par le LLM (le modèle est un brouillon,
   le serveur fait foi). Retourne null si inexploitable. */
export function validateSessionPlan(text) {
  if (!text || typeof text !== "string") return null;
  let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  let d;
  try { d = JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  if (!d || !Array.isArray(d.exercices)) return null;
  const exercices = [];
  for (const e of d.exercices.slice(0, 4)) {
    if (!e || !COACH_EX.has(e.ex) || e.ex === "run") continue;
    const series = int(e.series, 1, 5);
    if (HOLD_EX.has(e.ex)) exercices.push({ ex: e.ex, series, sec: int(e.sec, 15, 120) });
    else exercices.push({ ex: e.ex, series, reps: int(e.reps, 5, 60) });
  }
  if (!exercices.length) return null;
  const titre = String(d.titre || "Séance IA").replace(/[<>]/g, "").slice(0, 40) || "Séance IA";
  return { titre, exercices, repos: int(d.repos, 30, 120) || 60 };
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

const hasImage = (messages) => messages.some((m) => Array.isArray(m.content)
  && m.content.some((c) => c && c.type === "image_url"));
function modelFor(env, messages) {
  // les appels vision passent sur le modèle image (kimi-latest gère le multimodal)
  return hasImage(messages) ? (env.KIMI_VISION_MODEL || "kimi-latest")
    : (env.KIMI_MODEL || "kimi-k2.6");
}
function reqBody(env, messages, maxTokens, extra) {
  const p = llmParams(env, maxTokens);
  const body = { model: modelFor(env, messages), messages, temperature: p.temperature, max_tokens: p.max_tokens };
  if (p.thinking) body.thinking = p.thinking;
  if (extra && extra.json) body.response_format = { type: "json_object" };
  if (extra && extra.stream) body.stream = true;
  return { body, timeoutMs: p.timeoutMs };
}
const llmUrl = (env) => (env.KIMI_URL || "https://api.moonshot.ai/v1").replace(/\/+$/, "") + "/chat/completions";
const llmOpts = (env, body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.KIMI_API_KEY },
  body: JSON.stringify(body),
});

/* Appelle un endpoint chat/completions compatible OpenAI (Kimi/Moonshot).
   fetchFn(url, opts, timeoutMs) permet d'injecter tfetch (et les tests). */
export async function llmChat(env, messages, maxTokens, fetchFn, extra) {
  const { body, timeoutMs } = reqBody(env, messages, maxTokens, extra);
  const r = await (fetchFn || fetch)(llmUrl(env), llmOpts(env, body), timeoutMs);
  if (!r.ok) throw new Error("llm_" + r.status);
  const d = await r.json();
  const text = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
  if (!text) throw new Error("llm_empty");
  return String(text).trim().slice(0, 2000);
}

/* Version STREAMING : renvoie la Response brute (SSE OpenAI-compatible) pour
   être relayée telle quelle par la Function → le texte s'affiche en direct. */
export async function llmStream(env, messages, maxTokens, fetchFn, extra) {
  const { body, timeoutMs } = reqBody(env, messages, maxTokens, { ...(extra || {}), stream: true });
  const r = await (fetchFn || fetch)(llmUrl(env), llmOpts(env, body), timeoutMs);
  if (!r.ok || !r.body) throw new Error("llm_" + r.status);
  return r;
}
