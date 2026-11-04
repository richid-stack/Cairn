import type { CSSProperties, ReactNode } from 'react';
import { cx } from './cx';
import { VisuallyHidden } from './visually-hidden';

export interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
}

/** A grey placeholder in the shape of content that is on its way. */
export function Skeleton({ width = '100%', height = '1em', radius, className }: SkeletonProps) {
  return (
    <span
      className={cx('cairn-skeleton', className)}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/** Placeholder lines for a paragraph. The last line is shorter, like real text. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <span className="cairn-skeleton-text" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} height="0.9em" />
      ))}
    </span>
  );
}

/** Wraps skeletons so a screen reader hears one short "Loading" instead of silence. */
export function SkeletonGroup({
  label = 'Loading',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className="cairn-skeleton-group">
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </div>
  );
}
