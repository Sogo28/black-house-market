import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

// TEXTE PROPOSÉ : la politique d'échange n'a pas encore été fixée avec Babacar. Ce qui suit est une
// base raisonnable (délai de 24 h, produits d'hygiène exclus) à confirmer ou corriger avant la mise en ligne.

export const metadata: Metadata = { title: "Échanges et retours · Black House" };

export default function ReturnsPage() {
  return (
    <InfoPage
      title="Échanges et retours"
      intro="Un article abîmé, incomplet ou différent de votre commande ? Nous trouvons une solution."
      sections={[
        {
          title: "À la livraison",
          paragraphs: [
            "Vérifiez votre colis devant le livreur, avant de payer. Si un article est abîmé, incomplet ou ne correspond pas à votre commande, refusez-le : vous ne payez pas cet article, et vous nous prévenez sur WhatsApp.",
          ],
        },
        {
          title: "Après la livraison",
          paragraphs: [
            "Vous avez 24 heures pour nous écrire sur WhatsApp si vous constatez un défaut. Envoyez une photo du produit et de son emballage, avec votre numéro de commande (BH-xxxx).",
            "Nous vous proposons alors un échange contre le même article, ou un autre article de même valeur.",
          ],
        },
        {
          title: "Ce qui ne peut pas être échangé",
          items: [
            "Les produits de beauté et d'hygiène ouverts ou utilisés.",
            "Le café ouvert.",
            "Les articles utilisés ou abîmés après la livraison.",
          ],
        },
        {
          title: "Si un article manque avant l'envoi",
          paragraphs: [
            "Nous vérifions chaque article avant d'envoyer votre commande. S'il n'est plus disponible, vous choisissez depuis la page de suivi : le remplacer, continuer sans lui, ou annuler. Vous ne payez jamais un article que nous n'avons pas.",
          ],
        },
      ]}
    />
  );
}
