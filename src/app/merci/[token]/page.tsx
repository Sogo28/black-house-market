import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearCart } from "@/components/cart/ClearCart";
import { CheckCircleIcon } from "@/components/icons";
import { getOrderSummary } from "@/infra/orders";

export const metadata: Metadata = { title: "Commande reçue · Black House", robots: { index: false } };

const NEXT_STEPS = [
  {
    title: "Vérification de vos articles",
    text: "Si un article manque, vous choisissez : le remplacer ou continuer sans.",
  },
  { title: "Confirmation sur WhatsApp", text: "Total et frais de livraison : il vous suffit de répondre « OK »." },
  { title: "Livraison et paiement", text: "En espèces, Wave ou Orange Money, à la réception." },
];

export default function ThankYouPage(props: PageProps<"/merci/[token]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-10">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <ThankYou {...props} />
      </Suspense>
    </main>
  );
}

async function ThankYou({ params }: PageProps<"/merci/[token]">) {
  const { token } = await params;
  const order = await getOrderSummary(token);

  if (!order) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Commande introuvable</h1>
        <Link href="/" className="mt-3 inline-block underline">
          Retour à l&apos;accueil
        </Link>
      </>
    );
  }

  return (
    <>
      <ClearCart />
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-ink text-gold">
          <CheckCircleIcon className="size-8" />
        </span>
        <h1 className="text-3xl font-semibold">Commande reçue, merci {order.firstName} !</h1>
        <p className="text-muted">
          Votre commande <strong className="text-ink">n° {order.code}</strong> est enregistrée.
        </p>
      </div>

      <p className="mt-6 flex flex-col gap-1 rounded-xl bg-[#FBF3E2] p-4 text-sm">
        <span className="font-bold tracking-wider text-amber">EN PRÉPARATION</span>
        Nous vérifions chacun de vos articles. Vous recevez la confirmation sur WhatsApp sous 2 h (de 9 h à 21 h).
      </p>

      <section className="mt-6 rounded-2xl border border-line p-5">
        <h2 className="text-lg font-semibold">Les prochaines étapes</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-gold">
                {index + 1}
              </span>
              <span className="flex flex-col">
                <strong className="font-semibold">{step.title}</strong>
                <span className="text-sm text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Link
        href={`/suivi/${token}`}
        className="mt-6 flex h-13 items-center justify-center rounded-lg bg-ink font-semibold text-white"
      >
        Suivre ma commande
      </Link>
      <Link
        href="/"
        className="mt-3 flex h-13 items-center justify-center rounded-lg border-[1.5px] border-ink font-semibold"
      >
        Continuer mes achats
      </Link>
      <p className="mt-3 text-center text-sm text-muted">Gardez ce lien : il vous permet de suivre votre commande.</p>
    </>
  );
}
