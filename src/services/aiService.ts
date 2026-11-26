import { CATEGORY_LIST, getDepartmentForCategory } from '../data/categories';
import type {
  AIExtractionResult,
  ClarificationQuestion,
  Complaint,
  ComplaintCategory,
  LanguageCode,
  UrgencyLevel,
} from '../types/complaint';

const VALID_CATEGORIES = new Set<string>(CATEGORY_LIST.map((c) => c.category));
const VALID_URGENCY = new Set<string>(['low', 'medium', 'high']);

/**
 * Validates and normalizes AI JSON output so malformed or hallucinated fields
 * never slip into the UI unchecked.
 */
export function validateExtractionResult(raw: unknown): AIExtractionResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const rawCategory = typeof obj.category === 'string' ? obj.category : 'Uncertain';
  const category: ComplaintCategory | 'Uncertain' = VALID_CATEGORIES.has(rawCategory)
    ? (rawCategory as ComplaintCategory)
    : 'Uncertain';

  const urgency: UrgencyLevel =
    typeof obj.urgency === 'string' && VALID_URGENCY.has(obj.urgency)
      ? (obj.urgency as UrgencyLevel)
      : 'medium';

  const categoryConfidence =
    typeof obj.categoryConfidence === 'number'
      ? Math.max(0, Math.min(1, obj.categoryConfidence))
      : 0.5;
  const locationConfidence =
    typeof obj.locationConfidence === 'number'
      ? Math.max(0, Math.min(1, obj.locationConfidence))
      : 0;

  const location = typeof obj.location === 'string' ? obj.location.trim() : '';
  const title =
    typeof obj.title === 'string' && obj.title.trim().length > 0
      ? obj.title.trim()
      : category === 'Uncertain'
        ? 'Civic issue report'
        : `${category} issue`;

  const description =
    typeof obj.description === 'string' && obj.description.trim().length > 0
      ? obj.description.trim()
      : title;

  const department =
    category === 'Uncertain'
      ? 'Needs clarification before routing'
      : typeof obj.department === 'string' && obj.department.trim().length > 0
        ? obj.department.trim()
        : getDepartmentForCategory(category);

  const missingSet = new Set<'category' | 'location' | 'details' | 'urgency'>();
  if (Array.isArray(obj.missingFields)) {
    for (const f of obj.missingFields) {
      if (f === 'category' || f === 'location' || f === 'details' || f === 'urgency') {
        missingSet.add(f);
      }
    }
  }
  if (category === 'Uncertain' || categoryConfidence < 0.65) {
    missingSet.add('category');
  }
  if (!location || locationConfidence < 0.45) {
    missingSet.add('location');
  }

  const questions: ClarificationQuestion[] = Array.isArray(obj.clarificationQuestions)
    ? obj.clarificationQuestions
        .filter((q): q is ClarificationQuestion => {
          if (!q || typeof q !== 'object') return false;
          const item = q as Record<string, unknown>;
          return (
            typeof item.id === 'string' &&
            typeof item.question === 'string' &&
            Array.isArray(item.options)
          );
        })
        .slice(0, 3)
    : [];

  return {
    title,
    category,
    department,
    location,
    description,
    urgency,
    categoryConfidence,
    locationConfidence,
    missingFields: Array.from(missingSet),
    clarificationQuestions: questions,
    source: obj.source === 'llm' ? 'llm' : 'demo_mock',
    note: typeof obj.note === 'string' ? obj.note : undefined,
  };
}

/**
 * Deterministic local analyzer for demo mode (or when no server LLM key is configured).
 * Never fabricates missing locations and flags low-confidence categories for clarification.
 */
export function analyzeComplaintDeterministic(
  transcript: string,
  language: LanguageCode
): AIExtractionResult {
  const clean = transcript.trim();
  const lower = clean.toLowerCase();

  let bestCategory: ComplaintCategory | 'Uncertain' = 'Uncertain';
  let bestScore = 0;

  for (const meta of CATEGORY_LIST) {
    let score = 0;
    for (const kw of meta.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = meta.category;
    }
  }

  // Also check common transliterated Hindi / Telugu words
  if (bestScore === 0) {
    if (/\b(gaddha|sadak|guntalu|gunta|rodd?u)\b/i.test(lower)) {
      bestCategory = 'Road damage';
      bestScore = 1;
    } else if (/\b(kachra|chetha|chett?a|kuda)\b/i.test(lower)) {
      bestCategory = 'Garbage & sanitation';
      bestScore = 1;
    } else if (/\b(bijli|batti|deepam|velagadam)\b/i.test(lower)) {
      bestCategory = 'Streetlight';
      bestScore = 1;
    } else if (/\b(paani|pani|neellu|neeru|nal)\b/i.test(lower)) {
      bestCategory = 'Water supply & leakage';
      bestScore = 1;
    } else if (/\b(naala|nali|murugu|sewer)\b/i.test(lower)) {
      bestCategory = 'Drainage & sewage';
      bestScore = 1;
    }
  }

  const categoryConfidence = bestScore >= 2 ? 0.92 : bestScore === 1 ? 0.76 : 0.35;
  if (categoryConfidence < 0.65) {
    bestCategory = 'Uncertain';
  }

  // Extract location cues without inventing anything
  let extractedLocation = '';
  let locationConfidence = 0;

  const knownLocalities = [
    'kukatpally',
    'madhapur',
    'jubilee hills',
    'ameerpet',
    'sr nagar',
    'banjara hills',
    'gachibowli',
    'secunderabad',
    'miyapur',
    'begumpet',
    'dilsukhnagar',
    'कुकटपल्ली',
    'माधापुर',
    'अयप्पा सोसाइटी',
    'కూకట్‌పల్లి',
    'మాదాపూర్',
  ];

  const foundLocalities = knownLocalities.filter((loc) => lower.includes(loc));
  const locPhraseMatch = clean.match(
    /(?:near|at|in|opposite|behind|beside|on)\s+([A-Za-z0-9\s,'-]{3,55}?)(?:\.|,|$|\band\b|\bfor\b|\bit\b)/i
  );

  if (foundLocalities.length > 0 && locPhraseMatch) {
    const locality = foundLocalities[0].replace(/\b\w/g, (c) => c.toUpperCase());
    const phrase = locPhraseMatch[1].trim();
    extractedLocation = phrase.toLowerCase().includes(foundLocalities[0])
      ? phrase
      : `${locality}, near ${phrase}`;
    locationConfidence = 0.88;
  } else if (foundLocalities.length > 0) {
    extractedLocation = foundLocalities[0].replace(/\b\w/g, (c) => c.toUpperCase());
    locationConfidence = 0.72;
  } else if (locPhraseMatch && locPhraseMatch[1].trim().length >= 4) {
    extractedLocation = locPhraseMatch[1].trim();
    locationConfidence = 0.65;
  } else if (/पास|దగ్గర|రోడ్డు|सड़क|बस स्टॉप|బస్ స్టాప్/.test(clean)) {
    // Landmark mentioned in Hindi/Telugu without full area name
    const snippet = clean.split(/[।,.]/)[0].trim();
    if (snippet.length <= 60) {
      extractedLocation = snippet;
      locationConfidence = 0.52;
    }
  }

  // Urgency detection
  let urgency: UrgencyLevel = 'medium';
  if (
    /accident|danger|urgent|spark|electric|flood|two weeks|weeks|broken|overflow|बड़ा|दुर्घटना|పెద్ద|ప్రమాదం/i.test(
      clean
    )
  ) {
    urgency = 'high';
  } else if (/small|minor|low pressure|sometimes/i.test(clean)) {
    urgency = 'low';
  }

  // Title generation
  let title = 'Civic problem report';
  if (bestCategory === 'Road damage') {
    title = lower.includes('pothole') || /गड्ढा|గుంట/.test(clean)
      ? 'Pothole on main road'
      : 'Damaged road surface';
  } else if (bestCategory === 'Garbage & sanitation') {
    title = 'Garbage not collected';
  } else if (bestCategory === 'Streetlight') {
    title = 'Streetlight not working';
  } else if (bestCategory === 'Water supply & leakage') {
    title = /leak|रिसाव|లీక్/i.test(clean) ? 'Water pipe leakage' : 'Water supply issue';
  } else if (bestCategory === 'Drainage & sewage') {
    title = 'Blocked drainage / sewage overflow';
  }

  const department =
    bestCategory === 'Uncertain'
      ? 'Needs clarification before routing'
      : getDepartmentForCategory(bestCategory);

  const description = buildConciseSummary(clean, bestCategory, extractedLocation);

  const missingFields: Array<'category' | 'location' | 'details' | 'urgency'> = [];
  const clarificationQuestions: ClarificationQuestion[] = [];

  if (bestCategory === 'Uncertain' || categoryConfidence < 0.65) {
    missingFields.push('category');
    clarificationQuestions.push({
      id: 'q-category',
      field: 'category',
      question: getLocalizedQuestion(language, 'category'),
      options: [
        'Road damage',
        'Garbage & sanitation',
        'Streetlight',
        'Water supply & leakage',
        'Drainage & sewage',
      ],
      allowVoice: true,
    });
  }

  if (!extractedLocation || locationConfidence < 0.7) {
    missingFields.push('location');
    clarificationQuestions.push({
      id: 'q-location',
      field: 'location',
      question: extractedLocation
        ? getLocalizedQuestion(language, 'locality_confirm', extractedLocation)
        : getLocalizedQuestion(language, 'location'),
      options: [
        'Near main bus stop',
        'Kukatpally',
        'Madhapur',
        'Ameerpet',
      ],
      allowVoice: true,
    });
  }

  if (clean.length < 22) {
    missingFields.push('details');
    clarificationQuestions.push({
      id: 'q-details',
      field: 'details',
      question: getLocalizedQuestion(language, 'details'),
      options: [
        'Happening for a few days',
        'Ongoing for over a week',
        'Posing a safety hazard today',
      ],
      allowVoice: true,
    });
  }

  return {
    title,
    category: bestCategory,
    department,
    location: extractedLocation,
    description,
    urgency,
    categoryConfidence,
    locationConfidence,
    missingFields,
    clarificationQuestions,
    source: 'demo_mock',
    note: 'Analyzed with deterministic Demo Mode AI (no paid LLM key required).',
  };
}

function buildConciseSummary(
  clean: string,
  category: ComplaintCategory | 'Uncertain',
  location: string
): string {
  if (/^[a-zA-Z0-9\s.,'"!?()-]+$/.test(clean) && clean.length >= 25) {
    const trimmed = clean.endsWith('.') ? clean : `${clean}.`;
    return `${trimmed} Inspection and repair requested.`;
  }
  const catText = category === 'Uncertain' ? 'Civic issue' : category;
  const locText = location ? ` reported at ${location}` : '';
  return `${catText}${locText}. Citizen report: "${clean}". Municipal inspection requested.`;
}

function getLocalizedQuestion(
  language: LanguageCode,
  type: 'category' | 'location' | 'locality_confirm' | 'details',
  context?: string
): string {
  if (language === 'hi') {
    if (type === 'category') return 'यह समस्या किस श्रेणी में आती है ताकि हम इसे सही विभाग को भेज सकें?';
    if (type === 'locality_confirm')
      return `आपने "${context}" का उल्लेख किया — कृपया कॉलोनी या क्षेत्र का नाम बताएं?`;
    if (type === 'location') return 'यह समस्या किस क्षेत्र, कॉलोनी या लैंडमार्क के पास है?';
    return 'यह समस्या कितने समय से है या कितनी गंभीर है?';
  }
  if (language === 'te') {
    if (type === 'category') return 'సరైన విభాగానికి పంపడానికి, ఈ సమస్య ఏ వర్గానికి చెందుతుందో చెప్పగలరా?';
    if (type === 'locality_confirm')
      return `మీరు "${context}" అని చెప్పారు — అది ఏ కాలనీ లేదా ప్రాంతంలో ఉందో చెప్పగలరా?`;
    if (type === 'location') return 'ఈ సమస్య ఏ ప్రాంతం, కాలనీ లేదా ల్యాండ్‌మార్క్ దగ్గర ఉంది?';
    return 'ఈ సమస్య ఎన్ని రోజులుగా ఉంది మరియు ఎంత తీవ్రంగా ఉంది?';
  }
  if (type === 'category') {
    return 'Which category best describes this issue so we route it to the right department?';
  }
  if (type === 'locality_confirm') {
    return `You mentioned "${context}". Which locality or colony is that in?`;
  }
  if (type === 'location') {
    return 'Which area, colony, or nearest landmark is this issue located at?';
  }
  return 'How long has this problem been occurring, or is it causing an immediate hazard?';
}

export async function analyzeComplaintWithServer(
  transcript: string,
  language: LanguageCode
): Promise<AIExtractionResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const response = await fetch('/api/analyze-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      const json = await response.json();
      const validated = validateExtractionResult(json);
      if (validated) return validated;
    }
  } catch {
    // Backend unreachable or timed out; fall back transparently to local demo analyzer
  }

  return analyzeComplaintDeterministic(transcript, language);
}

/**
 * Basic duplicate detection based on category, location overlap, and recent timeframe (48h).
 */
export function findPotentialDuplicate(
  existing: Complaint[],
  category: ComplaintCategory,
  location: string
): Complaint | null {
  const normalizedLoc = location.trim().toLowerCase();
  if (normalizedLoc.length < 3) return null;

  const cutoffMs = Date.now() - 48 * 3600 * 1000;
  const locTokens = normalizedLoc
    .split(/[\s,.-]+/)
    .filter((t) => t.length >= 4);

  for (const item of existing) {
    if (item.status === 'resolved') continue;
    if (item.category !== category) continue;
    const createdMs = new Date(item.created_at).getTime();
    if (Number.isNaN(createdMs) || createdMs < cutoffMs) continue;

    const itemLoc = item.location.toLowerCase();
    const overlap = locTokens.some((token) => itemLoc.includes(token));
    if (overlap || itemLoc === normalizedLoc) {
      return item;
    }
  }
  return null;
}
