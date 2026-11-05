'use client';

import { Button, SkeletonGroup, Skeleton } from '@cairn/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ErrorNotice } from './error-notice';
import { useThreads } from './queries';

export function ThreadList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeId = /^\/chat\/([^/]+)/.exec(pathname)?.[1];
  const threads = useThreads();

  if (threads.isPending) {
    return (
      <SkeletonGroup label="Loading conversations">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="2rem" radius="var(--cairn-radius-md)" />
        ))}
      </SkeletonGroup>
    );
  }

  if (threads.isError) {
    return <ErrorNotice error={threads.error} onRetry={() => void threads.refetch()} />;
  }

  const items = threads.data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return <p className="thread-empty">No conversations yet. Start one and it will appear here.</p>;
  }

  return (
    <>
      <ul className="thread-list">
        {items.map((thread) => (
          <li key={thread.id}>
            <Link
              href={`/chat/${thread.id}`}
              className="thread-link"
              aria-current={thread.id === activeId ? 'page' : undefined}
              title={thread.title}
              onClick={onNavigate}
            >
              <span className="thread-title">{thread.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      {threads.hasNextPage ? (
        <Button
          size="sm"
          variant="ghost"
          loading={threads.isFetchingNextPage}
          onClick={() => void threads.fetchNextPage()}
        >
          Show more
        </Button>
      ) : null}
    </>
  );
}
