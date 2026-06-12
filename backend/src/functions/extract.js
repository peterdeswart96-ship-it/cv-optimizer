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
    context.log('=== EXTRACT START ===');

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
      // ── Request body parsen ────────────────────────────────────────────────
      let body;
      try {
        body = await request.json();
        context.log('Request body ontvangen — keys:', Object.keys(body).join(', '));
      } catch (parseErr) {
        context.log('FOUT: Request body kon niet worden geparsed:', parseErr.message);
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Ongeldige request body', details: parseErr.message })
        };
      }

      const { cv_tekst, cv_base64, mime_type } = body;

      if (!cv_tekst && !cv_base64) {
        context.log('FOUT: Geen cv_tekst of cv_base64 in request');
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'cv_tekst of cv_base64 is verplicht' })
        };
      }

      // ── Claude API aanroepen ───────────────────────────────────────────────
      let messages;

      if (cv_base64) {
        context.log('Modus: base64 PDF — mime_type:', mime_type || 'application/pdf');
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
        const veiligeTekst = cv_tekst.substring(0, 8000);
        context.log('Modus: tekst — lengte:', cv_tekst.length, 'tekens — afgekapt op:', veiligeTekst.length);
        messages = [{
          role: 'user',
          content: `Lees deze CV-tekst uit. Identificeer alle secties en extraheer de inhoud per sectie.\nGeef ALLEEN geldige JSON terug:\n{"naam":"<naam of Onbekend>","secties":[{"naam":"<sectienaam>","inhoud":"<volledige inhoud>"}]}\n\nCV:\n${veiligeTekst}`
        }];
      }

      context.log('Claude API aanroepen — model: claude-haiku-4-5-20251001');

      let response;
      try {
        response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages
        });
        context.log('Claude API response ontvangen — stop_reason:', response.stop_reason);
        context.log('Claude API response — tokens gebruikt:', response.usage?.input_tokens, 'in /', response.usage?.output_tokens, 'out');
      } catch (apiErr) {
        context.log('FOUT bij Claude API aanroep:', apiErr.message);
        context.log('API fout details:', JSON.stringify(apiErr));
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Fout bij Claude API aanroep', details: apiErr.message })
        };
      }

      // ── Response verwerken ─────────────────────────────────────────────────
      if (!response.content || response.content.length === 0) {
        context.log('FOUT: Claude gaf lege response terug');
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Claude gaf een lege response terug' })
        };
      }

      const rawText = response.content[0].text;
      context.log('Raw response lengte:', rawText.length, 'tekens');
      context.log('Raw response (eerste 500 tekens):', rawText.substring(0, 500));

      const cleanText = stripMarkdown(rawText);
      context.log('Clean text (eerste 200 tekens):', cleanText.substring(0, 200));

      let result;
      try {
        result = JSON.parse(cleanText);
        context.log('JSON parse geslaagd — naam:', result.naam, '— secties:', result.secties?.length);
      } catch (jsonErr) {
        context.log('FOUT: JSON parse mislukt:', jsonErr.message);
        context.log('Volledige raw response:', rawText);
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Claude gaf geen geldige JSON terug',
            details: jsonErr.message,
            raw: rawText.substring(0, 500)
          })
        };
      }

      // ── Validatie van de response structuur ────────────────────────────────
      if (!result.secties || !Array.isArray(result.secties)) {
        context.log('FOUT: Geen secties array in response — keys:', Object.keys(result).join(', '));
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Onverwachte response structuur van Claude', details: JSON.stringify(result).substring(0, 200) })
        };
      }

      // ── Secties omzetten naar het verwachte formaat ────────────────────────
      // extract geeft { naam, inhoud } terug maar analyze geeft { naam, originele_tekst }
      // We normaliseren hier zodat de frontend altijd originele_tekst kan gebruiken
      const genormaliseerdeSecties = result.secties.map(s => ({
        naam: s.naam,
        originele_tekst: s.inhoud || s.originele_tekst || '',
        volgorde: s.volgorde || 0
      }));

      context.log('Extract succesvol — naam:', result.naam, '— secties:', genormaliseerdeSecties.length);
      context.log('Sectienamen:', genormaliseerdeSecties.map(s => s.naam).join(', '));
      context.log('=== EXTRACT EINDE ===');

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          naam: result.naam,
          secties: genormaliseerdeSecties
        })
      };

    } catch (error) {
      context.log('ONVERWACHTE FOUT bij extract:', error.message);
      context.log('Stack trace:', error.stack);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij uitlezen CV', details: error.message })
      };
    }
  }
});
