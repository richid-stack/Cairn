import { dark, light } from '@cairn/tokens';

const shown = ['bg', 'surface', 'text', 'textMuted', 'accent', 'accentSoft'] as const;
const cssName = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export default function Home() {
  return (
    <main>
      <header>
        {/* The logo is a small raster until the vector file arrives. */}
        <img className="logo" src="/cairn-logo.jpg" alt="Cairn" width={195} height={83} />
      </header>
      <section>
        <span className="badge">Phase 0: foundations</span>
        <h1>A personal agent that asks before it acts.</h1>
        <p className="muted">
          This is the blank shell. The design tokens below come from the logo and switch with the
          system theme.
        </p>
      </section>
      <section>
        <h2>Brand tokens</h2>
        <ul className="swatches">
          {shown.map((key) => (
            <li className="swatch" key={key}>
              <span className="chip" style={{ background: `var(--cairn-color-${cssName(key)})` }} />
              <span className="label">
                {cssName(key)}
                <code>light {light[key]}</code>
                <code>dark {dark[key]}</code>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
