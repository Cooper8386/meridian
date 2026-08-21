"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/map", label: "Map Challenge" },
  { href: "/progress", label: "Progress" },
];

const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default function NavBar() {
  const pathname = usePathname();
  const [utcTime, setUtcTime] = useState<string | null>(null);

  useEffect(() => {
    // Sets the initial clock reading post-mount to avoid a server/client
    // render mismatch, then subscribes to a ticking interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUtcTime(utcFormatter.format(new Date()));
    const interval = setInterval(() => {
      setUtcTime(utcFormatter.format(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-surface-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-bold tracking-widest uppercase">
          World <span className="text-accent">Time</span> Lab
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-foreground"
                    : "transition-colors hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <span className="text-xs tracking-wider text-muted tabular-nums">
          UTC {utcTime ?? "--:--"}
        </span>
      </div>
    </header>
  );
}
