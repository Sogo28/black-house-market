import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

// TEXTE PROPOSÉ : zones, délais et frais sont ceux du site (messages de disponibilité, formulaire
// de commande). À faire valider par Babacar avant la mise en ligne.

export const metadata: Metadata = { title: "Livraison · Black House" };

export default function DeliveryPage() {
  return (
    <InfoPage
      title="Livraison"
      intro="Vos commandes sont livrées à domicile, et vous ne payez qu'à la réception."
      sections={[
        {
          title: "Où livrons-nous ?",
          paragraphs: [
            "Nous livrons à Dakar et dans sa banlieue. Choisissez votre commune ou votre quartier dans le formulaire de commande.",
            "Votre quartier n'apparaît pas ? Choisissez « Autre » et décrivez votre adresse : nous vous disons si la livraison est possible.",
          ],
        },
        {
          title: "Quels délais ?",
          items: [
            "Produit « Disponible » : prêt à partir, livraison sous 24 à 48 h après la confirmation de votre commande.",
            "Produit « Sur commande » : nous confirmons sa disponibilité sous 2 h, puis la livraison se fait sous 3 à 5 jours.",
          ],
          paragraphs: ["Les délais commencent à la confirmation de votre commande sur WhatsApp, pas à l'envoi du formulaire."],
        },
        {
          title: "Combien ça coûte ?",
          paragraphs: [
            "Les frais de livraison dépendent de votre quartier. Nous vous les annonçons avec le total, lors de la confirmation sur WhatsApp : vous savez exactement ce que vous paierez avant que la livraison ne parte.",
            "Vous réglez les articles et la livraison ensemble, au livreur, en espèces, par Wave ou par Orange Money.",
          ],
        },
        {
          title: "Le jour de la livraison",
          items: [
            "Le livreur vous appelle avant d'arriver : restez joignable sur le numéro donné à la commande.",
            "Vérifiez votre colis devant lui avant de payer.",
            "Donnez un point de repère précis (boutique, pharmacie, mosquée…) : cela accélère la livraison.",
          ],
        },
      ]}
    />
  );
}
