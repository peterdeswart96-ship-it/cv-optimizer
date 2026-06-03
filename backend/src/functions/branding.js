const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const STORAGE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'branding';

app.http('branding', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    try {
      // companyId uit query parameter (later vervangen door JWT claim na B2C implementatie)
      const companyId = request.query.get('companyId') || 'default';
      const bestandsnaam = `${companyId}.json`;

      const containerClient = BlobServiceClient
        .fromConnectionString(STORAGE_CONNECTION)
        .getContainerClient(CONTAINER);

      // Probeer organisatie-specifieke branding op te halen
      // Bij mislukken: fallback naar default.json
      let branding;
      try {
        const blobClient = containerClient.getBlobClient(bestandsnaam);
        const download = await blobClient.download();
        const tekst = await streamToString(download.readableStreamBody);
        branding = JSON.parse(tekst);
        context.log('Branding geladen voor:', companyId);
      } catch {
        context.log('Geen branding gevonden voor:', companyId, '— fallback naar default');
        const defaultBlob = containerClient.getBlobClient('default.json');
        const download = await defaultBlob.download();
        const tekst = await streamToString(download.readableStreamBody);
        branding = JSON.parse(tekst);
      }

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(branding)
      };
    } catch (error) {
      context.log('Fout bij ophalen branding:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Kon branding niet ophalen' })
      };
    }
  }
});

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
