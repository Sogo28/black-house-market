import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOut } from "../connexion/actions";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: "Back-office · Black House", robots: { index: false } };

// Habillage du back-office. Le contrôle d'accès n'est PAS ici : chaque page et chaque
// action appellent requireAdmin() (un layout ne protège pas les actions serveur).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-[#F6F3EE]">
      <header className="sticky top-0 z-40 bg-ink text-white">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 md:px-8 md:py-0">
          <Link href="/admin" aria-label="Black House, back-office" className="flex items-center">
            <Logo width={185} />
          </Link>
          <Suspense>
            <AdminNav signOut={signOut} />
          </Suspense>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 md:px-8">{children}</div>
    </div>
  );
}
