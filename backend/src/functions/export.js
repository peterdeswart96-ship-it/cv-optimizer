const { app } = require('@azure/functions');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const { valideerToken } = require('../../auth');

app.http('export', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    // ── Token validatie ──────────────────────────────────────────────────────
    try {
      const gebruiker = await valideerToken(request);
      context.log('Token geldig voor gebruiker:', gebruiker.preferred_username ?? gebruiker.sub);
    } catch (err) {
      context.log('Token validatie mislukt:', err.message);
      return {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Niet geautoriseerd', details: err.message })
      };
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
      const body = await request.json();
      const { secties } = body;

      if (!secties || !Array.isArray(secties)) {
        return {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'secties array is verplicht' })
        };
      }

      // Maximaal 30 secties om misbruik te voorkomen
      if (secties.length > 30) {
        return {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Te veel secties (maximum is 30)' })
        };
      }

      const children = [];

      for (const sectie of secties) {
        children.push(new Paragraph({
          text: sectie.naam,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }));

        const tekst = sectie.definitieve_tekst || sectie.originele_tekst || '';
        const regels = tekst.split('\n');
        for (const regel of regels) {
          if (regel.trim()) {
            children.push(new Paragraph({
              children: [new TextRun({ text: regel.trim(), size: 24 })],
              spacing: { after: 100 }
            }));
          }
        }
      }

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const buffer = await Packer.toBuffer(doc);

      context.log('DOCX gegenereerd — grootte:', buffer.length, 'bytes');

      return {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="cv-aangepast.docx"'
        },
        body: buffer
      };

    } catch (error) {
      context.log('Fout bij export:', error.message);
      return {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Fout bij genereren DOCX' })
      };
    }
  }
});
