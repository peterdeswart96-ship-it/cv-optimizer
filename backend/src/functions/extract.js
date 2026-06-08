const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');

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
        messages = [{
          role: 'user',
          content: `Lees deze CV-tekst uit. Identificeer alle secties en extraheer de inhoud per sectie.\nGeef ALLEEN geldige JSON terug:\n{"naam":"<naam of Onbekend>","secties":[{"naam":"<sectienaam>","inhoud":"<volledige inhoud>"}]}\n\nCV:\n${cv_tekst.substring(0, 8000)}`
        }];
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
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
