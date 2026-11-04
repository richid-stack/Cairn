/**
 * Analytics event names: `<surface>.<object>.<verb>`, lower snake case, three parts.
 * Every interactive element in the app maps to exactly one name here. A test in the
 * web app (added in frontend Phase 1) fails when an interactive element has none.
 * Events are sent only after the user has given consent.
 */
export const surfaces = [
  'shell',
  'auth',
  'onboarding',
  'chat',
  'approval',
  'agent',
  'activity',
  'tasks',
  'notes',
  'search',
  'connectors',
  'models',
  'wallet',
  'voice',
  'settings',
] as const;

export const verbs = [
  'view',
  'open',
  'close',
  'click',
  'select',
  'toggle',
  'submit',
  'send',
  'approve',
  'deny',
  'undo',
  'copy',
  'dismiss',
] as const;

export type Surface = (typeof surfaces)[number];
export type Verb = (typeof verbs)[number];

export const analyticsEvents = [
  'shell.nav.select',
  'shell.command_palette.open',
  'shell.theme.toggle',
  'auth.provider.click',
  'auth.email_code.submit',
  'auth.passkey.click',
  'onboarding.agent_name.submit',
  'onboarding.consent.submit',
  'chat.composer.send',
  'chat.message.copy',
  'chat.stream.view',
  'approval.card.view',
  'approval.request.approve',
  'approval.request.deny',
  'activity.step.undo',
  'activity.log.open',
  'agent.panel.open',
  'agent.panel.close',
  'connectors.catalog.view',
  'connectors.provider.click',
  'models.key.submit',
  'models.provider.select',
  'settings.section.open',
  'search.query.submit',
] as const;

export type AnalyticsEventName = (typeof analyticsEvents)[number];

const namePattern = /^[a-z]+(?:_[a-z]+)*\.[a-z]+(?:_[a-z]+)*\.[a-z]+$/;

export function isValidEventName(name: string): boolean {
  if (!namePattern.test(name)) return false;
  const [surface, , verb] = name.split('.');
  return (
    (surfaces as readonly string[]).includes(surface ?? '') &&
    (verbs as readonly string[]).includes(verb ?? '')
  );
}
