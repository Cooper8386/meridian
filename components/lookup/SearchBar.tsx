"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** True while a query is in flight — drives the animated indicator. */
  busy: boolean;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  busy,
  placeholder = "Search any city, town, or place…",
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      // Smooth spring on focus keeps the bar lively without janky reflows.
      animate={{
        scale: focused ? 1.01 : 1,
        borderColor: focused
          ? "var(--accent)"
          : "var(--color-surface-border)",
      }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="relative flex items-center gap-3 rounded-2xl border bg-surface px-5 py-4"
      style={{ borderColor: "var(--color-surface-border)" }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted"
      />

      <motion.span
        aria-hidden="true"
        className="h-4 w-4 shrink-0 rounded-full border-2 border-accent border-t-transparent"
        animate={{ rotate: busy ? 360 : 0, opacity: busy ? 1 : 0 }}
        transition={
          busy
            ? { rotate: { repeat: Infinity, ease: "linear", duration: 0.7 } }
            : { duration: 0.15 }
        }
      />
    </motion.div>
  );
}
