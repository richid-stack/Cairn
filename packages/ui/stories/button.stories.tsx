import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Icon, type ButtonVariant } from '../src/index';

const meta: Meta = { title: 'Button', component: Button };
export default meta;
type Story = StoryObj;

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];

export const Variants: Story = {
  render: () => (
    <div className="story-stack">
      {variants.map((variant) => (
        <div className="story-row" key={variant}>
          <Button variant={variant}>{variant}</Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Saving
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="story-row">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="story-row">
      <Button icon={<Icon name="send" />}>Send</Button>
      <Button variant="secondary" icon={<Icon name="download" />}>
        Export
      </Button>
    </div>
  ),
};
