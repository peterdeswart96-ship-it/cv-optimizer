const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const STORAGE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'cv-optimizer-users';

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

    const gebruiker_id = request.query.get('gebruiker_id');

    if (!gebruiker_id) {
      return {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'gebruiker_id is verplicht' })
      };
    }

    const containerClient = BlobServiceClient
      .fromConnectionString(STORAGE_CONNECTION)
      .getContainerClient(CONTAINER);

    // CV verwijderen
    if (request.method === 'DELETE') {
      try {
        const blob_naam = request.query.get('blob_naam');
        if (!blob_naam || !blob_naam.startsWith(gebruiker_id)) {
          return {
            status: 403,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Geen toegang tot dit CV' })
          };
        }
        await containerClient.getBlockBlobClient(blob_naam).delete();
        context.log('CV verwijderd:', blob_naam);
        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true })
        };
      } catch (error) {
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Fout bij verwijderen CV', details: error.message })
        };
      }
    }

    // CV lijst ophalen (GET)
    try {
      const prefix = `${gebruiker_id}/cvs/`;
      const cvs = [];

      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        // CV data ophalen
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

      // Sorteren op datum (nieuwste eerst)
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
        body: JSON.stringify({ error: 'Fout bij ophalen CV lijst', details: error.message })
      };
    }
  }
});
