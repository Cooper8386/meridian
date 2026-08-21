import Link from "next/link";
import Globe from "@/components/Globe";
import WorldClockStrip from "@/components/WorldClockStrip";

const STEPS = [
  {
    number: "01",
    title: "Learn the system",
    description:
      "Clear lessons explain UTC, IANA zone names, date rollover, and daylight saving time.",
    href: "/learn",
    linkLabel: "Open Lessons",
  },
  {
    number: "02",
    title: "Practice conversions",
    description: "Move from guided clues to location-only prompts at your own pace.",
    href: "/practice",
    linkLabel: "Practice Now",
  },
  {
    number: "03",
    title: "See it geographically",
    description: "Match zones, offsets, and countries on an interactive world map.",
    href: "/map",
    linkLabel: "Map Challenge",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <div>
          <p className="text-xs tracking-widest text-muted uppercase">
            Time, Space, and Context
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-[1.05] font-bold sm:text-6xl">
            Learn the world
            <br />
            <span className="text-accent">one clock at a time.</span>
          </h1>
          <p className="mt-6 max-w-md text-base text-muted">
            Understand UTC, convert local time with confidence, and connect
            every time zone to its place on the map.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <Link
              href="/learn"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Continue learning
            </Link>
            <Link
              href="/map"
              className="text-sm text-foreground/90 transition-colors hover:text-foreground"
            >
              Explore The Map →
            </Link>
          </div>
        </div>

        <Globe />
      </section>

      <WorldClockStrip />

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y divide-surface-border border-b border-surface-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col gap-4 px-6 py-10">
            <p className="font-mono text-xs text-accent">{step.number}</p>
            <h3 className="font-display text-xl font-bold">{step.title}</h3>
            <p className="text-sm text-muted">{step.description}</p>
            <Link
              href={step.href}
              className="mt-auto text-sm font-semibold text-foreground/90 transition-colors hover:text-foreground"
            >
              {step.linkLabel} →
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
