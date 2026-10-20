import type { Metadata } from "next";
import { Alex_Brush, Jost, Questrial } from "next/font/google";
import { SITE_URL } from "@/site";
import "./globals.css";

// Texte du site.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

// « Black House » dans le logo.
const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin"],
  weight: "400",
});

// « Private room » dans le logo.
const questrial = Questrial({
  variable: "--font-questrial",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Black House · Private room",
  description: "Les grandes marques à prix cassés, livrées chez vous à Dakar. Paiement à la réception.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${jost.variable} ${alexBrush.variable} ${questrial.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning : des extensions de navigateur (ColorZilla…) ajoutent des attributs
          au <body> avant React ; sans ça, la console signale une fausse erreur d'hydratation.
          Ne s'applique qu'à cet élément, pas à ses enfants. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-white font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
