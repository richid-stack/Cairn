import type { Metadata } from 'next';
import { ThreadView } from '../../../../features/threads/thread-view';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return <ThreadView key={threadId} threadId={threadId} />;
}
