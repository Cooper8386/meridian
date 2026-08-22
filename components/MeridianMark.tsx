/**
 * The Meridian logo mark: a clock face with two hands at different
 * positions (two time zones) and a thin meridian line through the
 * center. Geometry matches the source design (Claude Design project
 * "Meridian logoset design") 1:1 — see email-templates/README.md for
 * the other place this same mark is duplicated as inline SVG, since
 * email clients can't use a React component.
 *
 * Ring/hands use currentColor so the mark can sit in foreground or
 * muted text contexts; the minute hand and center dot stay the fixed
 * accent lime, matching the design's "never recolor the accent
 * tick/hand independently of the palette" rule.
 */
export default function MeridianMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <line x1="50" y1="12" x2="50" y2="88" stroke="#2d5f5a" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="5" fill="none" />
      <line x1="50" y1="21" x2="50" y2="15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="79" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="79" x2="50" y2="85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="21" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2="37.14" y2="34.68" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" x2="75.37" y2="40.77" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="4" fill="var(--accent)" />
    </svg>
  );
}
