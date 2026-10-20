// Squelettes de chargement : même silhouette que la page qui arrive, pour que rien ne saute.
// Chaque page les place en `fallback` de son <Suspense>.

/** Un bloc gris qui pulse. Décoratif : le texte « Chargement » est porté par <SkeletonRegion>. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-line/70 motion-reduce:animate-none ${className}`} />;
}

/** Enveloppe d'un squelette : annonce le chargement aux lecteurs d'écran. */
export function SkeletonRegion({ label = "Chargement…", className = "", children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const repeat = (count: number) => Array.from({ length: count }, (_, i) => i);

/** Grille de cartes produit de la boutique (accueil, catégorie, recherche). */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {repeat(count).map((i) => (
        <li key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-11 w-full" />
        </li>
      ))}
    </ul>
  );
}

/** Page catégorie / recherche : titre, ligne de tri, grille. */
export function ListingPageSkeleton() {
  return (
    <SkeletonRegion className="flex flex-col gap-6 pt-2">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
      <ProductGridSkeleton />
    </SkeletonRegion>
  );
}

/** Fiche produit de la boutique. */
export function ProductPageSkeleton() {
  return (
    <SkeletonRegion className="flex flex-col gap-6 pt-2">
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Page d'une commande (suivi client, remerciements) : colonne étroite. */
export function OrderPageSkeleton() {
  return (
    <SkeletonRegion className="flex flex-col gap-5 pt-2">
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-24 w-full rounded-xl" />
      {repeat(3).map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </SkeletonRegion>
  );
}

/** Page panier : lignes d'articles à gauche, formulaire à droite. */
export function CartPageSkeleton() {
  return (
    <SkeletonRegion className="flex flex-wrap items-start gap-x-10 gap-y-8">
      <div className="flex flex-[1.4_1_340px] flex-col gap-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-48" />
        {repeat(2).map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-20 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-11 w-32" />
            </div>
          </div>
        ))}
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-64 flex-[1_1_300px] rounded-2xl" />
    </SkeletonRegion>
  );
}

// --- Back-office ----------------------------------------------------------------------------

function TitleBar({ withButton = true }: { withButton?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-8 w-44" />
      {withButton && <Skeleton className="h-11 w-28" />}
    </div>
  );
}

/** Liste des commandes : titre, onglets, cartes. */
export function AdminOrdersSkeleton() {
  return (
    <SkeletonRegion label="Chargement des commandes…" className="flex flex-col gap-4">
      <TitleBar withButton={false} />
      <div className="flex gap-2">
        {repeat(4).map((i) => (
          <Skeleton key={i} className="h-11 w-32 shrink-0 rounded-full" />
        ))}
      </div>
      {repeat(4).map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </SkeletonRegion>
  );
}

/** Grille de produits du back-office, avec ses deux rangées de filtres. */
export function AdminProductsSkeleton() {
  return (
    <SkeletonRegion label="Chargement des produits…" className="flex flex-col gap-4">
      <TitleBar />
      <div className="flex gap-2">
        {repeat(5).map((i) => (
          <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-11 w-72 rounded-full" />
      <ul aria-hidden="true" className="mt-2 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
        {repeat(10).map((i) => (
          <li key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

/** Grille de cartes du back-office (catégories avec image, fournisseurs sans). */
export function AdminCardGridSkeleton({ label, withImage }: { label: string; withImage: boolean }) {
  return (
    <SkeletonRegion label={label} className="flex flex-col gap-4">
      <TitleBar />
      <Skeleton className="h-5 w-2/3 max-w-xl" />
      <ul aria-hidden="true" className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repeat(6).map((i) =>
          withImage ? (
            <li key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </li>
          ) : (
            <li key={i} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </li>
          ),
        )}
      </ul>
    </SkeletonRegion>
  );
}

/** Page de formulaire ou de détail du back-office : titre avec retour, puis des champs. */
export function AdminFormSkeleton({ twoColumns = false }: { twoColumns?: boolean }) {
  const card = (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4">
      {repeat(4).map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </div>
  );
  return (
    <SkeletonRegion className={`flex flex-col gap-5 ${twoColumns ? "" : "mx-auto w-full max-w-2xl"}`}>
      <div className="flex items-center gap-2">
        <Skeleton className="size-11" />
        <Skeleton className="h-8 w-56" />
      </div>
      {twoColumns ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {card}
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        card
      )}
    </SkeletonRegion>
  );
}
