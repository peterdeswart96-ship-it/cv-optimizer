const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');
const { valideerToken } = require('./auth');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// ─── Rate limiter ────────────────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_VENSTER_MS = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const nu = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || nu > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: nu + RATE_LIMIT_VENSTER_MS });
    return { toegestaan: true, resterend: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetOverMs = entry.resetAt - nu;
    const resetOverMin = Math.ceil(resetOverMs / 60000);
    return { toegestaan: false, resetOverMin };
  }

  entry.count += 1;
  return { toegestaan: true, resterend: RATE_LIMIT_MAX - entry.count };
}
// ─────────────────────────────────────────────────────────────────────────────

function stripMarkdown(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

const TOEGESTAAN_ORIGIN = 'https://cv-optimizer.pdscloud.nl';

app.http('analyze', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': TOEGESTAAN_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    // ── Token validatie ────────────────────────────────────────────────────
    try {
      const gebruiker = await valideerToken(request);
      context.log('Token geldig voor gebruiker:', gebruiker.preferred_username ?? gebruiker.sub);
    } catch (err) {
      context.log('Token validatie mislukt:', err.message);
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Niet geautoriseerd', details: err.message })
      };
    }
    // ──────────────────────────────────────────────────────────────────────

    // ── Rate limiting ──────────────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
               ?? request.headers.get('client-ip')
               ?? 'onbekend';

    const limiet = checkRateLimit(ip);
    if (!limiet.toegestaan) {
      context.log(`Rate limit bereikt voor IP: ${ip}`);
      return {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': String(limiet.resetOverMin * 60)
        },
        body: JSON.stringify({
          error: `Te veel aanvragen. Probeer het over ${limiet.resetOverMin} minuten opnieuw.`
        })
      };
    }
    context.log(`Rate limit OK voor IP: ${ip} — nog ${limiet.resterend} aanroepen over dit uur`);
    // ──────────────────────────────────────────────────────────────────────

    try {
      const body = await request.json();
      const { cv_tekst, vacature_tekst } = body;

      if (!cv_tekst || !vacature_tekst) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'cv_tekst en vacature_tekst zijn verplicht' })
        };
      }

      context.log('Analyse gestart — CV lengte:', cv_tekst.length, 'tekens');

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8096,
        system: `Je bent een professionele loopbaancoach en recruitment specialist met 15 jaar ervaring.
Je analyseert CV's en vacatures met als doel de kandidaat te helpen zijn/haar kansen te maximaliseren.
Gedraag je als een eerlijke, constructieve coach — niet als een PR-bureau.
Geef concrete, specifieke feedback gebaseerd op de daadwerkelijke inhoud.
Detecteer automatisch de taal van het CV (NL of EN) en antwoord in dezelfde taal.
Retourneer ALLEEN geldige JSON, geen markdown, geen inleiding, geen uitleg buiten de JSON.`,
        messages: [{
          role: 'user',
          content: `Analyseer dit CV ten opzichte van deze vacature.

CV:
<cv_tekst>
${cv_tekst}
</cv_tekst>

Vacature:
<vacature>
${vacature_tekst}
</vacature>

Retourneer de volgende JSON-structuur:
{
  "taal": "nl",
  "match_score": 75,
  "match_toelichting": "2-3 zinnen waarom deze score",
  "ontbrekende_keywords": ["keyword1", "keyword2"],
  "aanwezige_keywords": ["keyword1", "keyword2"],
  "tone_of_voice_vacature": "beschrijf de toon van het bedrijf in 2-3 zinnen",
  "tone_of_voice_cv": "beschrijf de huidige toon van het CV in 2-3 zinnen",
  "tone_aanbeveling": "concrete aanbeveling voor toon-aanpassing",
  "secties": [
    {
      "naam": "sectienaam zoals gevonden in CV",
      "volgorde": 1,
      "originele_tekst": "volledige originele tekst van deze sectie — VERPLICHT, altijd invullen"
    }
  ]
}`
        }]
      });

      const rawText = response.content[0].text;
      const cleanText = stripMarkdown(rawText);
      const analyseResultaat = JSON.parse(cleanText);

      context.log('Analyse succesvol — match score:', analyseResultaat.match_score);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(analyseResultaat)
      };

    } catch (error) {
      context.log('Fout bij analyse:', error.message);

      if (error instanceof SyntaxError) {
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Claude gaf geen geldige JSON terug', details: error.message })
        };
      }

      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Interne serverfout', details: error.message })
      };
    }
  }
});