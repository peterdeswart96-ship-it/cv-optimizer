const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const TENANT_ID = '5399f876-4a61-48dc-b623-5dde6806ce3c';
const CLIENT_ID = '6248a5e0-8418-4d47-9691-9f8b07dc5723';

// Entra External ID (CIAM) gebruikt een eigen JWKS endpoint
// Let op: NIET login.microsoftonline.com maar ciamlogin.com
const client = jwksClient({
  jwksUri: `https://cvoptimizer.ciamlogin.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000 // 10 minuten
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Valideert het Bearer token uit de Authorization header.
 * Geeft het gedecodeerde token terug als het geldig is.
 * Gooit een Error als het token ontbreekt of ongeldig is.
 */
async function valideerToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Geen Authorization header aanwezig');
  }

  const token = authHeader.substring(7); // "Bearer " weghalen

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience: CLIENT_ID,
        issuer: `https://cvoptimizer.ciamlogin.com/${TENANT_ID}/v2.0`,
        algorithms: ['RS256']
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
