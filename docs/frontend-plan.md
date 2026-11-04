# Cairn: frontend plan (summary)

Full plan with diagrams: https://claude.ai/artifact/GkbuQeGg3U1JhqfvruCaLW
Backend plan: [backend-plan.md](backend-plan.md)
Decisions: [decisions.md](decisions.md)

This file is a summary kept in the repo. The full document in the Cairn project is the source of record and has the architecture and schedule drawings.

## Product and brand

- Cairn is a personal-agent app that handles errands, money and scheduling and asks before it acts.
- Logo: three stacked stones (blue, black, blue) beside a bold black wordmark. See `assets/brand/`.
- Own identity: Cairn's colors, type, mascot and copy are its own. The research into another app's web build informed structure only. None of its assets, names, copy or icons are used.

## Working agreement

- Work is pushed to this repository in small changes that pass the quality gates.
- Update the plan when a phase closes, and record answered decisions in `decisions.md`.

## Stack

Next.js App Router, React 19, strict TypeScript, Tailwind v4, Radix, Motion, TanStack Query, a small client store, Sentry, Playwright, Vitest, Storybook.

## Architecture

Layers: routes, root providers, feature modules, design system, data layer, backend contract (OpenAPI plus streaming events, with a mock server first). A platform strip (tracking, tracing, error boundaries, consent) crosses every layer. Features do not import each other; a lint rule enforces it.

Folder layout: `app/` routes, `features/<name>/` per feature, `ui/` design system, `lib/` api, streaming, storage, analytics and i18n, `styles/tokens.css`.

## Phases

Team of four: about 7 to 9 months to a polished beta. Solo: 14 to 18 months of frontend work on its own.

| Phase                              | Weeks           | Done when                                                                            |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| 0 Foundations                      | 2               | A blank app deploys on every commit and the mock server answers every contract route |
| 1 Design system and motion         | 5 to 6          | No screen needs a one-off style                                                      |
| 2 App shell and navigation         | 3 to 4          | Every screen has a stable URL and works with keyboard only                           |
| 3 Account, onboarding, consent     | 4               | A new user reaches a working agent in under 3 minutes                                |
| 4 Chat core                        | 8 to 10         | A 10,000-message thread scrolls at 60 fps                                            |
| 5 Agent panel and trust layer      | 6 to 8          | A user can always see what the agent did and reverse it                              |
| 6 Productivity surfaces            | 6               | Search returns results as you type in under 150 ms on the mock                       |
| 7 Connectors, wallet, billing      | 6               | Every connector has loading, connected, expired and error states                     |
| 8 Voice and realtime               | 4 to 6          | A call survives a network drop and resumes                                           |
| 9 Settings, sharing, notifications | 4               | Nothing in Settings is a placeholder                                                 |
| 10 Public site                     | 3 to 4          | Signed-out pages load under 150 KB                                                   |
| 11 Craft pass                      | 6, then ongoing | The craft checklist passes on every surface                                          |
| 12 Hardening and launch            | 6               | Beta users complete core tasks without help                                          |

## Craft standards (apply from Phase 1)

Instant feel (responses under 100 ms, optimistic updates); every state designed (skeleton, empty, error, offline); keyboard for everything; undo instead of confirm, except spending and deleting memory; motion with meaning and reduced-motion support; smooth streaming text; honest status that always agrees with the activity log; touch and pointer parity with 44 px targets; hand-written copy in one voice; details people notice; inclusive by default (screen readers, 200 percent text, high contrast, right-to-left, translations); fast on a mid-range phone (INP under 200 ms).

## Quality gates (CI must pass to close a phase)

Strict types and lint; unit and component tests; Playwright end-to-end at desktop and phone sizes; visual regression in light and dark; axe accessibility with zero serious violations; INP under 200 ms and signed-out pages under 150 KB; an event-coverage test on every interactive element; contract check against OpenAPI; dependency audit and security review before beta.

## Risks

Scope creep, backend drift, craft debt, platform sprawl (web first, native decision after Phase 9), look-alike drift from the reference app, and trust failure (activity log and undo are Phase 5 exit criteria).
