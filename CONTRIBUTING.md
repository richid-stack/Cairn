# Contributing to Cairn

Thank you for helping. A few things make a change easy to merge.

## Before you start

- Read [README.md](README.md) and the plans in `docs/`. Decisions live in [docs/decisions.md](docs/decisions.md).
- For anything large, open an issue first, so nobody builds something the project cannot take.
- Security problems: do not open a public issue. Email the owner (the address will be published in `SECURITY.md` before the first release).

## Sign the CLA

Every contributor signs the [Contributor License Agreement](CLA.md) once. When you open your first pull request, a bot comments with the instructions: you reply with one sentence, and your signature is recorded. Changes from contributors who have not signed cannot be merged.

The CLA lets you keep the copyright in your work. It also lets the project owner license the whole project, including your contribution, under other terms later, for example in a commercial edition. The CLA also commits the owner to keep what you contributed available under an open-source license. Read it before you sign.

## Make the change

```
pnpm install
pnpm verify        # generated types, typecheck, lint, format, tests, build
```

- `pnpm verify` must pass. CI runs the same command.
- Add or update tests with your change. A user interface change needs an accessibility test and must work with the keyboard alone.
- If you change `packages/contract/openapi/cairn.v1.yaml`, run `pnpm gen` and commit the generated output.
- Keep commits small and the message plain: what changed and why.
- Copy, labels and errors are written in one voice: plain, short and kind. Errors say what to do next.

## Licensing of your contribution

Code under `packages/contract` and `packages/mock-server` is Apache-2.0. Everything else is AGPL-3.0-only. See [LICENSING.md](LICENSING.md). New files do not need a license header; the package's `LICENSE` applies.
