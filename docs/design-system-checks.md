# Design system checks

Every component has a story in `packages/ui/stories`, and every story is checked automatically.

## What runs

| Check                        | Where                                | What it catches                                                                   |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| Unit and accessibility tests | `pnpm test` (jsdom, fast)            | Behavior, keyboard use, labels, ARIA, translated strings, right-to-left CSS rules |
| Browser accessibility check  | `pnpm verify:visual` (real Chromium) | Everything above plus **color contrast**, which jsdom cannot measure              |
| Screenshot comparison        | `pnpm verify:visual`                 | Any visible change to any component state                                         |

Each story is rendered four ways: light, dark, high contrast, and light right-to-left. That is 48 screenshots today.

## Working with the screenshots

- Baselines live in `packages/ui/visual/stories.spec.ts-snapshots/` and are committed.
- A change that alters how something looks fails the check. If the change is intended, run `pnpm --filter @cairn/ui test:visual:update`, look at the new images, and commit them with the change. Reviewers read the image diff in the pull request.
- Fonts are bundled for Storybook (Inter) and motion is switched off, so a screenshot does not depend on the machine.
- To look at components by hand: `pnpm --filter @cairn/ui storybook`. The toolbar switches theme and direction.
- On GitHub, a failed run uploads a report with the expected, actual and difference images.

## Why the screenshot comparison is set the way it is

Playwright's default comparison ignores anti-aliased edge pixels. A test showed that it let a corner radius change from 10 px to 14 px on every button pass. The comparison here uses the `ssim-cie94` comparator, which catches it, with a limit of 25 pixels. Playwright marks that option as internal. **After any Playwright upgrade, repeat this check:** change `border-radius` in `.cairn-button`, rebuild Storybook, run the screenshot comparison, and confirm it fails. Then undo the change.

## Known limits

- Baselines were made on the development machine and matched on GitHub's machines on the first run (2026-11-05). A different Chromium or font version could change that; if the check fails with no visible difference, regenerate the baselines in CI and compare.
- Only static states are captured. A menu is captured open, but a hover state or a focus ring on a specific element is not yet. Add a story with a `play` step for each.
- Storybook's own component documentation pages and interaction testing are not set up. The accessibility add-on shows results in the Storybook panel while developing.
- Only Chromium is checked. Safari and Firefox come with the Playwright end-to-end tests in a later phase.
