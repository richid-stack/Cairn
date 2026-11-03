# Cairn

![Cairn](assets/brand/cairn-logo.jpg)

Cairn is a personal-agent app that handles errands, money and scheduling, and asks before it acts. A cairn marks a path; Cairn's agent shows where it has been and asks before it goes further.

**Status:** planning. No application code yet. The first code lands with Phase 0 (see the plans below).

## Plans

| Doc | What it covers |
| --- | --- |
| [docs/frontend-plan.md](docs/frontend-plan.md) | Frontend architecture, 13 phases, craft standards, quality gates |
| [docs/backend-plan.md](docs/backend-plan.md) | Backend architecture, trust layer, 13 phases, solo timeline |
| [docs/decisions.md](docs/decisions.md) | Decisions made and decisions still open |

The full versions, with architecture and roadmap drawings, live as documents in the Cairn project on claude.ai. The links are at the top of each plan file.

## Ground rules

- **Own identity.** Cairn's colors, type, mascot and copy are its own. Research on another app's web build informed structure only. None of its assets, names, copy or icons are used here.
- **Contract first.** The OpenAPI spec and streaming event schema are the source of truth for both sides.
- **Trust before power.** Approvals, permissions and the audit log exist before any tool can change anything outside Cairn.
- **Web first.** An installable web app comes first; native apps come later.
- **Quality gates.** A phase does not close until its gates pass in CI.

## Repository layout (planned)

```
apps/web          Next.js frontend
apps/api          TypeScript backend
packages/contract OpenAPI spec, event schema, generated client
packages/ui       Design system
infra/            Infrastructure as code
docs/             Plans and decision log
assets/brand/     Logo and brand files
```

Only `docs/` and `assets/` exist today.
