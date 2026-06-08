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
      const {
        sectie_naam,
        sectie_inhoud,
        vacature_tekst,
        ontbrekende_keywords,
        tone_aanbeveling,
        keyword_context,
        eigen_instructie
      } = body;

      if (!sectie_naam || !sectie_inhoud || !vacature_tekst) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'sectie_naam, sectie_inhoud en vacature_tekst zijn verplicht' })
        };
      }

      context.log('Analyze-section gestart voor:', sectie_naam);

      let prompt;

      // Eigen instructie modus — gebruiker geeft zelf aan wat hij wil
      if (eigen_instructie) {
        prompt = `Je bent een professionele loopbaancoach. De gebruiker wil sectie "${sectie_naam}" aanpassen met de volgende instructie:

<instructie>
${eigen_instructie}
</instructie>

Originele sectietekst:
<sectie>
${sectie_inhoud}
</sectie>

Herschrijf de sectie exact volgens de instructie van de gebruiker.
Behoud de originele feiten — verzin niets bij.
Geef ALLEEN geldige JSON terug:
{"score":"-","relevantie":"Aangepast op basis van eigen instructie","sterkePunten":[],"verbeterpunten":[],"herschreven":"<de herschreven sectietekst>"}`;

      } else {
        // Standaard analyse modus
        const keywordsStr = ontbrekende_keywords?.length
          ? `\nOntbrekende keywords om te verwerken: ${ontbrekende_keywords.join(', ')}`
          : '';
        const toneStr = tone_aanbeveling
          ? `\nTone-of-voice aanbeveling: ${tone_aanbeveling}`
          : '';
        const contextStr = keyword_context
          ? `\nExtra context van de gebruiker:\n${keyword_context}`
          : '';

        prompt = `Je bent een professionele loopbaancoach en recruitment specialist met 15 jaar ervaring.
Analyseer sectie "${sectie_naam}" van dit CV ten opzichte van de vacature.

Sectietekst:
<sectie>
${sectie_inhoud}
</sectie>

Vacature:
<vacature>
${vacature_tekst.substring(0, 2000)}
</vacature>
${keywordsStr}${toneStr}${contextStr}

Geef ALLEEN geldige JSON terug:
{
  "score": <1-10>,
  "relevantie": "<1 zin: hoe relevant is deze sectie voor de vacature>",
  "sterkePunten": ["<punt>", "<punt>"],
  "verbeterpunten": ["<punt>", "<punt>"],
  "herschreven": "<verbeterde versie van de sectie, volledig uitgeschreven, gebruik apostrofs ipv aanhalingstekens in de tekst>"
}`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
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
