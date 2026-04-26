export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./config/env');
    validateEnv();
    const { loadAllSecrets } = await import('./lib/secrets');
    await loadAllSecrets();
  }
}
