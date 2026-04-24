import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const cache = new Map<string, string>();

// Map: environment variable name → GCP Secret Manager secret name
const SECRET_MAP: Record<string, string> = {
  ANTHROPIC_API_KEY:         'anthropic-api-key',
  OPENAI_API_KEY:            'openai-api-key',
  GEMINI_API_KEY:            'gemini-api-key',
  NEXT_PUBLIC_SUPABASE_URL:  'supabase-url',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'supabase-key',
  JWT_SECRET:                'jwt-secret',
  TURSO_DATABASE_URL:        'turso-database-url',
  TURSO_AUTH_TOKEN:          'turso-auth-token',
};

let resolvedProjectId: string | null | undefined; // undefined = not yet fetched

async function resolveProjectId(): Promise<string | null> {
  if (resolvedProjectId !== undefined) return resolvedProjectId;

  if (process.env.GOOGLE_CLOUD_PROJECT) {
    resolvedProjectId = process.env.GOOGLE_CLOUD_PROJECT;
    return resolvedProjectId;
  }

  try {
    const res = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/project/project-id',
      {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: AbortSignal.timeout(1500),
      }
    );
    if (res.ok) {
      resolvedProjectId = (await res.text()).trim();
      return resolvedProjectId;
    }
  } catch {
    // Not running on GCP — fall through
  }

  resolvedProjectId = null;
  return null;
}

export async function getSecret(envVarName: string): Promise<string | undefined> {
  // Env var always wins (supports local .env.local overrides)
  const envValue = process.env[envVarName];
  if (envValue) return envValue;

  if (cache.has(envVarName)) return cache.get(envVarName);

  const secretName = SECRET_MAP[envVarName];
  if (!secretName) return undefined;

  const projectId = await resolveProjectId();
  if (!projectId) return undefined;

  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    const value = version.payload?.data?.toString();
    if (value) {
      cache.set(envVarName, value);
    }
    return value ?? undefined;
  } catch (err) {
    console.warn(`[secrets] Could not load "${secretName}" from Secret Manager:`, err);
    return undefined;
  }
}

export async function loadAllSecrets(): Promise<void> {
  const projectId = await resolveProjectId();
  if (!projectId) {
    console.log('[secrets] Not on GCP or GOOGLE_CLOUD_PROJECT not set — using env vars only');
    return;
  }

  console.log(`[secrets] Loading secrets from GCP project: ${projectId}`);

  await Promise.all(
    Object.keys(SECRET_MAP).map(async (envVarName) => {
      if (process.env[envVarName]) return; // already set, skip
      const value = await getSecret(envVarName);
      if (value) {
        process.env[envVarName] = value;
        console.log(`[secrets] Loaded ${envVarName}`);
      }
    })
  );
}
