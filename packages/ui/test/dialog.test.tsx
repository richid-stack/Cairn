import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Button, Dialog } from '../src/index';
import { expectNoA11yViolations } from './setup';

// jsdom has no modal dialog support, so give it the minimum the browser provides.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete memory</Button>
      <Dialog
        open={open}
        title="Delete this memory?"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        actions={<Button onClick={() => setOpen(false)}>Keep it</Button>}
      >
        It cannot be undone.
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('is closed until opened, then named by its title', async () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete memory' }));
    expect(screen.getByRole('dialog', { name: 'Delete this memory?' })).toBeTruthy();
  });

  it('asks the parent to close on Escape, and leaves the state to the parent', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Delete memory' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this memory?' });
    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes from an action button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Delete memory' }));
    await user.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Delete memory' }));
    await expectNoA11yViolations(container);
  });
});
