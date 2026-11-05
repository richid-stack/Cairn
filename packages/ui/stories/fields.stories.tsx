import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, TextField } from '../src/index';

const meta: Meta = { title: 'Fields', component: TextField };
export default meta;
type Story = StoryObj;

export const TextFields: Story = {
  render: () => (
    <div className="story-stack">
      <TextField label="Email" hint="We send a sign-in code." placeholder="you@example.com" />
      <TextField
        label="Email"
        defaultValue="ada@"
        error="That address is not valid. Check for typos."
      />
      <TextField label="Agent name" defaultValue="Tor" disabled />
    </div>
  ),
};

export const Selects: Story = {
  render: () => (
    <div className="story-stack">
      <Select label="Country" hint="Sets your currency and payment options.">
        <option value="gh">Ghana</option>
        <option value="ke">Kenya</option>
        <option value="ng">Nigeria</option>
      </Select>
      <Select label="Country" error="Pick a country to continue." defaultValue="">
        <option value="" disabled>
          Choose one
        </option>
        <option value="gh">Ghana</option>
      </Select>
      <Select label="Country" disabled>
        <option>Ghana</option>
      </Select>
    </div>
  ),
};
