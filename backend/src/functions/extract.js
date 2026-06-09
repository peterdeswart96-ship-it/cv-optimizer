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

app.http('extract', {
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
      const { cv_tekst, cv_base64, mime_type } = body;

      if (!cv_tekst && !cv_base64) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'cv_tekst of cv_base64 is verplicht' })
        };
      }

      context.log('Extract gestart');

      let messages;
      if (cv_base64) {
        // Base64 PDF verwerking via Claude vision
        messages = [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mime_type || 'application/pdf', data: cv_base64 }
            },
            {
              type: 'text',
              text: 'Lees dit CV uit. Identificeer alle secties en extraheer de inhoud per sectie.\nGeef ALLEEN geldige JSON terug:\n{"naam":"<volledige naam>","secties":[{"naam":"<sectienaam>","inhoud":"<volledige inhoud van die sectie als platte tekst>"}]}'
            }
          ]
        }];
      } else {
        // Lengtebegrenzing als extra bescherming (AVG: minimale verwerking)
        const veiligeTekst = cv_tekst.substring(0, 8000);
        messages = [{
          role: 'user',
          content: `Lees deze CV-tekst uit. Identificeer alle secties en extraheer de inhoud per sectie.\nGeef ALLEEN geldige JSON terug:\n{"naam":"<naam of Onbekend>","secties":[{"naam":"<sectienaam>","inhoud":"<volledige inhoud>"}]}\n\nCV:\n${veiligeTekst}`
        }];
      }

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages
      });

      const result = JSON.parse(stripMarkdown(response.content[0].text));
      context.log('Extract succesvol — secties:', result.secties?.length);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };

    } catch (error) {
      context.log('Fout bij extract:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij uitlezen CV', details: error.message })
      };
    }
  }
});
