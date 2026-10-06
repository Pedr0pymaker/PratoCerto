import type { Metadata } from "next";
import UsuariosClient from "./UsuariosClient";

export const metadata: Metadata = {
  title: "Usuários — PratoCerto",
  description: "Gerenciamento de usuários e permissões.",
};

export default function UsuariosPage() {
  return <UsuariosClient />;
}

