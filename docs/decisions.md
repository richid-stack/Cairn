# Decisions

## Made

| Decision | Answer | Date |
| --- | --- | --- |
| Product name | Cairn | 2026-11-03 |
| Logo | Three stacked stones (blue, black, blue) beside a bold black wordmark. Image in `assets/brand/` | 2026-11-03 |
| Repository | github.com/richid-stack/cairn | 2026-11-03 |
| Team | Solo to start; others may join later | 2026-11-03 |
| Platforms | Web first, as an installable app; native later | 2026-11-03 |
| Backend scope | Planned to the same depth as the frontend and built alongside it, in vertical slices | 2026-11-03 |
| Agent names | Users name their own agent. Shortlist for the default: Tor, Waymark, Lodestar, Basalt, Keystone, Kestrel. Availability and trademarks not yet checked | 2026-11-03 |

## Open

| Decision | Options | Needed before |
| --- | --- | --- |
| Default agent name | Pick from the shortlist, after checking availability | Frontend Phase 3 |
| Brand files | Vector logo and the exact blue and black | Frontend Phase 0 tokens |
| First-release languages | English first, with translation and right-to-left support built in from the start | Frontend Phase 1 |
| Backend language | TypeScript as proposed, or another | B0 |
| Hosting | Managed container platform first, or a major cloud | B0 |
| Authentication | Vetted library, or a managed provider | B1 |
| Business registration country | Decides payment providers, tax and data rules | B8, and before beta |
| Payment provider | Depends on the country; availability to be checked | B8 |
| Model providers | Claude first behind a gateway, or more than one from the start | B3 |
| First connectors | Calendar, email, files as proposed | B5 |
| Data region and retention | Where data lives and how long it is kept | Before beta |
| Extra help | Hire or contract an engineer, and from when | Month 6 review |
