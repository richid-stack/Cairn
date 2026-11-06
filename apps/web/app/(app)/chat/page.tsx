import type { Metadata } from 'next';
import { NewChat } from '../../../features/threads/new-chat';

export const metadata: Metadata = { title: 'New chat' };

export default function NewChatPage() {
  return <NewChat />;
}
