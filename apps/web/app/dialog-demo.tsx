'use client';

import { Button, Dialog } from '@cairn/ui';
import { useState } from 'react';

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete a memory
      </Button>
      <Dialog
        open={open}
        title="Delete this memory?"
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        Cairn will forget that you prefer morning meetings. This cannot be undone.
      </Dialog>
    </>
  );
}
