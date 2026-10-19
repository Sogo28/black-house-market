import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOut } from "../connexion/actions";

export const metadata: Metadata = { title: "Back-office · Black House", robots: { index: false } };

// Habillage du back-office. Le contrôle d'accès n'est PAS ici : chaque page et chaque
// action appellent requireAdmin() (un layout ne protège pas les actions serveur).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-[#F6F3EE]">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/admin" aria-label="Black House, back-office" className="flex items-center">
            <Logo width={150} />
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
        <nav aria-label="Sections du back-office" className="border-t border-white/10">
          {/* Même principe que la barre de catégories de la boutique : w-max + max-w-full centre
              la liste quand elle tient, et la laisse défiler quand elle déborde. */}
          <div className="mx-auto flex w-max max-w-full gap-2 overflow-x-auto px-4 md:gap-4 md:px-8">
            <Link href="/admin" className="px-3 py-3.5 text-base font-semibold hover:text-gold md:text-lg">
              Commandes
            </Link>
            <Link href="/admin/produits" className="px-3 py-3.5 text-base font-semibold hover:text-gold md:text-lg">
              Produits
            </Link>
          </div>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 md:px-8">{children}</div>
    </div>
  );
}
