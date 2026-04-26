const requiredServerVars = [
  'ANTHROPIC_API_KEY',
] as const;

const optionalServerVars = [
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'JWT_SECRET',
  'DATABASE_URL',
] as const;

const requiredClientVars = ['NEXT_PUBLIC_APP_URL'] as const;

export function validateEnv() {
  const missingServer = requiredServerVars.filter((key) => !process.env[key]);
  const missingClient = requiredClientVars.filter((key) => !process.env[key]);

  if (missingServer.length > 0) {
    throw new Error(`Missing required server environment variables: ${missingServer.join(', ')}`);
  }

  if (missingClient.length > 0) {
    throw new Error(`Missing required public environment variables: ${missingClient.join(', ')}`);
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}
