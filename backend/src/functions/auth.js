const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const TENANT_ID = '5399f876-4a61-48dc-b623-5dde6806ce3c';

const client = jwksClient({
  jwksUri: `https://${TENANT_ID}.ciamlogin.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: false
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function valideerToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Geen Authorization header aanwezig');
  }
  const token = authHeader.substring(7);
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) reject(new Error(`Token ongeldig: ${err.message}`));
      else resolve(decoded);
    });
  });
}

module.exports = { valideerToken };
