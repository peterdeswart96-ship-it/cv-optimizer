const { app } = require('@azure/functions');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { valideerToken } = require('../../auth');

const MAX_BESTAND_BYTES = 10 * 1024 * 1024; // 10 MB maximum bestandsgrootte

app.http('upload', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
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
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Niet geautoriseerd', details: err.message })
      };
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
      const formData = await request.formData();
      const bestand = formData.get('bestand');

      if (!bestand) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Geen bestand ontvangen' }) };
      }

      const bestandsnaam = bestand.name.toLowerCase();
      const buffer = Buffer.from(await bestand.arrayBuffer());

      // Bestandsgrootte check
      if (buffer.length > MAX_BESTAND_BYTES) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Bestand is te groot. Maximum is ${MAX_BESTAND_BYTES / 1024 / 1024} MB.` })
        };
      }

      // Bestandstype validatie
      const toegestaneTypes = ['.pdf', '.docx'];
      const isGeldigeExtensie = toegestaneTypes.some(ext => bestandsnaam.endsWith(ext));
      if (!isGeldigeExtensie) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Alleen .pdf en .docx bestanden zijn toegestaan' }) };
      }

      context.log('Bestand ontvangen — grootte:', buffer.length, 'bytes, type:', bestandsnaam.split('.').pop());

      let tekst = '';
      let html = null;      // Alleen gevuld bij DOCX — bewaart originele opmaak
      let bestandType = ''; // 'pdf' of 'docx'

      if (bestandsnaam.endsWith('.pdf')) {
        // PDF: alleen platte tekst mogelijk
        const data = await pdfParse(buffer);
        tekst = data.text;
        bestandType = 'pdf';
        context.log('PDF geparsed — paginas:', data.numpages);

      } else if (bestandsnaam.endsWith('.docx')) {
        // DOCX: haal ZOWEL platte tekst als HTML op
        // HTML bewaart de originele structuur (headings, bold, bullets)
        const [tekstResult, htmlResult] = await Promise.all([
          mammoth.extractRawText({ buffer }),
          mammoth.convertToHtml({ buffer }, {
            // Mammoth opties: zet standaard Word styles om naar semantische HTML
            styleMap: [
              "p[style-name='Heading 1'] => h2:fresh",
              "p[style-name='Heading 2'] => h3:fresh",
              "p[style-name='Heading 3'] => h4:fresh",
              "b => strong",
              "i => em"
            ]
          })
        ]);

        tekst = tekstResult.value;
        html  = htmlResult.value;
        bestandType = 'docx';
        context.log('DOCX geparsed — tekst:', tekst.length, 'tekens, html:', html.length, 'tekens');

        // Log eventuele mammoth waarschuwingen (bijv. niet-ondersteunde styles)
        if (htmlResult.messages && htmlResult.messages.length > 0) {
          context.log('Mammoth waarschuwingen:', htmlResult.messages.length);
        }
      }

      // Normaliseer witregels in platte tekst
      tekst = tekst.replace(/\n{3,}/g, '\n\n').trim();

      if (tekst.length < 50) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Kon geen tekst uit het bestand halen' }) };
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          tekst,
          html,            // null bij PDF, gevuld HTML string bij DOCX
          bestand_type: bestandType,
          tekst_lengte: tekst.length
        })
      };

    } catch (error) {
      context.log('Fout bij uploaden:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij verwerken bestand' })
      };
    }
  }
});
