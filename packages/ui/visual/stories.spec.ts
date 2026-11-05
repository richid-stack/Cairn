import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  type: string;
}

const index = JSON.parse(
  readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
) as { entries: Record<string, StoryEntry> };
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

// Every story in every theme, plus right to left in the light theme.
const settings = [
  { theme: 'light', dir: 'ltr' },
  { theme: 'dark', dir: 'ltr' },
  { theme: 'high-contrast', dir: 'ltr' },
  { theme: 'light', dir: 'rtl' },
] as const;

test.describe('stories', () => {
  test('there are stories to check', () => {
    expect(stories.length).toBeGreaterThanOrEqual(10);
  });

  for (const story of stories) {
    for (const { theme, dir } of settings) {
      test(`${story.title} / ${story.name} [${theme} ${dir}]`, async ({ page }) => {
        await page.goto(
          `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};dir:${dir}`,
        );
        // Wait for the story and its play function to finish, then for fonts and the globals.
        const phaseOf = () =>
          (
            window as unknown as {
              __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
            }
          ).__STORYBOOK_PREVIEW__?.currentRender?.phase;
        await page.waitForFunction(
          (src) => ['finished', 'errored', 'aborted'].includes(new Function(`return (${src})()`)()),
          phaseOf.toString(),
        );
        // A story that throws, or whose play function fails, is a failed test.
        expect(await page.evaluate(phaseOf)).toBe('finished');
        await page.waitForFunction(
          ([t, d]) =>
            document.documentElement.dataset.theme === t &&
            document.documentElement.getAttribute('dir') === d,
          [theme, dir],
        );
        await page.evaluate(() => document.fonts.ready);

        // Accessibility in a real browser, color contrast included (the unit tests cannot check it).
        await page.evaluate(axeSource);
        const violations = await page.evaluate(async () => {
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
          const result = await axe.run(document, {
            // A story is a part of a page, not a page.
            rules: {
              region: { enabled: false },
              'landmark-one-main': { enabled: false },
              'page-has-heading-one': { enabled: false },
            },
          });
          return result.violations.map(
            (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => String(n.target)).join(' | ')})`,
          );
        });
        expect.soft(violations, violations.join('\n')).toEqual([]);

        await expect(page).toHaveScreenshot(`${story.id}--${theme}-${dir}.png`, { fullPage: true });
      });
    }
  }
});
