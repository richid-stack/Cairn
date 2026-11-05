import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, Switch } from '../src/index';

const meta: Meta = { title: 'Choices', component: Checkbox };
export default meta;
type Story = StoryObj;

export const Checkboxes: Story = {
  render: () => (
    <div className="story-stack">
      <Checkbox label="Ask before spending" hint="Applies to every connector." defaultChecked />
      <Checkbox label="All connectors" indeterminate />
      <Checkbox label="Remember me" />
      <Checkbox label="Share usage data" error="Choose yes or no to continue." />
      <Checkbox label="Locked on" defaultChecked disabled />
    </div>
  ),
};

export const Switches: Story = {
  render: () => (
    <div className="story-stack">
      <Switch label="Daily summary" hint="Sent at 8:00, your time." defaultChecked />
      <Switch label="Quiet hours" />
      <Switch label="Locked on" defaultChecked disabled />
      <Switch label="Locked off" disabled />
    </div>
  ),
};
