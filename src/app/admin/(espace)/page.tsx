import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BagIcon, ChevronRightIcon, ClockIcon } from "@/components/icons";
import { ADMIN_TABS, ageLabel, deadline, parseAdminTab, STATUS_LABELS } from "@/domain/backoffice";
import { formatFcfa } from "@/domain/money";
import type { OrderStatus } from "@/domain/tracking";
import { requireAdmin } from "@/infra/auth";
import { countOrdersByStatus, listOrders, type AdminOrderRow } from "@/infra/backoffice";
import { productImageUrl } from "@/infra/catalogue";
import { AdminOrdersSkeleton } from "@/components/skeletons";

const MAX_THUMBS = 3;

// Couleur du badge de statut. Les commandes à traiter affichent plutôt leur délai (voir plus bas).
const BADGE: Record<OrderStatus, string> = {
  received: "bg-[#FBF3E2] text-amber",
  checking: "bg-[#FBF3E2] text-amber",
  action_required: "bg-[#FBF3E2] text-amber",
  confirmed: "bg-sand text-ink",
  shipping: "bg-ink text-white",
  delivered: "bg-[#E6F2EA] text-[#146B3E]",
  cancelled: "bg-sand text-muted",
};

const EMPTY: Record<string, string> = {
  "a-traiter": "Rien à traiter pour le moment : tout est à jour.",
  "attente-client": "Aucune commande n'attend le client.",
  "en-livraison": "Aucune commande chez le livreur.",
  terminees: "Aucune commande terminée pour l'instant.",
};

export default function OrdersPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminOrdersSkeleton />}>
      <OrdersBoard {...props} />
    </Suspense>
  );
}

async function OrdersBoard({ searchParams }: PageProps<"/admin">) {
  // Tout le back-office dépend de la requête (session, heure courante) : rien à pré-rendre.
  await connection();
  const { supabase } = await requireAdmin();
  const tab = parseAdminTab((await searchParams).onglet);
  const current = ADMIN_TABS.find((t) => t.key === tab) ?? ADMIN_TABS[0];
  const [counts, orders] = await Promise.all([countOrdersByStatus(supabase), listOrders(supabase, current.statuses)]);
  const now = new Date();

  const isToHandle = (order: AdminOrderRow) => order.status === "received" || order.status === "checking";
  const late = tab === "a-traiter" ? orders.filter((o) => deadline(new Date(o.confirmBefore), now).late).length : 0;
  const tabCount = (statuses: OrderStatus[]) => statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

  return (
    <>
      <h1 className="text-2xl font-semibold">Commandes</h1>

      <nav aria-label="Statut des commandes" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {ADMIN_TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={t.key === "a-traiter" ? "/admin" : `/admin?onglet=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
                active ? "border-ink bg-ink text-white" : "border-line bg-white"
              }`}
            >
              {t.label} ({tabCount(t.statuses)})
            </Link>
          );
        })}
      </nav>

      {late > 0 && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-800">
          <ClockIcon className="size-5 shrink-0" />
          {late} commande{late > 1 ? "s" : ""} en retard sur le délai de 2 h : à traiter en premier.
        </p>
      )}

      {orders.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-white px-4 py-12 text-center text-muted">
          {EMPTY[tab]}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {orders.map((order) => {
            const toHandle = isToHandle(order);
            const due = toHandle ? deadline(new Date(order.confirmBefore), now) : null;
            const badgeClass = due ? (due.late ? "bg-red-50 text-red-800" : "bg-[#FBF3E2] text-amber") : BADGE[order.status];
            const shown = order.thumbs.slice(0, MAX_THUMBS);
            const hidden = order.thumbs.length - shown.length;
            const progress = order.lines > 0 ? Math.round((order.checked / order.lines) * 100) : 0;

            return (
              <li key={order.code}>
                <Link
                  href={`/admin/commandes/${order.code}`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ink lg:grid lg:grid-cols-[minmax(0,1fr)_13rem_8.5rem_11.5rem_1.25rem]"
                >
                  <span className="flex min-w-0 basis-full items-center gap-4">
                    <span className="flex shrink-0 -space-x-3 lg:w-36" aria-hidden="true">
                      {shown.map((path, index) => (
                        <span
                          key={index}
                          className="relative size-14 overflow-hidden rounded-xl bg-sand ring-2 ring-white"
                        >
                          {path ? (
                            <Image src={productImageUrl(path)} alt="" fill sizes="56px" className="object-cover" />
                          ) : (
                            <BagIcon className="absolute inset-0 m-auto size-6 text-muted" />
                          )}
                        </span>
                      ))}
                      {hidden > 0 && (
                        <span className="relative flex size-14 items-center justify-center rounded-xl bg-sand text-sm font-bold ring-2 ring-white">
                          +{hidden}
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <strong className="text-lg font-semibold leading-tight group-hover:underline">{order.code}</strong>
                      <span className="truncate text-muted">
                        {order.customerName} · {order.commune}
                      </span>
                    </span>
                  </span>

                  <span className="flex min-w-0 basis-full flex-col gap-1.5 whitespace-nowrap text-sm lg:basis-auto">
                    <span className="text-muted">
                      {order.itemCount} article{order.itemCount > 1 ? "s" : ""} · {ageLabel(new Date(order.createdAt), now)}
                    </span>
                    {toHandle && (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line" aria-hidden="true">
                          <span className="block h-full rounded-full bg-ink" style={{ width: `${progress}%` }} />
                        </span>
                        <span className="font-semibold">
                          {order.checked} / {order.lines} vérifié{order.checked > 1 ? "s" : ""}
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="flex-1 whitespace-nowrap text-lg font-bold lg:flex-none lg:text-right">{formatFcfa(order.total)}</span>

                  <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-center text-sm font-semibold ${badgeClass}`}>
                    {due ? due.label : STATUS_LABELS[order.status]}
                  </span>

                  <ChevronRightIcon className="hidden size-5 shrink-0 text-muted group-hover:text-ink lg:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
