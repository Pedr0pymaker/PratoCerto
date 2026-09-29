import type { Metadata } from "next";
import EstoqueClient from "./EstoqueClient";

export const metadata: Metadata = {
  title: "Estoque — PratoCerto",
  description: "Controle de estoque e cadastro de produtos.",
};

export default function EstoquePage() {
  return <EstoqueClient />;
}

