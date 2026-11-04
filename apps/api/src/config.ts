import { authProviderCatalog, type AuthProvider } from '@cairn/contract';

export interface Config {
  port: number;
  host: string;
  version: string;
  /** Sign-in methods this instance offers. */
  authProviders: AuthProvider[];
}

/**
 * Reads settings from the environment.
 * AUTH_PROVIDERS is a comma-separated list of provider ids, for example `google,microsoft,email`.
 * Unset means every method in the catalog is listed. Listing a method does not configure it:
 * real sign-in arrives in Phase B1.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const wanted = env.AUTH_PROVIDERS?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const authProviders = wanted
    ? authProviderCatalog.filter((provider) => wanted.includes(provider.id))
    : authProviderCatalog;
  const unknown = wanted?.filter((id) => !authProviderCatalog.some((p) => p.id === id)) ?? [];
  if (unknown.length > 0) {
    throw new Error(`AUTH_PROVIDERS names unknown providers: ${unknown.join(', ')}`);
  }
  return {
    port: Number(env.PORT ?? 4000),
    host: env.HOST ?? '127.0.0.1',
    version: env.APP_VERSION ?? '0.0.0',
    authProviders,
  };
}
