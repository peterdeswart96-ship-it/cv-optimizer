const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function stripMarkdown(text) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

function safeParse(text) {
  const t = stripMarkdown(text);
  try {
    return JSON.parse(t);
  } catch {
    const score = t.match(/"score"\s*:\s*(\d+)/)?.[1] || '-';
    const relevantie = t.match(/"relevantie"\s*:\s*"([^"]+)"/)?.[1] || '';
    const sterkePunten = (t.match(/"sterkePunten"\s*:\s*\[([\s\S]*?)\]/)?.[1] || '').match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || [];
    const verbeterpunten = (t.match(/"verbeterpunten"\s*:\s*\[([\s\S]*?)\]/)?.[1] || '').match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || [];
    const herschreven = t.match(/"herschreven"\s*:\s*"([\s\S]*?)(?:"\s*\}|$)/)?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || null;
    return { score, relevantie, sterkePunten, verbeterpunten, herschreven };
  }
}

app.http('analyze-section', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

    try {
      const body = await request.json();
      const { sectie_naam, sectie_inhoud, vacature_tekst } = body;

      if (!sectie_naam || !sectie_inhoud || !vacature_tekst) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'sectie_naam, sectie_inhoud en vacature_tekst zijn verplicht' })
        };
      }

      context.log('Analyze-section gestart voor:', sectie_naam);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `CV-coach. Analyseer sectie "${sectie_naam}" vs. vacature.\n\nSECTIE:\n${sectie_inhoud}\n\nVACATURE:\n${vacature_tekst.substring(0, 2000)}\n\nGeef ALLEEN geldige JSON:\n{"score":<1-10>,"relevantie":"<1 zin>","sterkePunten":["<punt>"],"verbeterpunten":["<punt>"],"herschreven":"<verbeterde versie, gebruik apostrofs ipv aanhalingstekens in de tekst>"}`
        }]
      });

      const result = safeParse(response.content[0].text);
      context.log('Analyze-section succesvol — score:', result.score);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };

    } catch (error) {
      context.log('Fout bij analyze-section:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij sectie-analyse', details: error.message })
      };
    }
  }
});
