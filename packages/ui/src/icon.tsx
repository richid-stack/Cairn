import type { ComponentProps } from 'react';
import { cx } from './cx';
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  File,
  Info,
  Link,
  Lock,
  Mail,
  Menu,
  Minus,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react';

/**
 * Cairn's own names for interface icons. Screens ask for "success", never for a library's
 * icon, so the artwork behind a name can change without touching a single screen.
 * Brand logos for connectors and sign-in methods are a separate package.
 */
const icons = {
  check: Check,
  close: X,
  plus: Plus,
  minus: Minus,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  search: Search,
  send: Send,
  settings: Settings,
  menu: Menu,
  more: Ellipsis,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  success: CircleCheck,
  undo: Undo2,
  trash: Trash2,
  copy: Copy,
  edit: Pencil,
  lock: Lock,
  shield: ShieldCheck,
  calendar: Calendar,
  mail: Mail,
  file: File,
  link: Link,
  external: ExternalLink,
  clock: Clock,
  wallet: Wallet,
  user: User,
  bell: Bell,
  download: Download,
  upload: Upload,
} as const;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

// Icons that point somewhere flip in right-to-left. The rest, like a magnifying glass, do not.
const directional = new Set<IconName>(['chevron-left', 'chevron-right', 'send', 'undo']);

const sizes = { sm: 16, md: 20, lg: 24 } as const;
export type IconSize = keyof typeof sizes;

export interface IconProps extends Omit<ComponentProps<'svg'>, 'name' | 'size'> {
  name: IconName;
  size?: IconSize;
  /**
   * Leave out when the icon decorates text that already says the same thing, and it is
   * hidden from screen readers. Give it when the icon carries meaning by itself.
   */
  label?: string;
}

export function Icon({ name, size = 'md', label, className, ...props }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      width={sizes[size]}
      height={sizes[size]}
      strokeWidth={1.75}
      className={cx('cairn-icon', className)}
      data-directional={directional.has(name) || undefined}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
    />
  );
}
