import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "PratoCerto — Gestão de Estoque para Restaurantes",
  description:
    "Sistema de gestão inteligente de estoque para restaurantes, lanchonetes e padarias. Controle perdas, validade, compras e muito mais.",
  keywords: [
    "gestão de estoque",
    "restaurante",
    "controle de perdas",
    "validade",
    "padaria",
    "lanchonete",
  ],
  authors: [{ name: "PratoCerto" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
