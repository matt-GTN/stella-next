// src/app/layout.js - Updated version using Next.js Script
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SearchProvider } from "@/contexts/SearchContext";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stella - Analyste financier IA",
  description: "Stella, spécialiste financière, vous permet de faire de la gestion de risques et de la génération de données directement en langage naturel, sans connaissances préalables.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cream-200`}
      >
        <LanguageProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}