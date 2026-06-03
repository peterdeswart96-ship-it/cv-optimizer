const { app } = require('@azure/functions');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

app.http('export', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

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

      const children = [];

      for (const sectie of secties) {
        children.push(new Paragraph({
          text: sectie.naam,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }));

        const regels = (sectie.definitieve_tekst || sectie.originele_tekst).split('\n');
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
        body: JSON.stringify({ error: 'Fout bij genereren DOCX', details: error.message })
      };
    }
  }
});
