import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const cache = new Map<string, string>();

// Map: environment variable name → GCP Secret Manager secret name
const SECRET_MAP: Record<string, string> = {
  ANTHROPIC_API_KEY:            'anthropic-api-key',
  OPENAI_API_KEY:               'openai-api-key',
  GEMINI_API_KEY:               'gemini-api-key',
  // Both naming styles for Supabase are supported
  SUPABASE_URL:                 'supabase-url',
  SUPABASE_KEY:                 'supabase-key',
  NEXT_PUBLIC_SUPABASE_URL:     'supabase-url',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'supabase-key',
  JWT_SECRET:                   'jwt-secret',
  TURSO_DATABASE_URL:           'turso-database-url',
  TURSO_AUTH_TOKEN:             'turso-auth-token',
};

let resolvedProjectId: string | null | undefined; // undefined = not yet fetched

async function resolveProjectId(): Promise<string | null> {
  if (resolvedProjectId !== undefined) return resolvedProjectId;

  // Support both GCP_PROJECT_ID and GOOGLE_CLOUD_PROJECT
  const fromEnv = process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (fromEnv) {
    resolvedProjectId = fromEnv;
    return resolvedProjectId;
  }

  // On GCP VMs, fetch from the instance metadata server
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
    console.log('[secrets] Not on GCP or GCP_PROJECT_ID not set — using env vars only');
    return;
  }

  console.log(`[secrets] Loading secrets from GCP project: ${projectId}`);

  // Deduplicate by GCP secret name so we don't fetch the same secret twice
  const seen = new Set<string>();
  await Promise.all(
    Object.entries(SECRET_MAP).map(async ([envVarName, secretName]) => {
      if (process.env[envVarName]) return; // already set
      if (seen.has(secretName)) {
        // Share the cached value to the alias env var
        const cached = cache.get(
          Object.keys(SECRET_MAP).find((k) => SECRET_MAP[k] === secretName && cache.has(k)) ?? ''
        );
        if (cached) process.env[envVarName] = cached;
        return;
      }
      seen.add(secretName);
      const value = await getSecret(envVarName);
      if (value) {
        process.env[envVarName] = value;
        // Also set any aliases pointing to the same secret
        Object.entries(SECRET_MAP)
          .filter(([, sn]) => sn === secretName)
          .forEach(([alias]) => {
            if (!process.env[alias]) process.env[alias] = value;
          });
        console.log(`[secrets] Loaded ${secretName} → ${Object.keys(SECRET_MAP).filter((k) => SECRET_MAP[k] === secretName).join(', ')}`);
      }
    })
  );
}
