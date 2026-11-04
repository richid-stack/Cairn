import type { components } from './generated/api.js';

type AuthProvider = components['schemas']['AuthProvider'];
type ModelProvider = components['schemas']['ModelProvider'];

/**
 * Sign-in methods Cairn can offer. An instance enables a subset.
 * `brandIcon` keys the official logo in the brand icon set (see docs/brand-icons.md).
 */
export const authProviderCatalog: AuthProvider[] = [
  { id: 'google', name: 'Google', kind: 'oidc', brandIcon: 'google' },
  { id: 'microsoft', name: 'Microsoft', kind: 'oidc', brandIcon: 'microsoft' },
  { id: 'github', name: 'GitHub', kind: 'oauth', brandIcon: 'github' },
  { id: 'apple', name: 'Apple', kind: 'oauth', brandIcon: 'apple' },
  { id: 'email', name: 'Email', kind: 'email' },
  { id: 'passkey', name: 'Passkey', kind: 'passkey' },
  { id: 'sso', name: 'Single sign-on', kind: 'saml' },
];

/**
 * Model providers a user can connect with their own key (bring your own key).
 * A first set; the catalog grows over time and capabilities are filled in per model later.
 */
export const modelProviderCatalog: ModelProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'hosted',
    requiresKey: true,
    brandIcon: 'anthropic',
    capabilities: ['text', 'tools', 'vision'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'hosted',
    requiresKey: true,
    brandIcon: 'openai',
    capabilities: ['text', 'tools', 'vision', 'audio', 'embeddings'],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    kind: 'hosted',
    requiresKey: true,
    brandIcon: 'google',
    capabilities: ['text', 'tools', 'vision', 'audio', 'embeddings'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    kind: 'hosted',
    requiresKey: true,
    brandIcon: 'mistral',
    capabilities: ['text', 'tools', 'embeddings'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'gateway',
    requiresKey: true,
    brandIcon: 'openrouter',
    capabilities: ['text', 'tools'],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    kind: 'local',
    requiresKey: false,
    allowsCustomBaseUrl: true,
    brandIcon: 'ollama',
    capabilities: ['text', 'tools'],
  },
];
