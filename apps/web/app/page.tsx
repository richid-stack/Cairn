import { dark, light } from '@cairn/tokens';
import { Button, Checkbox, Select, Switch, TextField, type ButtonVariant } from '@cairn/ui';
import { DialogDemo } from './dialog-demo';
import { OverlayDemo } from './overlay-demo';
import { ThemeSwitcher } from './theme-switcher';

const shown = ['bg', 'surface', 'text', 'textMuted', 'accent', 'accentSoft'] as const;
const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
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
      <section>
        <h2>Theme</h2>
        <ThemeSwitcher />
      </section>
      <section>
        <h2>Buttons</h2>
        {variants.map((variant) => (
          <div className="row" key={variant}>
            <Button variant={variant}>{variant}</Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} loading>
              Loading
            </Button>
          </div>
        ))}
      </section>
      <section>
        <h2>Text fields</h2>
        <div className="fields">
          <TextField label="Email" hint="We send a sign-in code." placeholder="you@example.com" />
          <TextField
            label="Email"
            error="That address is not valid. Check for typos."
            defaultValue="ada@"
          />
        </div>
      </section>
      <section>
        <h2>Select</h2>
        <div className="stack">
          <Select label="Country" hint="Sets your currency and payment options.">
            <option value="gh">Ghana</option>
            <option value="ke">Kenya</option>
            <option value="ng">Nigeria</option>
          </Select>
        </div>
      </section>
      <section>
        <h2>Choices</h2>
        <div className="stack">
          <Checkbox label="Ask before spending" hint="Applies to every connector." defaultChecked />
          <Checkbox label="All connectors" indeterminate />
          <Checkbox label="Share usage data" error="Choose yes or no to continue." />
          <Switch label="Daily summary" hint="Sent at 8:00, your time." defaultChecked />
          <Switch label="Quiet hours" />
        </div>
      </section>
      <section>
        <h2>Dialog</h2>
        <DialogDemo />
      </section>
      <section>
        <h2>Menu and toasts</h2>
        <OverlayDemo />
      </section>
    </main>
  );
}
