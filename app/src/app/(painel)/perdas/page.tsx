import type { Metadata } from "next";
import PerdasClient from "./PerdasClient";

export const metadata: Metadata = {
  title: "Perdas — PratoCerto",
  description: "Registro e acompanhamento de perdas e desperdícios.",
};

export default function PerdasPage() {
  return <PerdasClient />;
}
