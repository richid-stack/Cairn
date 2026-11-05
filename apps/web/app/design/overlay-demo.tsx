'use client';

import { Button, Menu, useToast } from '@cairn/ui';

export function OverlayDemo() {
  const toast = useToast();
  return (
    <div className="row">
      <Menu
        label="Thread actions"
        items={[
          { label: 'Rename', onSelect: () => toast.show({ message: 'Renamed.', tone: 'success' }) },
          {
            label: 'Archive',
            onSelect: () =>
              toast.show({
                message: 'Thread archived.',
                action: { label: 'Undo', onAction: () => toast.show({ message: 'Restored.' }) },
              }),
          },
          { label: 'Export', onSelect: () => {}, disabled: true },
          {
            label: 'Delete',
            onSelect: () =>
              toast.show({
                message: 'Could not delete. Check your connection and try again.',
                tone: 'danger',
              }),
            danger: true,
          },
        ]}
      />
      <Button
        variant="secondary"
        onClick={() => toast.show({ message: 'Saved.', tone: 'success' })}
      >
        Show a toast
      </Button>
    </div>
  );
}
