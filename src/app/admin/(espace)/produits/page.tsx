import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PlusIcon, WhatsAppIcon } from "@/components/icons";
import type { ProductStatus } from "@/domain/availability";
import { formatFcfa } from "@/domain/money";
import { whatsappLink } from "@/domain/phone";
import { checkedLabel, needsRecheck, STATUS_OPTIONS, supplierListMessage } from "@/domain/products";
import { requireAdmin } from "@/infra/auth";
import { countPendingAlerts, listAdminProducts, type AdminProductRow } from "@/infra/adminProducts";
import { productImageUrl } from "@/infra/catalogue";
import { confirmSupplier } from "./actions";
import { StatusSubmit } from "./StatusSubmit";

const FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "a-reverifier", label: "À revérifier" },
  { key: "dispo", label: "Disponibles" },
  { key: "sur-commande", label: "Sur commande" },
  { key: "epuises", label: "Épuisés" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_STYLE: Record<ProductStatus, { text: string; dot: string }> = {
  available: { text: "text-whatsapp", dot: "bg-whatsapp" },
  on_order: { text: "text-amber", dot: "bg-amber" },
  sold_out: { text: "text-muted", dot: "bg-muted" },
};

export default function ProductsPage(props: PageProps<"/admin/produits">) {
  return (
    <Suspense fallback={<p className="text-muted">Chargement des produits…</p>}>
      <ProductsBoard {...props} />
    </Suspense>
  );
}

async function ProductsBoard({ searchParams }: PageProps<"/admin/produits">) {
  // Tout le back-office dépend de la requête (session, heure courante) : rien à pré-rendre.
  await connection();
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const filter: FilterKey = FILTERS.find((f) => f.key === query.filtre)?.key ?? "tous";
  const [products, alerts] = await Promise.all([listAdminProducts(supabase), countPendingAlerts(supabase)]);
  const now = new Date();

  const stale = (p: AdminProductRow) => needsRecheck(p.status, p.lastCheckedAt ? new Date(p.lastCheckedAt) : null, now);
  const tests: Record<FilterKey, (p: AdminProductRow) => boolean> = {
    tous: () => true,
    "a-reverifier": stale,
    dispo: (p) => p.status === "available",
    "sur-commande": (p) => p.status === "on_order",
    epuises: (p) => p.status === "sold_out",
  };
  const staleCount = products.filter(stale).length;
  const visible = products.filter(tests[filter]);

  const groups = new Map<string, { id: string | null; name: string; whatsapp: string | null; items: AdminProductRow[] }>();
  for (const p of visible) {
    const key = p.supplierId ?? "none";
    const group = groups.get(key) ?? { id: p.supplierId, name: p.supplierName ?? "Sans fournisseur", whatsapp: p.supplierWhatsapp, items: [] };
    group.items.push(p);
    groups.set(key, group);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <Link href="/admin/produits/nouveau" className="flex h-11 items-center gap-1.5 rounded-lg bg-gold px-4 font-semibold text-ink">
          <PlusIcon className="size-5" />
          Ajouter
        </Link>
      </div>

      {staleCount > 0 && filter !== "a-reverifier" && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E9D3A4] bg-[#FBF3E2] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <strong className="font-semibold">
              {staleCount} produit{staleCount > 1 ? "s" : ""} non vérifié{staleCount > 1 ? "s" : ""} depuis plus de 3 jours.
            </strong>{" "}
            Sur le site, {staleCount > 1 ? "ils s'affichent" : "il s'affiche"} « Sur commande » jusqu&apos;à votre prochaine vérification.
          </p>
          <Link
            href="/admin/produits?filtre=a-reverifier"
            className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-ink px-4 font-semibold text-white"
          >
            Voir les produits à revérifier
          </Link>
        </div>
      )}

      <nav aria-label="Filtrer les produits" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const count = products.filter(tests[f.key]).length;
          return (
            <Link
              key={f.key}
              href={f.key === "tous" ? "/admin/produits" : `/admin/produits?filtre=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
                active ? "border-ink bg-ink text-white" : "border-line bg-white"
              }`}
            >
              {f.label} ({count})
            </Link>
          );
        })}
      </nav>

      {groups.size === 0 && <p className="mt-8 text-center text-muted">Aucun produit ici.</p>}

      {[...groups.values()].map((group) => (
        <section key={group.id ?? "none"} aria-label={group.name} className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <span className="text-xs text-muted">
                {group.items.length} produit{group.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.id && (
                <form action={confirmSupplier}>
                  <input type="hidden" name="supplierId" value={group.id} />
                  <StatusSubmit className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-semibold">
                    Tout confirmé par le fournisseur
                  </StatusSubmit>
                </form>
              )}
              {group.whatsapp && (
                <a
                  href={whatsappLink(group.whatsapp, supplierListMessage(group.items))}
                  aria-label={`Envoyer la liste à ${group.name} sur WhatsApp`}
                  className="flex h-11 items-center gap-1.5 rounded-lg border-[1.5px] border-whatsapp px-3 text-sm font-semibold text-whatsapp"
                >
                  <WhatsAppIcon className="size-5" />
                  Envoyer la liste
                </a>
              )}
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
            {group.items.map((p) => {
              const isStale = stale(p);
              const style = STATUS_STYLE[p.status];
              const label = STATUS_OPTIONS.find((o) => o.value === p.status)?.label;
              const waiting = alerts[p.id] ?? 0;
              return (
                <li key={p.id}>
                  <Link href={`/admin/produits/${p.id}`} className="group flex flex-col gap-2">
                    <span className="relative block aspect-square overflow-hidden rounded-2xl bg-sand group-hover:ring-2 group-hover:ring-ink">
                      {p.mainImage ? (
                        <Image
                          src={productImageUrl(p.mainImage)}
                          alt=""
                          fill
                          sizes="(min-width: 1280px) 220px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-sm text-muted">Sans photo</span>
                      )}
                      {!p.isPublished && (
                        <span className="absolute left-2 top-2 rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">Masqué</span>
                      )}
                      {waiting > 0 && (
                        <span className="absolute right-2 top-2 rounded-md bg-gold px-2 py-1 text-xs font-bold text-ink">
                          {waiting} en attente
                        </span>
                      )}
                    </span>
                    <span className="font-medium leading-snug group-hover:underline">{p.name}</span>
                    <span className="font-bold">{formatFcfa(p.price)}</span>
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${style.text}`}>
                      <span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" />
                      {label}
                    </span>
                    <span className={`text-xs ${isStale ? "font-semibold text-amber" : "text-muted"}`}>
                      {checkedLabel(p.lastCheckedAt ? new Date(p.lastCheckedAt) : null, now)}
                      {isStale && " · affiché « Sur commande »"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="mt-10 text-center text-xs text-muted">
        La disponibilité de chaque produit se règle dans sa fiche : cliquez sur un produit.
      </p>
    </>
  );
}
