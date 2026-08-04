import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PasoCRM — Dormiluna",
  description: "Seguimiento de prospectos y clientes para Dormiluna",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`dark ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
