const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');
const { valideerToken } = require('../../auth');

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function stripMarkdown(text) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

app.http('analyze-cv', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

    // ── Token validatie ──────────────────────────────────────────────────────
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
    // ────────────────────────────────────────────────────────────────────────

    try {
      const body = await request.json();
      const { cv_secties, portfolio, vacature_tekst } = body;

      if (!cv_secties || !vacature_tekst) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'cv_secties en vacature_tekst zijn verplicht' })
        };
      }

      // Lengtebegrenzing als extra bescherming (AVG: minimale verwerking)
      const cvStr = cv_secties.map(s => `[${s.naam}]\n${s.inhoud}`).join('\n\n').substring(0, 4000);
      const vacatuurStr = vacature_tekst.substring(0, 2500);
      const pStr = portfolio?.on && portfolio?.bestandsnaam
        ? `\nPORTFOLIO: bijgevoegd bestand "${portfolio.bestandsnaam}"`
        : '';

      context.log('Analyze-cv gestart');

      const prompt = `Expert recruiter. Analyseer CV${portfolio?.on ? ' + portfolio' : ''} vs. vacature.\n\nCV:\n${cvStr}${pStr}\n\nVACATURE:\n${vacatuurStr}\n\nGEEF ALLEEN JSON:\n{"score":<1-10>,"scoreLabel":"<label>"${portfolio?.on ? ',"portfolioAdvies":"<1 zin>"' : ''},"samenvatting":"<2-3 zinnen>","keywords":[{"term":"<kw>","aanwezig":<bool>}],"topAanbevelingen":["<punt>"]}\n6-10 keywords, 3-5 aanbevelingen.`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const result = JSON.parse(stripMarkdown(response.content[0].text));
      context.log('Analyze-cv succesvol — score:', result.score);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };

    } catch (error) {
      context.log('Fout bij analyze-cv:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij analyse', details: error.message })
      };
    }
  }
});
