import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export const MOCK = 'http://127.0.0.1:4010';

export async function resetMock(request: APIRequestContext) {
  const response = await request.post(`${MOCK}/__test/reset`);
  expect(response.status()).toBe(204);
}

/** Creates conversations through the API, oldest first, each with one user message if given. */
export async function seedThreads(
  request: APIRequestContext,
  threads: { title: string; message?: string }[],
) {
  const ids: string[] = [];
  for (const [i, t] of threads.entries()) {
    const created = await request.post(`${MOCK}/v1/threads`, {
      data: { title: t.title },
      headers: { 'idempotency-key': `seed-thread-${i}` },
    });
    const id = ((await created.json()) as { id: string }).id;
    ids.push(id);
    if (t.message) {
      await request.post(`${MOCK}/v1/threads/${id}/messages`, {
        data: { text: t.message },
        headers: { 'idempotency-key': `seed-message-${i}` },
      });
    }
  }
  return ids;
}

// Tests run from apps/web, so resolve packages from there (this file may load as CommonJS).
const require = createRequire(`${process.cwd()}/`);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

/** Accessibility violations in the page as it is now, color contrast included. */
export async function axeViolations(page: Page): Promise<string[]> {
  // Contrast depends on the final fonts and colors, so wait for them before measuring.
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(axeSource);
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            c: Document,
            o: object,
          ) => Promise<{
            violations: { id: string; help: string; nodes: { target: unknown[] }[] }[];
          }>;
        };
      }
    ).axe;
    const result = await axe.run(document, {});
    return result.violations.map(
      (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => String(n.target)).join(' | ')})`,
    );
  });
}
