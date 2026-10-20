import type { Metadata } from "next";
import ComprasClient from "./ComprasClient";

export const metadata: Metadata = {
  title: "Compras — PratoCerto",
  description: "Crie pedidos de compra e receba os itens diretamente no estoque.",
};

export default function ComprasPage() {
  return <ComprasClient />;
}
