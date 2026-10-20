import type { Metadata } from "next";
import AlertasClient from "./AlertasClient";

export const metadata: Metadata = {
  title: "Alertas — PratoCerto",
  description: "Acompanhe estoque mínimo e validade dos lotes.",
};

export default function AlertasPage() {
  return <AlertasClient />;
}
