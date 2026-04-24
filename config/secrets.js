const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
let cachedSecrets = {};

async function getSecret(secretName) {
  if (cachedSecrets[secretName]) {
    return cachedSecrets[secretName];
  }

  const projectId = process.env.GCP_PROJECT_ID;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const secret = version.payload.data.toString();
    cachedSecrets[secretName] = secret;
    return secret;
  } catch (error) {
    console.error(`Failed to fetch secret ${secretName}:`, error.message);
    throw error;
  }
}

async function loadAllSecrets() {
  const secretNames = [
    'anthropic-api-key',
    'openai-api-key',
    'gemini-api-key',
    'supabase-url',
    'supabase-key',
    'jwt-secret',
  ];

  const loaded = {};
  for (const secretName of secretNames) {
    loaded[secretName] = await getSecret(secretName);
  }
  return loaded;
}

module.exports = { getSecret, loadAllSecrets };
