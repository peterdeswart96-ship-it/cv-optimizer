const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const STORAGE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'branding';

app.http('organisaties', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://cv-optimizer.pdscloud.nl',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    try {
      const blobClient = BlobServiceClient
        .fromConnectionString(STORAGE_CONNECTION)
        .getContainerClient(CONTAINER)
        .getBlobClient('_organisaties.json');

      const download = await blobClient.download();
      const tekst = await streamToString(download.readableStreamBody);
      const organisaties = JSON.parse(tekst);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(organisaties)
      };
    } catch (error) {
      context.log('Fout bij ophalen organisaties:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Kon organisatielijst niet ophalen' })
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
