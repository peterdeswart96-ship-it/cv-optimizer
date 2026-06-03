const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// Rate limiting: max 10 aanroepen per uur per IP-adres
// Map-structuur: { ip: { count: number, resetTime: timestamp } }
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 uur in milliseconden

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // Eerste aanroep van dit IP, of het tijdvenster is verlopen — reset
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    // Limiet bereikt
    const minutesLeft = Math.ceil((entry.resetTime - now) / 60000);
    return { allowed: false, remaining: 0, minutesLeft };
  }

  // Nog binnen limiet — teller ophogen
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function stripMarkdown(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

app.http('analyze', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    // IP-adres ophalen (Azure stuurt dit via de x-forwarded-for header)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      context.log(`Rate limit bereikt voor IP: ${ip}`);
      return {
        status: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Te veel aanvragen. Probeer het over ${rateCheck.minutesLeft} minuten opnieuw.`,
          retry_after_minutes: rateCheck.minutesLeft
        })
      };
    }

    context.log(`Aanroep toegestaan voor IP: ${ip} — nog ${rateCheck.remaining} aanroepen over dit uur`);

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
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
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
      "originele_tekst": "volledige originele tekst van deze sectie"
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
