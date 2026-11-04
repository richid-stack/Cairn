import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Button,
  directionOf,
  Icon,
  SkeletonGroup,
  Spinner,
  ToastProvider,
  UiProvider,
  useToast,
} from '../src/index';

let api: ReturnType<typeof useToast>;
function Grab() {
  api = useToast();
  return null;
}

const arabic = {
  loading: 'جارٍ التحميل',
  dismiss: 'إغلاق',
  toastDone: 'تم',
};

describe('translated strings', () => {
  it('speaks English with no provider', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').textContent).toBe('Loading');
  });

  it('uses supplied strings for spinners, skeleton groups and loading buttons', () => {
    render(
      <UiProvider strings={arabic}>
        <Spinner />
        <SkeletonGroup>x</SkeletonGroup>
        <Button loading>Save</Button>
      </UiProvider>,
    );
    const texts = screen.getAllByRole('status').map((el) => el.textContent);
    expect(texts[0]).toBe('جارٍ التحميل');
    expect(texts[1]).toContain('جارٍ التحميل');
    expect(texts[2]).toBe('جارٍ التحميل');
  });

  it('a label given by the screen beats the catalogue', () => {
    render(
      <UiProvider strings={arabic}>
        <Spinner label="Sending" />
      </UiProvider>,
    );
    expect(screen.getByRole('status').textContent).toBe('Sending');
  });

  it('translates the toast tone word and the dismiss button, and falls back for the rest', () => {
    render(
      <UiProvider strings={arabic}>
        <ToastProvider>
          <Grab />
        </ToastProvider>
      </UiProvider>,
    );
    act(() => void api.show({ message: 'x', tone: 'success' }));
    act(() => void api.show({ message: 'y', tone: 'danger' }));
    expect(screen.getAllByRole('button', { name: 'إغلاق' })).toHaveLength(2);
    expect(screen.getByRole('status').textContent).toContain('تم:');
    // Not translated here, so it falls back to English instead of showing nothing.
    expect(screen.getByRole('alert').textContent).toContain('Problem:');
  });
});

describe('direction', () => {
  it('knows right-to-left languages, with or without a region', () => {
    for (const code of ['ar', 'ar-EG', 'he', 'fa-IR', 'ur', 'AR', 'ar_SA']) {
      expect(directionOf(code), code).toBe('rtl');
    }
  });

  it('treats everything else, and nothing, as left to right', () => {
    for (const code of ['en', 'en-GB', 'tw', 'gaa', 'fr', 'zh-Hans', '', undefined, null]) {
      expect(directionOf(code), String(code)).toBe('ltr');
    }
  });
});

describe('icon direction', () => {
  it('marks arrows and chevrons so they flip, and leaves other icons alone', () => {
    const { container } = render(
      <>
        <Icon name="chevron-right" />
        <Icon name="send" />
        <Icon name="search" />
      </>,
    );
    const marks = [...container.querySelectorAll('svg')].map((el) =>
      el.hasAttribute('data-directional'),
    );
    expect(marks).toEqual([true, true, false]);
  });
});
