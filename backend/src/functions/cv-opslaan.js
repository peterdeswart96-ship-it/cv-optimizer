const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const STORAGE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'cv-optimizer-users';
const MAX_CVS_PER_GEBRUIKER = 5;

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

      const containerClient = BlobServiceClient
        .fromConnectionString(STORAGE_CONNECTION)
        .getContainerClient(CONTAINER);

      // Container aanmaken als die niet bestaat
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

      context.log('CV opgeslagen:', blobNaam);

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
        body: JSON.stringify({ error: 'Fout bij opslaan CV', details: error.message })
      };
    }
  }
});
