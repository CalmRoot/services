const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const region = process.env.AWS_REGION || 'us-east-1';
const client = new SecretsManagerClient({ region });

const secretsCache = new Map();

function getEnvFallbackKey(secretName) {
  const parts = secretName.split('/');
  const lastPart = parts[parts.length - 1];
  return lastPart.replace(/-/g, '_').toUpperCase();
}

async function initializeSecrets(secretNames = ['calmroot/production/jwt-secret']) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Not in production. Skipping Secrets Manager initialization, using env variables.');
    return;
  }

  for (const secretName of secretNames) {
    try {
      console.log(`Fetching secret ${secretName} from Secrets Manager...`);
      const response = await client.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      if (response.SecretString) {
        try {
          const parsed = JSON.parse(response.SecretString);
          secretsCache.set(secretName, parsed);
        } catch {
          secretsCache.set(secretName, response.SecretString);
        }
      } else if (response.SecretBinary) {
        const buff = Buffer.from(response.SecretBinary);
        secretsCache.set(secretName, buff.toString('utf-8'));
      }
      console.log(`Successfully cached secret: ${secretName}`);
    } catch (err) {
      console.error(`Error fetching secret ${secretName} from Secrets Manager:`, err.message);
    }
  }
}

function getSecret(secretName) {
  if (secretsCache.has(secretName)) {
    const val = secretsCache.get(secretName);
    if (val && typeof val === 'object') {
      const fallbackKey = getEnvFallbackKey(secretName);
      if (val[fallbackKey] !== undefined) {
        return val[fallbackKey];
      }
      const keys = Object.keys(val);
      if (keys.length === 1) {
        return val[keys[0]];
      }
      return val;
    }
    return val;
  }

  const envKey = getEnvFallbackKey(secretName);
  const val = process.env[envKey] || process.env[secretName];
  if (val !== undefined) {
    return val;
  }

  return null;
}

module.exports = {
  initializeSecrets,
  getSecret
};
