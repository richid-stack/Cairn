# Brand icons and logos

Every connector, sign-in method and model provider shows its real icon or logo, so people recognise what they are connecting. This is the policy for doing that safely.

## Rules

1. **Official sources only.** Take each logo from the brand's own press or brand-assets page. Do not redraw or recolor a logo.
2. **Follow each brand's guidelines.** Clear space, minimum size, allowed colors and wording differ per brand. Sign-in buttons especially: Google, Microsoft and Apple each publish exact button designs and wording, and the sign-in screen uses those.
3. **Show it only to refer to the product.** A logo means "connect to this service", never "this service endorses Cairn". Nothing in Cairn implies a partnership that does not exist.
4. **Keep a record.** Each icon lives in the brand icon set with its source link, the date it was taken and the guideline link. A test fails when an icon has no record.
5. **A fallback for everything else.** When a brand has no usable asset, or its guidelines forbid use, show a neutral letter tile with the provider's name. Never a lookalike.
6. **Removal on request.** If a brand asks for its logo to be removed, it is replaced by the fallback in the next release.

## How the icon set works

- The icon set will be its own package, `packages/brand-icons`, planned for frontend Phase 1.
- Icons are keyed by the `brandIcon` field already in the contract (`google`, `microsoft`, `github`, `anthropic`, and so on).
- Monochrome icon collections can help for simple marks. As far as I know, Simple Icons publishes its SVGs under CC0 while saying that the brands themselves remain trademarks, so each use still follows that brand's guidelines. Check the collection's current terms before relying on it.
- Multi-color logos such as Google's and Microsoft's come from the brand kits, not from a monochrome collection.

This is practical guidance, not legal advice. Check the guidelines of each brand and, before launch, get a lawyer to review the logo use.
