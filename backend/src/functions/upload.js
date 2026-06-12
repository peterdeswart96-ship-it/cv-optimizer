const { app } = require('@azure/functions');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { valideerToken } = require('../../auth');

const MAX_BESTAND_BYTES = 10 * 1024 * 1024; // 10 MB maximum bestandsgrootte

// ── HTML → plaintext conversie ───────────────────────────────────────────────
// Converteert mammoth HTML-output naar leesbare platte tekst.
// Bewaart structuur via newlines en bullet-tekens, strips daarna alle HTML-tags.
function htmlNaarTekst(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')          // <br> → newline
    .replace(/<\/p>/gi, '\n')               // einde alinea → newline
    .replace(/<\/h[1-6]>/gi, '\n')          // einde heading → newline
    .replace(/<\/li>/gi, '\n')              // einde lijstitem → newline
    .replace(/<li>/gi, '• ')               // begin lijstitem → bullet
    .replace(/<[^>]+>/g, '')               // strip overige HTML-tags
    .replace(/&amp;/g, '&')               // HTML-entities decoderen
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\n{3,}/g, '\n\n')           // max 2 opeenvolgende newlines
    .trim();
}
// ─────────────────────────────────────────────────────────────────────────────

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

      // Log alleen metadata, nooit bestandsinhoud (AVG: minimale logging)
      context.log('Bestand ontvangen — grootte:', buffer.length, 'bytes, type:', bestandsnaam.split('.').pop());

      let tekst = '';
      let html = null;
      let bestandType = '';

      if (bestandsnaam.endsWith('.pdf')) {
        // PDF: alleen plaintext, geen HTML beschikbaar
        const data = await pdfParse(buffer);
        tekst = data.text;
        bestandType = 'pdf';
        context.log('PDF geparsed — paginas:', data.numpages, '— tekst:', tekst.length, 'tekens');

      } else if (bestandsnaam.endsWith('.docx')) {
        // DOCX: één mammoth-aanroep (convertToHtml) → bewaar structuur
        // Plaintext wordt afgeleid uit de HTML via htmlNaarTekst()
        // Dit is bewust NIET Promise.all — dat crashte eerder de worker
        const result = await mammoth.convertToHtml({ buffer });

        html = result.value;
        tekst = htmlNaarTekst(html);
        bestandType = 'docx';

        if (result.messages && result.messages.length > 0) {
          context.log('Mammoth waarschuwingen:', result.messages.length);
        }
        context.log('DOCX geparsed — HTML:', html.length, 'tekens — tekst:', tekst.length, 'tekens');
      }

      // Normaliseer witregels
      tekst = tekst.replace(/\n{3,}/g, '\n\n').trim();

      if (tekst.length < 50) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Kon geen tekst uit het bestand halen' }) };
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          tekst,
          html,                          // null voor PDF, HTML-string voor DOCX
          bestand_type: bestandType,
          tekst_lengte: tekst.length
        })
      };

    } catch (error) {
      context.log('Fout bij uploaden:', error.message, error.stack);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij verwerken bestand' })
      };
    }
  }
});
