import Link from "next/link";
import { ChevronRightIcon } from "./icons";

export type InfoSection = { title: string; paragraphs?: string[]; items?: string[] };

/** Mise en page commune des pages d'information (livraison, échanges, conditions). */
export function InfoPage({ title, intro, sections }: { title: string; intro: string; sections: InfoSection[] }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 md:px-8">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <ChevronRightIcon className="size-4" />
        <span aria-current="page">{title}</span>
      </nav>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-3 text-lg text-muted">{intro}</p>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-ink/85">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-ink/85">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-xl bg-sand p-4 text-sm text-muted">
        Une question ? Écrivez-nous sur WhatsApp : nous répondons de 9 h à 21 h.
      </p>
    </main>
  );
}
