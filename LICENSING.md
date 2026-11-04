# Licensing

Cairn uses two open-source licenses, chosen by who is likely to build on each part.

| Part                                        | License                                 | Why                                                                                                                                                                                                                    |
| ------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`, `apps/api`                      | [AGPL-3.0-only](LICENSE)                | Anyone may use, change and self-host Cairn. If they offer a modified version as a network service, they must publish their changes under AGPL                                                                          |
| `packages/tokens`, `packages/ui`            | [AGPL-3.0-only](LICENSE)                | The design system carries Cairn's own look, so it stays with the app                                                                                                                                                   |
| `packages/contract`, `packages/mock-server` | [Apache-2.0](packages/contract/LICENSE) | The API contract, generated client, conformance suite and mock server are for other people's clients, connectors and tools. Apache-2.0 lets them use these in any project, open or closed, and includes a patent grant |

Files not covered above (the root tooling, docs and CI configuration) follow the root `LICENSE`, AGPL-3.0-only.

## Not covered by either license

The Cairn name, the logo and the files in `assets/brand/` are trademarks and brand assets, not open-source code. See [TRADEMARKS.md](TRADEMARKS.md).

Third-party brand icons (connectors, sign-in methods, model providers) belong to their owners and are used under each brand's guidelines. See [docs/brand-icons.md](docs/brand-icons.md).

## Contributing

Contributors sign the [CLA](CLA.md) before a change is merged. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Source of the license texts

The license files are the official texts from the [SPDX license list](https://github.com/spdx/license-list-data). This file is a plain-language map, not legal advice. Get a lawyer to review the licensing and the CLA before the first outside contribution.
