import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeftIcon, ClockIcon, LockIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import {
  canCancel,
  choiceRequestMessage,
  confirmationMessage,
  deadline,
  nextAction,
  shippingMessage,
  STATUS_LABELS,
  supplierQuestion,
} from "@/domain/backoffice";
import { formatFcfa } from "@/domain/money";
import { PAYMENT_METHODS } from "@/domain/order";
import { formatSenegalMobile, whatsappLink } from "@/domain/phone";
import { LINE_LABELS, trackedLine } from "@/domain/tracking";
import { requireAdmin } from "@/infra/auth";
import { SITE_URL } from "@/site";
import { getAdminOrder, replacementCandidates, type AdminOrder } from "@/infra/backoffice";
import {
  askCustomerChoice,
  cancelOrder,
  checkItem,
  chooseReplacement,
  continueWithout,
  markDelivered,
  markShipped,
} from "./actions";
import { ConfirmForm, SubmitButton } from "./forms";
import { AdminFormSkeleton } from "@/components/skeletons";


export default function AdminOrderPage(props: PageProps<"/admin/commandes/[code]">) {
  return (
    <Suspense fallback={<AdminFormSkeleton twoColumns />}>
      <OrderDetail {...props} />
    </Suspense>
  );
}

async function OrderDetail({ params }: PageProps<"/admin/commandes/[code]">) {
  // Tout le back-office dépend de la requête (session, heure courante) : rien à pré-rendre.
  await connection();
  const { supabase } = await requireAdmin();
  const { code } = await params;
  const order = await getAdminOrder(supabase, decodeURIComponent(code));

  if (!order) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Commande introuvable</h1>
        <Link href="/admin" className="mt-3 inline-block underline">
          Retour aux commandes
        </Link>
      </>
    );
  }

  const action = nextAction(order.status, order.items);
  const editable = order.status === "received" || order.status === "checking";
  const unavailableCategories = [
    ...new Set(order.items.filter((i) => i.check === "unavailable" && i.categoryId).map((i) => i.categoryId as string)),
  ];
  const candidates = editable ? await replacementCandidates(supabase, unavailableCategories) : [];
  const due = editable ? deadline(new Date(order.confirmBefore), new Date()) : null;
  const firstName = order.customerName.split(" ")[0];
  const message = customerMessage(order, firstName);
  const payment = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link href="/admin" aria-label="Retour aux commandes" className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeftIcon />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold">{order.code}</h1>
        <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold">{STATUS_LABELS[order.status]}</span>
      </div>

      {due && (
        <p
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
            due.late ? "bg-red-50 text-red-800" : "bg-[#FBF3E2] text-amber"
          }`}
        >
          <ClockIcon className="size-5" />
          À confirmer avant{" "}
          {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Africa/Dakar" }).format(
            new Date(order.confirmBefore),
          )}{" "}
          · {due.label}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
        <div>
          <h2 className="text-lg font-semibold">{order.customerName}</h2>
          <p className="text-sm text-muted">
            +221 {formatSenegalMobile(order.customerPhone)} · {payment}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:+221${order.customerPhone}`}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold"
          >
            <PhoneIcon className="size-5" />
            Appeler
          </a>
          <a
            href={whatsappLink(order.customerPhone, `Bonjour ${firstName}, c'est Black House au sujet de votre commande ${order.code}.`)}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border-[1.5px] border-whatsapp text-sm font-semibold text-whatsapp"
          >
            <WhatsAppIcon className="size-5" />
            WhatsApp
          </a>
        </div>
        <p className="flex gap-2 text-sm">
          <PinIcon className="size-5 shrink-0" />
          {order.commune} · {order.address}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-baseline justify-between text-lg font-semibold">
          Articles
          <span className="text-sm font-semibold text-muted">
            {order.items.filter((i) => i.check !== "pending").length} / {order.items.length} vérifiés
          </span>
        </h2>
        {order.items.map((item) => {
          const line = trackedLine(item);
          const options = candidates.filter((c) => c.categoryId === item.categoryId && c.id !== item.productId);
          return (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-xl border-2 bg-white p-4 ${
                item.check === "available" ? "border-whatsapp" : item.check === "unavailable" ? "border-amber" : "border-line"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div className="flex flex-col">
                  <strong className="font-semibold leading-snug">{item.name}</strong>
                  <span className="text-sm text-muted">
                    Quantité : {item.quantity} · {formatFcfa(item.unitPrice)} l&apos;unité
                  </span>
                  {!editable && <span className="text-sm font-semibold">{LINE_LABELS[line.state]}</span>}
                </div>
                <span className="whitespace-nowrap font-bold">{formatFcfa(item.unitPrice * item.quantity)}</span>
              </div>

              {item.supplier && (
                <p className="flex items-center gap-2 rounded-lg bg-sand px-3 py-2 text-sm">
                  <LockIcon className="size-4 shrink-0" />
                  <span>
                    <strong className="font-semibold">{item.supplier.name}</strong> · visible par vous seulement
                  </span>
                </p>
              )}

              {editable && (
                <>
                  {item.supplier?.whatsapp && (
                    <a
                      href={whatsappLink(item.supplier.whatsapp, supplierQuestion(item.name, item.quantity))}
                      className="flex h-11 items-center justify-center gap-2 rounded-lg border-[1.5px] border-whatsapp text-sm font-semibold text-whatsapp"
                    >
                      <WhatsAppIcon className="size-5" />
                      Demander la dispo au fournisseur
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(["available", "unavailable"] as const).map((check) => {
                      const active = item.check === check;
                      const color = check === "available" ? "bg-whatsapp border-whatsapp" : "bg-amber border-amber";
                      return (
                        <form key={check} action={checkItem}>
                          <input type="hidden" name="code" value={order.code} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="check" value={check} />
                          <SubmitButton
                            className={`h-11 w-full rounded-lg border text-sm font-semibold ${
                              active ? `${color} text-white` : "border-line bg-white"
                            }`}
                          >
                            {check === "available" ? "Disponible" : "Indisponible"}
                          </SubmitButton>
                        </form>
                      );
                    })}
                  </div>
                  {item.check === "unavailable" && (
                    <form action={chooseReplacement} className="flex flex-col gap-2">
                      <input type="hidden" name="code" value={order.code} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <label htmlFor={`replacement-${item.id}`} className="text-sm font-semibold">
                        Remplacement à proposer
                      </label>
                      <div className="flex gap-2">
                        <select
                          id={`replacement-${item.id}`}
                          name="replacementId"
                          defaultValue={item.replacementId ?? ""}
                          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 text-sm"
                        >
                          <option value="">Pas de remplacement</option>
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name} · {formatFcfa(option.price)}
                            </option>
                          ))}
                        </select>
                        <SubmitButton className="h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white">
                          Enregistrer
                        </SubmitButton>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          );
        })}
      </section>
        </div>
        <div className="flex flex-col gap-5 lg:sticky lg:top-4">
      {action.kind === "verify" && (
        <p className="rounded-lg bg-sand px-4 py-3 text-sm">
          Vérifiez {action.remaining > 1 ? `les ${action.remaining} articles restants` : "l'article restant"} pour continuer.
        </p>
      )}
      {action.kind === "confirm" && <ConfirmForm code={order.code} commune={order.commune} />}
      {action.kind === "ask-choice" && (
        <StatusForm code={order.code} action={askCustomerChoice} label="Demander son choix au client" />
      )}

      {message && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Message au client</h2>
          <p className="whitespace-pre-line rounded-xl rounded-bl-sm bg-[#E7F3EA] px-4 py-3 text-sm">{message}</p>
          <a
            href={whatsappLink(order.customerPhone, message)}
            className="flex h-13 items-center justify-center gap-2 rounded-lg bg-whatsapp font-semibold text-white"
          >
            <WhatsAppIcon />
            Envoyer sur WhatsApp
          </a>
        </section>
      )}

      {action.kind === "wait-choice" && (
        <StatusForm
          code={order.code}
          action={continueWithout}
          label="Pas de réponse sous 24 h : continuer sans"
          secondary
        />
      )}
      {action.kind === "ship" && (
        <StatusForm code={order.code} action={markShipped} label="Le client a dit OK : remis au livreur" />
      )}
      {action.kind === "deliver" && <StatusForm code={order.code} action={markDelivered} label="Livrée et payée" />}

      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="font-semibold">Historique</h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {order.events.map((event, index) => (
            <li key={index} className="flex gap-3">
              <span className="w-11 shrink-0 text-muted">
                {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Africa/Dakar" }).format(
                  new Date(event.createdAt),
                )}
              </span>
              {event.message}
            </li>
          ))}
        </ul>
      </section>

      {canCancel(order.status) && (
        <details className="text-sm">
          <summary className="cursor-pointer py-2 text-muted">Annuler la commande…</summary>
          <form action={cancelOrder} className="mt-2">
            <input type="hidden" name="code" value={order.code} />
            <SubmitButton className="h-11 w-full rounded-lg border border-red-700 font-semibold text-red-700">
              Confirmer l&apos;annulation
            </SubmitButton>
          </form>
        </details>
      )}
        </div>
      </div>
    </div>
  );
}

function StatusForm({
  code,
  action,
  label,
  secondary = false,
}: {
  code: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  secondary?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="code" value={code} />
      <SubmitButton
        className={`h-13 w-full rounded-lg font-semibold ${
          secondary ? "border-[1.5px] border-ink bg-white" : "bg-ink text-white"
        }`}
      >
        {label}
      </SubmitButton>
    </form>
  );
}

/** Message à envoyer au client selon l'étape (null s'il n'y a rien à lui dire). */
function customerMessage(order: AdminOrder, firstName: string): string | null {
  switch (order.status) {
    case "confirmed":
      return confirmationMessage({ firstName, code: order.code, items: order.items, deliveryFee: order.deliveryFee });
    case "action_required":
      return choiceRequestMessage({ firstName, code: order.code }, `${SITE_URL}/suivi/${order.trackingToken}`);
    case "shipping":
      return shippingMessage({ firstName, code: order.code });
    default:
      return null;
  }
}
