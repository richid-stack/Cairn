import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { useEffect } from 'react';
import { Button, Dialog, Menu, useToast } from '../src/index';

const meta: Meta = { title: 'Overlays', component: Dialog };
export default meta;
type Story = StoryObj;

export const DialogOpen: Story = {
  render: () => (
    <Dialog
      open
      title="Delete this memory?"
      onClose={() => {}}
      actions={
        <>
          <Button variant="ghost">Keep it</Button>
          <Button variant="danger">Delete</Button>
        </>
      }
    >
      Cairn will forget that you prefer morning meetings. This cannot be undone.
    </Dialog>
  ),
};

export const MenuOpen: Story = {
  render: () => (
    <Menu
      label="Thread actions"
      items={[
        { label: 'Rename', onSelect: () => {} },
        { label: 'Archive', onSelect: () => {} },
        { label: 'Export', onSelect: () => {}, disabled: true },
        { label: 'Delete', onSelect: () => {}, danger: true },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Thread actions' }));
  },
};

function ToastsOnMount() {
  const toast = useToast();
  useEffect(() => {
    // Long durations so nothing disappears before the screenshot.
    const long = 600_000;
    toast.show({
      message: 'Thread archived.',
      action: { label: 'Undo', onAction: () => {} },
      duration: long,
    });
    toast.show({ message: 'Saved.', tone: 'success', duration: long });
    toast.show({
      message: 'Could not send. Check your connection and try again.',
      tone: 'danger',
      duration: long,
    });
  }, []);
  return <p>Three toasts, one of each tone.</p>;
}

export const Toasts: Story = { render: () => <ToastsOnMount /> };
