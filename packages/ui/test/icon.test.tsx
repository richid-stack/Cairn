import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon, iconNames, Skeleton, SkeletonGroup, SkeletonText } from '../src/index';
import { expectNoA11yViolations } from './setup';

describe('Icon', () => {
  it('renders every named icon as an svg', () => {
    expect(iconNames.length).toBeGreaterThanOrEqual(30);
    for (const name of iconNames) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector('svg'), name).toBeTruthy();
      unmount();
    }
  });

  it('hides a decorative icon from screen readers', () => {
    const { container } = render(<Icon name="check" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('names an icon that carries meaning on its own', () => {
    render(<Icon name="warning" label="Needs your approval" />);
    expect(screen.getByRole('img', { name: 'Needs your approval' })).toBeTruthy();
  });

  it('sizes from the scale', () => {
    const { container } = render(<Icon name="check" size="lg" />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('24');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <main>
        <Icon name="search" label="Search" />
        <Icon name="check" />
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Skeleton', () => {
  it('is hidden from screen readers; the group announces loading once', () => {
    render(
      <SkeletonGroup label="Loading messages">
        <Skeleton height={20} />
        <SkeletonText lines={3} />
      </SkeletonGroup>,
    );
    const group = screen.getByRole('status');
    expect(group.getAttribute('aria-busy')).toBe('true');
    expect(group.textContent).toBe('Loading messages');
  });

  it('makes the last line of text shorter', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const widths = [...container.querySelectorAll<HTMLElement>('.cairn-skeleton')].map(
      (el) => el.style.width,
    );
    expect(widths).toEqual(['100%', '100%', '60%']);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <main>
        <SkeletonGroup>
          <SkeletonText />
        </SkeletonGroup>
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
