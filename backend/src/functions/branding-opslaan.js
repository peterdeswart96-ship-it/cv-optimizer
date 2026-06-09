const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const { valideerToken } = require('../../auth');

const STORAGE_URL = 'https://stcvoptimizer.blob.core.windows.net';
const CONTAINER = 'branding';
const TOEGESTAAN_ORIGIN = 'https://cv-optimizer.pdscloud.nl';

function getBlobServiceClient() {
  return new BlobServiceClient(STORAGE_URL, new DefaultAzureCredential());
}

app.http('branding-opslaan', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': TOEGESTAAN_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    // ── Token validatie + admin check ────────────────────────────────────────
    const ADMIN_IDS = ['6b736f58-cd68-430f-9acd-f7e07fe2fc4e'];
    try {
      const gebruiker = await valideerToken(request);
      const isAdmin = ADMIN_IDS.includes(gebruiker.oid) || ADMIN_IDS.includes(gebruiker.sub);
      if (!isAdmin) {
        context.log('Ongeautoriseerde branding-opslaan poging door:', gebruiker.sub);
        return {
          status: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Alleen admins mogen branding opslaan' })
        };
      }
      context.log('Branding opslaan door admin:', gebruiker.preferred_username ?? gebruiker.sub);
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
      const companyId = formData.get('companyId');

      if (!companyId) {
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'companyId ontbreekt' }) };
      }

      const container = getBlobServiceClient().getContainerClient(CONTAINER);

      // Lees bestaande branding op als basis
      let bestaandeBranding = {};
      try {
        const bestaandBlob = container.getBlobClient(`${companyId}.json`);
        const download = await bestaandBlob.download();
        const chunks = [];
        for await (const chunk of download.readableStreamBody) chunks.push(chunk);
        bestaandeBranding = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      } catch {
        // Geen bestaande branding — begin met lege config
      }

      // Logo uploaden indien aanwezig
      let logoUrl = bestaandeBranding.logo_url || null;
      const logoBestand = formData.get('logo');
      if (logoBestand && logoBestand.size > 0) {
        const logoBuffer = Buffer.from(await logoBestand.arrayBuffer());
        const logoExtensie = logoBestand.name.split('.').pop().toLowerCase();
        const logoBlobNaam = `${companyId}-logo.${logoExtensie}`;
        const logoBlob = container.getBlockBlobClient(logoBlobNaam);
        const contentType = logoExtensie === 'svg' ? 'image/svg+xml' : 'image/png';
        await logoBlob.upload(logoBuffer, logoBuffer.length, {
          blobHTTPHeaders: { blobContentType: contentType }
        });
        logoUrl = `${STORAGE_URL}/${CONTAINER}/${logoBlobNaam}`;
      }

      // Footer uploaden indien aanwezig
      let footerUrl = bestaandeBranding.footer_url || null;
      const footerBestand = formData.get('footer');
      if (footerBestand && footerBestand.size > 0) {
        const footerBuffer = Buffer.from(await footerBestand.arrayBuffer());
        const footerExtensie = footerBestand.name.split('.').pop().toLowerCase();
        const footerBlobNaam = `${companyId}-footer.${footerExtensie}`;
        const footerBlob = container.getBlockBlobClient(footerBlobNaam);
        await footerBlob.upload(footerBuffer, footerBuffer.length, {
          blobHTTPHeaders: { blobContentType: `image/${footerExtensie}` }
        });
        footerUrl = `${STORAGE_URL}/${CONTAINER}/${footerBlobNaam}`;
      }

      // Nieuwe branding JSON samenstellen
      const nieuweBranding = {
        companyId,
        bedrijfsnaam: formData.get('bedrijfsnaam') || bestaandeBranding.bedrijfsnaam || '',
        welkomsttekst: formData.get('welkomsttekst') || bestaandeBranding.welkomsttekst || '',
        primaire_kleur: formData.get('primaire_kleur') || bestaandeBranding.primaire_kleur || '#2563EB',
        achtergrondkleur: formData.get('achtergrondkleur') || bestaandeBranding.achtergrondkleur || '#0A0A0A',
        organisatiebalk_kleur: formData.get('organisatiebalk_kleur') || bestaandeBranding.organisatiebalk_kleur || '#FFFFFF',
        logo_url: logoUrl,
        footer_url: footerUrl
      };

      // JSON opslaan
      const jsonInhoud = JSON.stringify(nieuweBranding, null, 2);
      const jsonBlob = container.getBlockBlobClient(`${companyId}.json`);
      await jsonBlob.upload(jsonInhoud, Buffer.byteLength(jsonInhoud), {
        blobHTTPHeaders: { blobContentType: 'application/json' },
        conditions: {}
      });

      context.log(`Branding opgeslagen voor: ${companyId}`);
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      };

    } catch (error) {
      context.log('Fout bij opslaan branding:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Kon branding niet opslaan', details: error.message })
      };
    }
  }
});
