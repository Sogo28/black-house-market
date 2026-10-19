import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ADMIN_TABS, deadline, parseAdminTab, STATUS_LABELS } from "@/domain/backoffice";
import { formatFcfa } from "@/domain/money";
import { requireAdmin } from "@/infra/auth";
import { countOrdersByStatus, listOrders } from "@/infra/backoffice";

export default function OrdersPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-muted">Chargement des commandes…</p>}>
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

  return (
    <>
      <h1 className="text-2xl font-semibold">Commandes</h1>
      <nav aria-label="Statut des commandes" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ADMIN_TABS.map((t) => {
          const count = t.statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/admin?onglet=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-col justify-center rounded-xl border-2 px-3 ${
                active ? "border-ink bg-ink text-white" : "border-line bg-white"
              }`}
            >
              <span className="text-2xl font-bold leading-none">{count}</span>
              <span className="text-xs font-semibold">{t.label}</span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="mt-8 text-center text-muted">Aucune commande ici.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {orders.map((order) => {
            const toHandle = order.status === "received" || order.status === "checking";
            const due = toHandle ? deadline(new Date(order.confirmBefore), now) : null;
            return (
              <li key={order.code}>
                <Link
                  href={`/admin/commandes/${order.code}`}
                  className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4 hover:border-ink"
                >
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-lg font-semibold">{order.code}</strong>
                    {due ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          due.late ? "bg-red-50 text-red-800" : "bg-[#FBF3E2] text-amber"
                        }`}
                      >
                        {due.label}
                      </span>
                    ) : (
                      <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold">
                        {STATUS_LABELS[order.status]}
                      </span>
                    )}
                  </span>
                  <span>
                    {order.customerName} · {order.commune}
                  </span>
                  <span className="flex justify-between text-sm text-muted">
                    <span>
                      {order.itemCount} article{order.itemCount > 1 ? "s" : ""} · {formatFcfa(order.total)}
                    </span>
                    {toHandle && (
                      <span className="font-semibold">
                        {order.checked} / {order.lines} vérifié{order.checked > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
