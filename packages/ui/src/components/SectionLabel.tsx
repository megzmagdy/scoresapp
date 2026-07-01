import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { MONO } from '../lib/theme';

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn('text-[11px] uppercase tracking-[0.2em] text-dpt-gold', className)}
      style={{ fontFamily: MONO }}
    >
      {children}
    </p>
  );
}
