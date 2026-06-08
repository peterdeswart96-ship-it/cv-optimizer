const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const STORAGE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'cv-optimizer-users';
const TOEGESTAAN_ORIGIN = 'https://cv-optimizer.pdscloud.nl';

app.http('vacature-lijst', {
  methods: ['GET', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': TOEGESTAAN_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    const gebruikerId = new URL(request.url).searchParams.get('gebruiker_id');
    if (!gebruikerId) {
      return {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'gebruiker_id ontbreekt' })
      };
    }

    const blobService = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION);
    const container = blobService.getContainerClient(CONTAINER);

    // DELETE
    if (request.method === 'DELETE') {
      const blobNaam = new URL(request.url).searchParams.get('blob_naam');
      if (!blobNaam || !blobNaam.startsWith(`${gebruikerId}/vacatures/`)) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Ongeldige blob_naam' })
        };
      }
      try {
        await container.getBlockBlobClient(blobNaam).delete();
        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true })
        };
      } catch (error) {
        context.log('Fout bij verwijderen vacature:', error.message);
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Kon vacature niet verwijderen' })
        };
      }
    }

    // GET
    try {
      const prefix = `${gebruikerId}/vacatures/`;
      const vacatures = [];

      for await (const blob of container.listBlobsFlat({ prefix })) {
        const blobClient = container.getBlobClient(blob.name);
        const download = await blobClient.download();
        const chunks = [];
        for await (const chunk of download.readableStreamBody) chunks.push(chunk);
        const tekst = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(tekst);
        vacatures.push({
          blob_naam: blob.name,
          naam: data.naam,
          tekst: data.tekst,
          opgeslagen_op: data.opgeslagen_op
        });
      }

      vacatures.sort((a, b) => new Date(b.opgeslagen_op) - new Date(a.opgeslagen_op));

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(vacatures)
      };

    } catch (error) {
      context.log('Fout bij ophalen vacatures:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Kon vacaturelijst niet ophalen' })
      };
    }
  }
});
