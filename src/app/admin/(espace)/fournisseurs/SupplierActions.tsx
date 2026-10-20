import { WhatsAppIcon } from "@/components/icons";
import { whatsappLink } from "@/domain/phone";
import { supplierListMessage } from "@/domain/products";
import { confirmSupplier } from "../produits/actions";
import { StatusSubmit } from "../produits/StatusSubmit";

type SupplierActionsProps = {
  supplier: { id: string; name: string; whatsapp: string | null };
  /** Produits de ce fournisseur : ils composent le message « Envoyer la liste ». */
  items: { name: string; price?: number }[];
};

/** Les deux gestes du quotidien avec un fournisseur : tout confirmer, ou lui envoyer la liste sur WhatsApp. */
export function SupplierActions({ supplier, items }: SupplierActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={confirmSupplier}>
        <input type="hidden" name="supplierId" value={supplier.id} />
        <StatusSubmit className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-semibold">Tout confirmé par le fournisseur</StatusSubmit>
      </form>
      {supplier.whatsapp && (
        <a
          href={whatsappLink(supplier.whatsapp, supplierListMessage(items))}
          aria-label={`Envoyer la liste à ${supplier.name} sur WhatsApp`}
          className="flex h-11 items-center gap-1.5 rounded-lg border-[1.5px] border-whatsapp px-3 text-sm font-semibold text-whatsapp"
        >
          <WhatsAppIcon className="size-5" />
          Envoyer la liste
        </a>
      )}
    </div>
  );
}
