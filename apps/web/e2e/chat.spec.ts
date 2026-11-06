import { expect, test, type Page } from '@playwright/test';
import { axeViolations, MOCK, resetMock, seedThreads } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetMock(request);
});

async function write(page: Page, text: string) {
  await page.getByRole('textbox', { name: /^Message/ }).fill(text);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
}

test('the first message creates a conversation, and the reply streams in', async ({
  page,
  isMobile,
}) => {
  await page.goto('/chat');
  await write(page, 'Book a table for two on Friday');
  // Held for a moment, with a way back.
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await expect(page.getByText('Sending…')).toBeVisible();

  await expect(page).toHaveURL(/\/chat\/thr_1$/);
  const messages = page.getByRole('list', { name: 'Messages' });
  await expect(messages.getByText('Book a table for two on Friday')).toBeVisible();
  await expect(
    messages.getByText('Friday evening looks free, so I can book that table for two.'),
  ).toBeVisible();
  // Said once, not twice.
  await expect(messages.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText('What I did (1 step)')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Book a table for two on Friday',
  );
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Conversations' }).getByRole('link'),
  ).toHaveText(['Book a table for two on Friday']);
});

test('Undo takes the message back and leaves no conversation behind', async ({ page, request }) => {
  await page.goto('/chat');
  await write(page, 'Oops, wrong chat');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('textbox', { name: /^Message/ })).toHaveValue('Oops, wrong chat');
  await expect(page.getByRole('textbox', { name: /^Message/ })).toBeFocused();
  // Wait past the window to be sure nothing goes out late.
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/chat$/);
  const list = await request.get(`${MOCK}/v1/threads`);
  expect(((await list.json()) as { items: unknown[] }).items).toHaveLength(0);
});

test('a message sent from inside a conversation is added to it', async ({ page, request }) => {
  await seedThreads(request, [{ title: 'Dinner plans', message: 'Where should we eat?' }]);
  await page.goto('/chat/thr_1');
  await write(page, 'Somewhere quiet please');
  const messages = page.getByRole('list', { name: 'Messages' });
  await expect(messages.getByText('Somewhere quiet please')).toBeVisible();
  await expect(messages.getByText('Friday evening looks free')).toBeVisible();
  // The box is ready again, and empty.
  await expect(page.getByRole('textbox', { name: /^Message/ })).toHaveValue('');
});

test('the agent asks first, and approving lets it finish', async ({ page, request, isMobile }) => {
  await seedThreads(request, [{ title: 'Restaurant' }]);
  await page.goto('/chat/thr_1');
  await write(page, 'Book it /approve-demo');
  const card = page.getByRole('region', { name: /is asking first/ });
  await expect(card).toBeVisible();
  await expect(
    card.getByText('Send the booking request to the restaurant from your email.'),
  ).toBeVisible();
  await expect(card.getByText('Medium risk')).toBeVisible();
  await expect(card).toBeFocused();
  expect(await axeViolations(page)).toEqual([]);
  if (isMobile) {
    await expect(card.getByRole('button', { name: 'Approve' })).toBeInViewport();
  }

  await card.getByRole('button', { name: 'Approve' }).click();
  await expect(
    page.getByText('Done. I sent the request and added it to your activity log.'),
  ).toBeVisible();
  await expect(card).toHaveCount(0);
});

test('declining leaves things as they were', async ({ page, request }) => {
  await seedThreads(request, [{ title: 'Restaurant' }]);
  await page.goto('/chat/thr_1');
  await write(page, 'Book it /approve-demo');
  await page
    .getByRole('region', { name: /is asking first/ })
    .getByRole('button', { name: 'Decline' })
    .click();
  await expect(page.getByText('Okay, I did not send it.')).toBeVisible();
  await expect(page.getByRole('region', { name: /is asking first/ })).toHaveCount(0);
});

test('a dropped connection reconnects and the reply arrives once', async ({ page, request }) => {
  await seedThreads(request, [{ title: 'Flaky' }]);
  await page.goto('/chat/thr_1');
  let dropped = false;
  await page.route('**/v1/threads/*/events', async (route) => {
    if (!dropped) {
      dropped = true;
      await route.abort('connectionreset');
      return;
    }
    await route.continue();
  });
  await write(page, 'Hello?');
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeVisible();
  const reply = page.getByRole('list', { name: 'Messages' }).getByText('Friday evening looks free');
  await expect(reply).toBeVisible();
  await expect(reply).toHaveCount(1);
  await expect(page.getByText('Connection lost. Reconnecting…')).toHaveCount(0);
});

test('a send that fails can be retried without sending twice', async ({ page, request }) => {
  await seedThreads(request, [{ title: 'Retry' }]);
  await page.goto('/chat/thr_1');
  let failed = false;
  await page.route('**/v1/threads/*/messages', async (route) => {
    if (route.request().method() === 'POST' && !failed) {
      failed = true;
      await route.abort('connectionreset');
      return;
    }
    await route.continue();
  });
  await write(page, 'Try this');
  await expect(page.getByText('Not sent')).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Friday evening looks free')).toBeVisible();
  const list = await request.get(`${MOCK}/v1/threads/thr_1/messages`);
  const items = ((await list.json()) as { items: { role: string; text: string }[] }).items;
  expect(items.filter((m) => m.text === 'Try this')).toHaveLength(1);
});

test('reading older messages is not interrupted by new ones', async ({ page, request }) => {
  const [id] = await seedThreads(request, [{ title: 'Long one' }]);
  for (let i = 0; i < 14; i += 1) {
    await request.post(`${MOCK}/v1/threads/${id}/messages`, {
      data: { text: `Message number ${i + 1} with enough words to take some room on the screen.` },
      headers: { 'idempotency-key': `long-${i}-key` },
    });
  }
  await page.goto(`/chat/${id}`);
  const atBottom = () =>
    page.evaluate(
      () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 90,
    );
  // Long enough to scroll, and opened at the newest message.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await expect.poll(atBottom).toBe(true);

  await page.evaluate(() => window.scrollTo(0, 0));
  await write(page, 'One more');
  await expect(page.getByText('Friday evening looks free').last()).toBeAttached();
  await expect(page.getByRole('button', { name: 'Jump to latest' })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);

  await page.getByRole('button', { name: 'Jump to latest' }).click();
  await expect.poll(atBottom).toBe(true);
  await expect(page.getByRole('button', { name: 'Jump to latest' })).toHaveCount(0);
});

test('the message box is usable and accessible', async ({ page, request }) => {
  await seedThreads(request, [{ title: 'A', message: 'Hi' }]);
  await page.goto('/chat/thr_1');
  const box = page.getByRole('textbox', { name: /^Message/ });
  await expect(box).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await box.fill('x'.repeat(20001));
  await expect(page.getByText(/longer than 20,000 characters/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  expect(await axeViolations(page)).toEqual([]);
});
