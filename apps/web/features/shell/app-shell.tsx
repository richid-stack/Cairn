'use client';

import { Button, Dialog, Icon, buttonStyle } from '@cairn/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ThreadList } from '../threads/thread-list';
import { RouteFocus } from './route-focus';
import './shell.css';

function Brand() {
  return (
    <Link href="/chat" className="brand" aria-label="Cairn, home">
      <img src="/cairn-logo.jpg" alt="" width={120} height={51} />
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="sidebar-body">
      <Brand />
      <Link href="/chat" {...buttonStyle({ variant: 'primary' })} onClick={onNavigate}>
        <Icon name="plus" size="sm" />
        New chat
      </Link>
      <nav aria-label="Conversations" className="sidebar-nav">
        <ThreadList onNavigate={onNavigate} />
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // The phone menu closes when a page opens, and if the screen grows wide enough to show the sidebar.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 48rem)');
    const close = () => wide.matches && setMenuOpen(false);
    wide.addEventListener('change', close);
    return () => wide.removeEventListener('change', close);
  }, []);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="shell-bar">
        <Button
          variant="ghost"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" />
        </Button>
        <Brand />
      </header>

      <aside className="shell-sidebar" aria-label="Sidebar">
        <SidebarContent />
      </aside>

      <Dialog open={menuOpen} placement="start" title="Menu" onClose={() => setMenuOpen(false)}>
        {/* Built only while open, so the page never holds two copies of the sidebar. */}
        {menuOpen ? <SidebarContent onNavigate={() => setMenuOpen(false)} /> : null}
      </Dialog>

      <main id="main" tabIndex={-1} className="shell-main">
        {children}
      </main>
      <RouteFocus />
    </div>
  );
}
