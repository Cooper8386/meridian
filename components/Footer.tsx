import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/map", label: "Map Challenge" },
  { href: "/progress", label: "Progress" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="h-4 w-0.5 bg-accent" aria-hidden="true" />
          <span className="text-sm font-bold tracking-[0.2em] uppercase">
            Meridian
          </span>
          <span className="ml-2 text-xs text-muted">
            Know what time it is, anywhere.
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
