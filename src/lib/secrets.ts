import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const cachedSecrets: Record<string, string> = {};

const SECRET_ENV_MAP: Record<string, string[]> = {
  'anthropic-api-key': ['ANTHROPIC_API_KEY'],
  'openai-api-key': ['OPENAI_API_KEY'],
  'gemini-api-key': ['GEMINI_API_KEY'],
  'supabase-url': ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
  'supabase-key': ['SUPABASE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  'jwt-secret': ['JWT_SECRET'],
};

export async function getSecret(secretName: string): Promise<string> {
  if (cachedSecrets[secretName]) {
    return cachedSecrets[secretName];
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    return '';
  }

  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const secret = version.payload?.data?.toString() ?? '';
    cachedSecrets[secretName] = secret;
    return secret;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch secret ${secretName}:`, msg);
    throw error;
  }
}

export async function loadAllSecrets(): Promise<void> {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    console.log('[secrets] GCP_PROJECT_ID not set — using env vars only');
    return;
  }

  console.log(`[secrets] Loading secrets from GCP project: ${projectId}`);

  for (const secretName of Object.keys(SECRET_ENV_MAP)) {
    try {
      const value = await getSecret(secretName);
      if (!value) {
        continue;
      }
      for (const envVar of SECRET_ENV_MAP[secretName]) {
        if (!process.env[envVar]) {
          process.env[envVar] = value;
        }
      }
      console.log(`[secrets] Loaded ${secretName}`);
    } catch {
      console.warn(`[secrets] Skipping ${secretName} — not found or access denied`);
    }
  }
}
