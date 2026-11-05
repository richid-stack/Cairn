import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New chat' };

export default function NewChatPage() {
  return (
    <div className="page-stack">
      <h1 className="page-title">What can I help with?</h1>
      <p className="page-lede">
        Ask for an errand, a reminder or a plan. Cairn shows you each step and asks before it does
        anything that matters.
      </p>
    </div>
  );
}
