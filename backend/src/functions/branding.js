const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { valideerToken } = require('../../auth');

// Gebruik Managed Identity indien beschikbaar, anders connection string als fallback
// Zodra Managed Identity is geconfigureerd: verwijder AZURE_STORAGE_CONNECTION_STRING
// en gebruik: new BlobServiceClient(`https://${storageAccount}.blob.core.windows.net`, new DefaultAzureCredential())
const STORAGE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = 'branding';

// Extension attribute naam zoals geregistreerd in Entra External ID
const COMPANY_ID_CLAIM = 'extension_6248a5e084184d4796919f8b07dc5723_companyId';

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

    // ── Token validatie ──────────────────────────────────────────────────────
    let gebruiker;
    try {
      gebruiker = await valideerToken(request);
      context.log('Branding aangevraagd door:', gebruiker.preferred_username ?? gebruiker.sub);
    } catch (err) {
      context.log('Token validatie mislukt bij branding:', err.message);
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Niet geautoriseerd', details: err.message })
      };
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
      // companyId ALTIJD uit het JWT-token — NOOIT uit query parameters
      // Dit voorkomt dat een gebruiker de branding van een andere organisatie kan opvragen
      const companyId = gebruiker[COMPANY_ID_CLAIM] || gebruiker['extn.companyId'] || 'default';
      const bestandsnaam = `${companyId}.json`;

      context.log('Branding ophalen voor companyId:', companyId);

      const containerClient = BlobServiceClient
        .fromConnectionString(STORAGE_CONNECTION)
        .getContainerClient(CONTAINER);

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
