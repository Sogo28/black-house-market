import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { formatFcfa } from "@/domain/money";
import { whatsappLink } from "@/domain/phone";
import {
  choiceTotals,
  currentStep,
  LINE_LABELS,
  linesTotal,
  missingItems,
  TRACKING_STEPS,
  trackedLine,
  type LineState,
} from "@/domain/tracking";
import { getTrackedOrder } from "@/infra/orders";
import { SHOP_WHATSAPP } from "@/site";
import { chooseForOrder } from "./actions";
import { ChoiceForm } from "./ChoiceForm";
import { OrderPageSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Suivi de commande · Black House", robots: { index: false } };

const LINE_COLOR: Record<LineState, string> = {
  available: "text-whatsapp",
  pending: "text-muted",
  unavailable: "text-amber",
  replaced: "text-whatsapp",
  removed: "text-muted",
};

export default function TrackingPage(props: PageProps<"/suivi/[token]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
      <Suspense fallback={<OrderPageSkeleton />}>
        <Tracking {...props} />
      </Suspense>
    </main>
  );
}

async function Tracking({ params }: PageProps<"/suivi/[token]">) {
  const { token } = await params;
  const order = await getTrackedOrder(token);

  if (!order) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-semibold">Commande introuvable</h1>
        <p className="mt-2 text-muted">Vérifiez le lien reçu sur WhatsApp.</p>
      </div>
    );
  }

  const step = currentStep(order.status);
  const lines = order.items.map(trackedLine);
  const missing = missingItems(order.items);
  const waitingForChoice = order.status === "action_required" && missing.length > 0;
  const subtotal = linesTotal(lines);
  const createdAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Dakar",
  }).format(new Date(order.createdAt));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Suivi de commande</p>
        <h1 className="text-3xl font-semibold">Commande {order.code}</h1>
        <p className="text-sm text-muted">
          Passée le {createdAt} · {order.firstName}
        </p>
      </div>

      {step === null ? (
        <section className="rounded-2xl bg-sand p-5">
          <h2 className="text-lg font-semibold">Commande annulée</h2>
          <p className="text-sm text-muted">Vous n&apos;avez rien à payer. À bientôt chez Black House.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-semibold underline">
            Retour à la boutique
          </Link>
        </section>
      ) : (
        <ol aria-label="Étapes de la commande" className="rounded-2xl border border-line px-4 pt-4">
          {TRACKING_STEPS.map((s, index) => {
            const done = index < step || (index === step && order.status === "delivered");
            const current = index === step && !done;
            const hint =
              current && waitingForChoice ? "Votre choix est attendu ci-dessous." : s.hint;
            return (
              <li key={s.label} className="flex gap-3" aria-current={current ? "step" : undefined}>
                <div className="flex w-7 flex-col items-center">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      done ? "border-ink bg-ink text-gold" : current ? "border-ink" : "border-line"
                    }`}
                  >
                    {done && <CheckIcon className="size-4" />}
                    {current && <span className="size-2.5 rounded-full bg-ink" />}
                  </span>
                  {index < TRACKING_STEPS.length - 1 && (
                    <span className={`w-0.5 flex-1 ${index < step ? "bg-ink" : "bg-line"}`} />
                  )}
                </div>
                <div className="flex flex-col pb-5 pt-0.5">
                  <strong className={`font-semibold ${index > step ? "text-muted" : ""}`}>{s.label}</strong>
                  {(done || current) && (
                    <span className={`text-sm ${current && waitingForChoice ? "font-semibold text-amber" : "text-muted"}`}>
                      {hint}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {waitingForChoice && (
        <ChoiceForm
          action={chooseForOrder.bind(null, token)}
          missingNames={missing.map((item) => item.name)}
          replacementNames={missing.flatMap((item) => (item.replacement ? [item.replacement.name] : []))}
          totals={choiceTotals(order.items)}
        />
      )}

      {step !== null && (
        <section aria-labelledby="recap-title" className="flex flex-col gap-3 rounded-2xl bg-sand p-5">
          <h2 id="recap-title" className="text-lg font-semibold">
            Récapitulatif
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {lines.map((line, index) => (
              <li key={index} className="flex justify-between gap-3 py-2">
                <span className="flex flex-col">
                  <span className={line.state === "removed" ? "text-muted line-through" : ""}>
                    {line.name} × {line.quantity}
                  </span>
                  <span className={`text-xs font-semibold ${LINE_COLOR[line.state]}`}>{LINE_LABELS[line.state]}</span>
                </span>
                <span className="whitespace-nowrap font-semibold">
                  {line.amount !== null ? formatFcfa(line.amount) : "—"}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between text-sm">
            <span>Livraison</span>
            <span className="text-muted">
              {order.deliveryFee !== null ? formatFcfa(order.deliveryFee) : "Annoncés à la confirmation"}
            </span>
          </p>
          <p className="flex justify-between text-lg font-bold">
            <span>À payer à la réception</span>
            <span className="whitespace-nowrap">
              {waitingForChoice ? "Après votre choix" : formatFcfa(subtotal + (order.deliveryFee ?? 0))}
            </span>
          </p>
        </section>
      )}

      <section className="flex gap-3 rounded-2xl border border-line p-4">
        <PinIcon className="size-6 shrink-0" />
        <span className="flex flex-col">
          <strong className="font-semibold">Adresse de livraison</strong>
          <span className="text-sm text-muted">
            {order.commune} · {order.address}
          </span>
        </span>
      </section>

      {SHOP_WHATSAPP && (
        <a
          href={whatsappLink(SHOP_WHATSAPP, `Bonjour Black House, une question sur ma commande ${order.code}.`)}
          className="flex h-13 items-center justify-center gap-2 rounded-lg bg-whatsapp font-semibold text-white"
        >
          <WhatsAppIcon />
          Une question ? Écrivez-nous
        </a>
      )}
    </div>
  );
}
