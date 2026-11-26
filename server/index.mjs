import http from 'node:http';

const PORT = Number(process.env.PORT || 3001);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const SYSTEM_PROMPT = `You are a civic complaint triage assistant for SpeakUp.
Extract structured JSON from a citizen's complaint (which may be in English, Hindi, or Telugu).
Rules:
1. Allowed categories ONLY:
   - "Road damage" -> "Municipal Corporation · Roads & Engineering"
   - "Garbage & sanitation" -> "Municipal Sanitation & Solid Waste Dept."
   - "Streetlight" -> "Municipal Electrical & Street Lighting Dept."
   - "Water supply & leakage" -> "Water Supply & Sewerage Board"
   - "Drainage & sewage" -> "Stormwater & Underground Drainage Dept."
   - "Other municipal issue" -> "General Municipal Civic Cell"
   - "Uncertain" -> "Needs clarification before routing"
2. NEVER invent missing addresses or landmarks. If location is missing or unclear, set location to "" and include "location" in missingFields.
3. If category confidence is below 0.70, set category to "Uncertain" and include "category" in missingFields with a clarification question.
4. Keep title concise (3-6 words) and description concise in English (1-2 clear sentences).
5. Return ONLY valid JSON matching:
{
  "title": string,
  "category": string,
  "department": string,
  "location": string,
  "description": string,
  "urgency": "low" | "medium" | "high",
  "categoryConfidence": number,
  "locationConfidence": number,
  "missingFields": string[],
  "clarificationQuestions": [
    { "id": string, "field": "category"|"location"|"details"|"urgency", "question": string, "options": string[], "allowVoice": true }
  ]
}`;

async function callGemini(transcript, language) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nLanguage hint: ${language}\nCitizen transcript: """${transcript}"""`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API failed (${res.status})`);
  }
  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty Gemini response');
  const parsed = JSON.parse(rawText);
  return { ...parsed, source: 'llm' };
}

async function callOpenAI(transcript, language) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Language hint: ${language}\nCitizen transcript: """${transcript}"""`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API failed (${res.status})`);
  }
  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty OpenAI response');
  const parsed = JSON.parse(rawText);
  return { ...parsed, source: 'llm' };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        llmConfigured: Boolean(GEMINI_API_KEY || OPENAI_API_KEY),
      })
    );
    return;
  }

  if (req.url === '/api/analyze-complaint' && req.method === 'POST') {
    try {
      const { transcript, language = 'en' } = await readJsonBody(req);
      if (!transcript || typeof transcript !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'transcript is required' }));
        return;
      }

      if (GEMINI_API_KEY) {
        const result = await callGemini(transcript, language);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      if (OPENAI_API_KEY) {
        const result = await callOpenAI(transcript, language);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      // No server LLM key configured: inform frontend cleanly so deterministic demo AI handles it
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          mode: 'demo_mock',
          message: 'No LLM API key configured on server; using frontend deterministic Demo AI.',
        })
      );
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : 'Server analysis failed',
        })
      );
    }
    return;
  }

  if (req.url === '/api/transcribe' && req.method === 'POST') {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error:
          'Cloud audio transcription endpoint is a replaceable adapter. Configure Whisper/STT here or use Web Speech API in supported browsers.',
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[SpeakUp API] listening on http://localhost:${PORT}`);
});
