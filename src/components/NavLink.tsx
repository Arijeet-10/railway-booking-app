"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const NavLink = ({ href, children, className }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent/50 hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
};

export default NavLink;
