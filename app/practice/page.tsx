import Link from "next/link";

export default function PracticePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-xs tracking-widest text-muted uppercase">
        Practice Mode
      </p>
      <h1 className="text-3xl font-bold">Coming soon</h1>
      <p className="max-w-md text-sm text-muted">
        Timed conversion drills are planned for a future version. For now,
        head back to Learn mode to keep building your foundation.
      </p>
      <Link
        href="/learn"
        className="mt-4 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        Go to Learn mode
      </Link>
    </div>
  );
}
