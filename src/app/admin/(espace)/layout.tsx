import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "../connexion/actions";

export const metadata: Metadata = { title: "Back-office · Black House", robots: { index: false } };

// Habillage du back-office. Le contrôle d'accès n'est PAS ici : chaque page et chaque
// action appellent requireAdmin() (un layout ne protège pas les actions serveur).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-[#F6F3EE]">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Black House</span>
            <span className="text-lg font-semibold">Back-office</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/" className="whitespace-nowrap rounded-lg px-3 py-3 hover:bg-white/10">
              Boutique
            </Link>
            <form action={signOut}>
              <button type="submit" className="whitespace-nowrap rounded-lg px-3 py-3 hover:bg-white/10">
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-5">{children}</div>
    </div>
  );
}
