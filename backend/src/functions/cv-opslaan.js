const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const { valideerToken } = require('../../auth');

const STORAGE_URL = 'https://stcvoptimizer.blob.core.windows.net';
const CONTAINER = 'cv-optimizer-users';
const MAX_CVS_PER_GEBRUIKER = 5;

function getBlobServiceClient() {
  return new BlobServiceClient(STORAGE_URL, new DefaultAzureCredential());
}

app.http('cv-opslaan', {
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
    let gebruiker;
    try {
      gebruiker = await valideerToken(request);
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
      const body = await request.json();
      const { cv_tekst, cv_naam, gebruiker_id } = body;

      if (!cv_tekst || !cv_naam || !gebruiker_id) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'cv_tekst, cv_naam en gebruiker_id zijn verplicht' })
        };
      }

      // Verificeer dat gebruiker_id overeenkomt met het token
      // Voorkomt dat gebruiker A data opslaat onder gebruiker_id van B
      const tokenGebruikerId = gebruiker.oid || gebruiker.sub;
      if (gebruiker_id !== tokenGebruikerId) {
        context.log('gebruiker_id mismatch:', gebruiker_id, '!=', tokenGebruikerId);
        return {
          status: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Geen toegang' })
        };
      }

      const containerClient = getBlobServiceClient().getContainerClient(CONTAINER);
      await containerClient.createIfNotExists();

      // Huidige CV's ophalen om limiet te checken
      const prefix = `${gebruiker_id}/cvs/`;
      const bestaande = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        bestaande.push(blob.name);
      }

      if (bestaande.length >= MAX_CVS_PER_GEBRUIKER) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: `Maximum van ${MAX_CVS_PER_GEBRUIKER} CV's bereikt. Verwijder eerst een CV.`
          })
        };
      }

      // CV opslaan
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blobNaam = `${gebruiker_id}/cvs/${timestamp}_${cv_naam.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`;
      const blobClient = containerClient.getBlockBlobClient(blobNaam);

      const cvData = JSON.stringify({
        naam: cv_naam,
        tekst: cv_tekst,
        opgeslagen_op: new Date().toISOString(),
        tekst_lengte: cv_tekst.length
      });

      await blobClient.upload(cvData, cvData.length, {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      });

      context.log('CV opgeslagen voor gebruiker:', tokenGebruikerId);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, blob_naam: blobNaam })
      };

    } catch (error) {
      context.log('Fout bij opslaan CV:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij opslaan CV' })
      };
    }
  }
});
