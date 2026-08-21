"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result =
      mode === "sign-in"
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "sign-up") {
      setSignUpSuccess(true);
      return;
    }

    router.push("/learn");
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold">
        {mode === "sign-in" ? "Log in" : "Create an account"}
      </h1>

      {signUpSuccess ? (
        <p className="mt-6 text-sm text-muted">
          Check your email to confirm your account, then log in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-surface-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-surface-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : mode === "sign-in"
                ? "Log in"
                : "Sign up"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
          setSignUpSuccess(false);
        }}
        className="mt-6 text-sm text-muted hover:text-foreground"
      >
        {mode === "sign-in"
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>

      <Link href="/" className="mt-2 text-sm text-muted hover:text-foreground">
        Back home
      </Link>
    </div>
  );
}
