import type { Metadata } from "next";
import { Alex_Brush, Jost, Questrial } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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
  title: "Black House · Private room",
  description: "Les grandes marques à prix cassés, livrées chez vous à Dakar. Paiement à la réception.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${jost.variable} ${alexBrush.variable} ${questrial.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-ink">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
