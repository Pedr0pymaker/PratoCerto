import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — PratoCerto",
  description: "Visão geral do estoque, alertas e indicadores do seu estabelecimento.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
