const { app } = require('@azure/functions');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

app.http('upload', {
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

    try {
      const formData = await request.formData();
      const bestand = formData.get('bestand');

      if (!bestand) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Geen bestand ontvangen' }) };
      }

      const bestandsnaam = bestand.name.toLowerCase();
      const buffer = Buffer.from(await bestand.arrayBuffer());

      context.log('Bestand ontvangen:', bestandsnaam, '— grootte:', buffer.length, 'bytes');

      let tekst = '';

      if (bestandsnaam.endsWith('.pdf')) {
        const data = await pdfParse(buffer);
        tekst = data.text;
        context.log('PDF geparsed — paginas:', data.numpages);
      } else if (bestandsnaam.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        tekst = result.value;
        context.log('DOCX geparsed — tekst lengte:', tekst.length);
      } else {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Alleen .pdf en .docx bestanden zijn toegestaan' }) };
      }

      tekst = tekst.replace(/\n{3,}/g, '\n\n').trim();

      if (tekst.length < 50) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Kon geen tekst uit het bestand halen' }) };
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ tekst, bestandsnaam: bestand.name, tekst_lengte: tekst.length })
      };

    } catch (error) {
      context.log('Fout bij uploaden:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij verwerken bestand', details: error.message })
      };
    }
  }
});
