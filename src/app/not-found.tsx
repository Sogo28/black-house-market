import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-semibold">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-lg bg-ink px-6 font-semibold text-white">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
