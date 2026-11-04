import { runConformance } from '@cairn/contract/conformance';

/**
 * Runs the blank-mode conformance suite against a running API.
 *   pnpm --filter @cairn/api smoke https://your-service.run.app
 */
const base = process.argv[2];
if (!base) {
  console.error('Usage: pnpm --filter @cairn/api smoke <base-url>');
  process.exit(2);
}

const results = await runConformance(base.replace(/\/$/, ''), { mode: 'blank' });
for (const r of results)
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.detail ? `: ${r.detail}` : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed} of ${results.length} passed`);
process.exit(failed === 0 ? 0 : 1);
