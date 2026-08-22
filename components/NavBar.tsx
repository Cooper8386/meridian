"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import MeridianMark from "@/components/MeridianMark";
import { getProgress, PROGRESS_UPDATED_EVENT } from "@/lib/progress";
import { formatTimeInZone } from "@/lib/timezones";
import { detectBrowserTimeZone } from "@/lib/userTimeZone";

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
  const { user, loading, signOut } = useAuth();
  const [utcTime, setUtcTime] = useState<string | null>(null);
  const [localTimeZone, setLocalTimeZone] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    // Reading progress/detecting the browser's zone requires the browser,
    // so this must run post-mount rather than during the lazy initial
    // state, to avoid a server/client render mismatch.
    const readZone = () =>
      setLocalTimeZone(getProgress().timeZoneOverride ?? detectBrowserTimeZone());

    readZone();

    // NavBar is a persistent layout component (mounted once, not
    // remounted on client-side navigation), so without this listener a
    // time zone override set on /progress wouldn't show up here until a
    // full page reload.
    window.addEventListener(PROGRESS_UPDATED_EVENT, readZone);
    return () => window.removeEventListener(PROGRESS_UPDATED_EVENT, readZone);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(utcFormatter.format(now));
      if (localTimeZone) {
        setLocalTime(formatTimeInZone(localTimeZone, now));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [localTimeZone]);

  return (
    <header className="border-b border-surface-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-[0.2em] uppercase"
        >
          <MeridianMark size={20} />
          <span className="h-4 w-0.5 bg-accent" aria-hidden="true" />
          Meridian
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

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end font-mono text-xs tracking-wider tabular-nums">
            <span className="text-muted">UTC {utcTime ?? "--:--"}</span>
            {localTimeZone && (
              <span className="text-foreground/80">
                {localTime ?? "--:--"} · {localTimeZone}
              </span>
            )}
          </div>

          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Log in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
