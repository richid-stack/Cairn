import { expect, test } from '@playwright/test';
import { axeViolations, resetMock, seedThreads } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetMock(request);
});

test('the home address opens the chat screen', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/chat$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'What can I help with?' }),
  ).toBeVisible();
  await expect(page).toHaveTitle('New chat · Cairn');
});

test('an empty account says so in the conversation list', async ({ page, isMobile }) => {
  await page.goto('/chat');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Conversations' })
      .getByText('No conversations yet. Start one and it will appear here.'),
  ).toBeVisible();
});

test('lists conversations, opens one, and shows where you are', async ({
  page,
  request,
  isMobile,
}) => {
  await seedThreads(request, [
    { title: 'Plan my week', message: 'Plan my week around the dentist on Thursday.' },
    { title: 'Book a haircut' },
  ]);
  await page.goto('/chat');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  const links = page.getByRole('navigation', { name: 'Conversations' }).getByRole('link');
  await expect(links).toHaveText(['Book a haircut', 'Plan my week']);

  await links.filter({ hasText: 'Plan my week' }).click();
  await expect(page).toHaveURL(/\/chat\/thr_1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Plan my week' })).toBeVisible();
  await expect(page.getByText('Plan my week around the dentist on Thursday.')).toBeVisible();
  await expect(page).toHaveTitle('Plan my week · Cairn');
  // Focus moves to the page content, so keyboard and screen reader users know it changed.
  await expect(page.locator('#main')).toBeFocused();
  if (!isMobile) {
    await expect(page.locator('[aria-current="page"]')).toHaveText('Plan my week');
  }
});

test('a conversation opens straight from its address', async ({ page, request }) => {
  await seedThreads(request, [
    { title: 'Compare phone plans', message: 'Which plan is cheapest?' },
  ]);
  await page.goto('/chat/thr_1');
  await expect(page.getByRole('heading', { level: 1, name: 'Compare phone plans' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Messages' }).getByRole('listitem')).toHaveCount(2);
});

test('a conversation that does not exist says so kindly', async ({ page }) => {
  await page.goto('/chat/thr_nope');
  await expect(
    page.getByRole('heading', { level: 1, name: 'That conversation is not here' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Start a new chat' }).click();
  await expect(page).toHaveURL(/\/chat$/);
});

test('a failed load explains itself and recovers on Try again', async ({
  page,
  request,
  isMobile,
}) => {
  await seedThreads(request, [{ title: 'Plan my week' }]);
  let broken = true;
  await page.route('**/v1/threads?*', (route) =>
    broken
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'unavailable',
              message: 'Cairn is busy right now.',
              fix: 'Try again in a minute.',
              requestId: 'req_test',
            },
          }),
        })
      : route.continue(),
  );
  await page.goto('/chat');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  const alert = page.getByRole('alert').filter({ hasText: 'Cairn is busy right now.' });
  await expect(alert).toBeVisible({ timeout: 15_000 });
  await expect(alert).toContainText('Try again in a minute.');
  broken = false;
  await alert.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('link', { name: 'Plan my week' })).toBeVisible();
});

test('the skip link is the first stop and jumps to the content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard behavior is checked on the desktop project.');
  await page.goto('/chat');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('a conversation can be reached and opened with the keyboard alone', async ({
  page,
  request,
  isMobile,
}) => {
  test.skip(isMobile, 'Keyboard behavior is checked on the desktop project.');
  await seedThreads(request, [{ title: 'Plan my week' }]);
  await page.goto('/chat');
  await expect(page.getByRole('link', { name: 'Plan my week' })).toBeVisible();
  // Skip link, logo, New chat, then the conversation.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Plan my week' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/chat\/thr_1$/);
});

test('on a phone the sidebar is a drawer that opens, closes and returns focus', async ({
  page,
  request,
  isMobile,
}) => {
  test.skip(!isMobile, 'Phone layout only.');
  await seedThreads(request, [{ title: 'Plan my week' }]);
  await page.goto('/chat');
  const menu = page.getByRole('button', { name: 'Open menu' });
  await expect(page.locator('.shell-sidebar')).toBeHidden();
  await menu.click();
  const drawer = page.getByRole('dialog', { name: 'Menu' });
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();

  await menu.click();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(drawer).toBeHidden();

  await menu.click();
  await drawer.getByRole('link', { name: 'Plan my week' }).click();
  await expect(page).toHaveURL(/\/chat\/thr_1$/);
  await expect(drawer).toBeHidden();
});

test('on a desktop there is no menu button', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout only.');
  await page.goto('/chat');
  await expect(page.locator('.shell-sidebar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
});

test('the page has no horizontal scroll', async ({ page, request }) => {
  await seedThreads(request, [
    {
      title:
        'A conversation with a very long name that must not push the page wider than the screen',
    },
  ]);
  await page.goto('/chat/thr_1');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

for (const theme of ['light', 'dark', 'high-contrast']) {
  test(`has no accessibility violations in the ${theme} theme`, async ({
    page,
    request,
    isMobile,
  }) => {
    await seedThreads(request, [
      { title: 'Plan my week', message: 'Plan my week around the dentist on Thursday.' },
    ]);
    await page.addInitScript((t) => localStorage.setItem('cairn-theme', t), theme);
    await page.goto('/chat/thr_1');
    await expect(page.getByRole('heading', { level: 1, name: 'Plan my week' })).toBeVisible();
    expect(await axeViolations(page), 'conversation screen').toEqual([]);
    await page.goto('/chat');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await axeViolations(page), 'new chat screen').toEqual([]);
    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
      expect(await axeViolations(page), 'phone drawer').toEqual([]);
    }
  });
}
