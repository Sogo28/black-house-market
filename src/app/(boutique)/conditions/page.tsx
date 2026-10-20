import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

// TEXTE PROPOSÉ : il décrit le fonctionnement réel du site. Les informations légales de la boutique
// (raison sociale, adresse, numéro d'immatriculation) ne sont pas renseignées : à compléter avec Babacar
// avant la mise en ligne.

export const metadata: Metadata = { title: "Conditions de vente · Black House" };

export default function TermsPage() {
  return (
    <InfoPage
      title="Conditions de vente"
      intro="Voici, simplement, comment fonctionne une commande sur Black House."
      sections={[
        {
          title: "Passer commande",
          paragraphs: [
            "Aucun compte n'est nécessaire. Vous choisissez vos articles, puis vous envoyez votre commande avec votre nom, votre numéro WhatsApp et votre adresse.",
            "L'envoi du formulaire est une demande de commande : elle n'est définitive qu'après notre confirmation sur WhatsApp et votre réponse « OK ».",
          ],
        },
        {
          title: "Disponibilité et prix",
          paragraphs: [
            "Les prix sont indiqués en francs CFA. Nous vérifions la disponibilité de chaque article avant de confirmer votre commande. Le prix affiché au moment de votre commande est celui que vous payez.",
            "Si un article n'est plus disponible, vous choisissez de le remplacer, de continuer sans lui ou d'annuler. Sans réponse de votre part sous 24 heures, nous poursuivons la commande sans cet article.",
          ],
        },
        {
          title: "Paiement",
          paragraphs: [
            "Aucun paiement n'est demandé en ligne. Vous payez à la réception, au livreur, en espèces, par Wave ou par Orange Money. Le montant total, frais de livraison compris, vous est annoncé avant l'envoi.",
          ],
        },
        {
          title: "Annulation",
          paragraphs: [
            "Vous pouvez annuler votre commande à tout moment avant sa remise au livreur : écrivez-nous sur WhatsApp avec votre numéro de commande, ou choisissez « Annuler » sur votre page de suivi quand elle vous le propose.",
          ],
        },
        {
          title: "Livraison, échanges et retours",
          paragraphs: ["Les délais, les frais et les conditions d'échange sont détaillés sur les pages Livraison et Échanges et retours."],
        },
        {
          title: "Vos données personnelles",
          paragraphs: [
            "Votre nom, votre numéro de téléphone et votre adresse servent uniquement à traiter votre commande, à la livrer et à vous contacter à son sujet. Ils ne sont ni vendus ni transmis à des tiers, hormis le livreur pour la livraison.",
            "Si vous demandez à être prévenu du retour d'un produit, votre numéro sert uniquement à ce message. Pour faire effacer vos données, écrivez-nous sur WhatsApp.",
          ],
        },
      ]}
    />
  );
}
