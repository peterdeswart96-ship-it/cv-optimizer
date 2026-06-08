const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const TENANT_ID = '5399f876-4a61-48dc-b623-5dde6806ce3c';
const CLIENT_ID = '6248a5e0-8418-4d47-9691-9f8b07dc5723';

// Entra External ID (CIAM) — tenant-ID gebaseerde JWKS endpoint
// Issuer in token is: https://{tenant_id}.ciamlogin.com/{tenant_id}/v2.0
const clientCiam = jwksClient({
  jwksUri: `https://${TENANT_ID}.ciamlogin.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000
});

// Fallback: naam-gebaseerde CIAM endpoint
const clientCiamNaam = jwksClient({
  jwksUri: `https://cvoptimizer.ciamlogin.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000
});

function getSigningKey(header, callback) {
  clientCiam.getSigningKey(header.kid, (err, key) => {
    if (!err && key) {
      return callback(null, key.getPublicKey());
    }
    clientCiamNaam.getSigningKey(header.kid, (err2, key2) => {
      if (err2) return callback(err2);
      callback(null, key2.getPublicKey());
    });
  });
}

async function valideerToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Geen Authorization header aanwezig');
  }

  const token = authHeader.substring(7);

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256']
        // audience en issuer bewust weggelaten — CIAM gebruikt tenant-ID gebaseerde issuer
      },
      (err, decoded) => {
        if (err) {
          reject(new Error(`Token ongeldig: ${err.message}`));
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

module.exports = { valideerToken };
