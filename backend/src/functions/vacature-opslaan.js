const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

const STORAGE_URL = 'https://stcvoptimizer.blob.core.windows.net';
const CONTAINER = 'cv-optimizer-users';
const TOEGESTAAN_ORIGIN = 'https://cv-optimizer.pdscloud.nl';
const MAX_VACATURES = 5;

app.http('vacature-opslaan', {
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

    try {
      const body = await request.json();
      const { vacature_tekst, vacature_naam, gebruiker_id } = body;

      if (!vacature_tekst || !vacature_naam || !gebruiker_id) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Verplichte velden ontbreken' })
        };
      }

      const blobService = new BlobServiceClient(STORAGE_URL, new DefaultAzureCredential());
      const container = blobService.getContainerClient(CONTAINER);

      // Controleer bestaand aantal vacatures voor deze gebruiker
      const prefix = `${gebruiker_id}/vacatures/`;
      let aantalBestaand = 0;
      for await (const blob of container.listBlobsFlat({ prefix })) {
        aantalBestaand++;
      }

      if (aantalBestaand >= MAX_VACATURES) {
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Maximum van ${MAX_VACATURES} vacatures bereikt. Verwijder er eerst een.` })
        };
      }

      const tijdstempel = new Date().toISOString().replace(/[:.]/g, '-');
      const veiligNaam = vacature_naam.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim().replace(/\s+/g, '-');
      const blobNaam = `${gebruiker_id}/vacatures/${tijdstempel}_${veiligNaam}.json`;

      const inhoud = JSON.stringify({
        naam: vacature_naam,
        tekst: vacature_tekst,
        opgeslagen_op: new Date().toISOString()
      });

      const blockBlob = container.getBlockBlobClient(blobNaam);
      await blockBlob.upload(inhoud, Buffer.byteLength(inhoud), {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      });

      context.log(`Vacature opgeslagen: ${blobNaam}`);
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, blob_naam: blobNaam })
      };

    } catch (error) {
      context.log('Fout bij opslaan vacature:', error.message);
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Kon vacature niet opslaan' })
      };
    }
  }
});
