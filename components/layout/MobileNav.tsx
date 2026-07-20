'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export interface MobileNavItem {
  href: string;
  label: string;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  menuLabel: string;
  closeLabel: string;
  children?: ReactNode;
}

export function MobileNav({
  items,
  menuLabel,
  closeLabel,
  children,
}: MobileNavProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="font-mono text-xs uppercase tracking-wider text-ink"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? closeLabel : menuLabel}
      </button>
      {open ? (
        <div id="mobile-nav-panel" className="border-t border-hair">
          {items.map((item) => (
            <a key={item.href} href={item.href} className="block py-2 font-sans text-ink">
              {item.label}
            </a>
          ))}
          {children}
        </div>
      ) : null}
    </div>
  );
}
