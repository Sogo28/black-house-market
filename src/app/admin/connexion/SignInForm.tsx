"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

export function SignInForm({ refused }: { refused: boolean }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, { error: null });
  const error = state.error ?? (refused ? "Ce compte n'a pas accès au back-office." : null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="h-12 rounded-lg border border-line px-3 text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-lg border border-line px-3 text-base"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded-lg bg-ink font-semibold text-white disabled:bg-line disabled:text-muted"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
