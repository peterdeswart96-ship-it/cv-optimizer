const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const { valideerToken } = require('../../auth');

const STORAGE_URL = 'https://stcvoptimizer.blob.core.windows.net';
const CONTAINER = 'cv-optimizer-users';

function getBlobServiceClient() {
  return new BlobServiceClient(STORAGE_URL, new DefaultAzureCredential());
}

app.http('cv-lijst', {
  methods: ['GET', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
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

    // gebruiker_id altijd uit token — niet uit query parameter
    const gebruiker_id = gebruiker.oid || gebruiker.sub;

    const containerClient = getBlobServiceClient().getContainerClient(CONTAINER);

    // CV verwijderen
    if (request.method === 'DELETE') {
      try {
        const blob_naam = request.query.get('blob_naam');

        // Verificeer dat het blob-pad begint met de gebruikers eigen ID
        if (!blob_naam || !blob_naam.startsWith(gebruiker_id)) {
          return {
            status: 403,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Geen toegang tot dit CV' })
          };
        }

        await containerClient.getBlockBlobClient(blob_naam).delete();
        context.log('CV verwijderd voor gebruiker:', gebruiker_id);

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true })
        };
      } catch (error) {
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Fout bij verwijderen CV' })
        };
      }
    }

    // CV lijst ophalen (GET)
    try {
      const prefix = `${gebruiker_id}/cvs/`;
      const cvs = [];

      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const download = await blobClient.download();
        const chunks = [];
        for await (const chunk of download.readableStreamBody) {
          chunks.push(chunk);
        }
        const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

        cvs.push({
          blob_naam: blob.name,
          naam: data.naam,
          opgeslagen_op: data.opgeslagen_op,
          tekst_lengte: data.tekst_lengte,
          tekst: data.tekst
        });
      }

      cvs.sort((a, b) => new Date(b.opgeslagen_op) - new Date(a.opgeslagen_op));

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(cvs)
      };

    } catch (error) {
      context.log('Fout bij ophalen CV lijst:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Fout bij ophalen CV lijst' })
      };
    }
  }
});
