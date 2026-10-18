import Link from "next/link";
import { Logo } from "@/components/brand/LogoMark";

/**
 * Topo do app. No celular mostra a logo + avatar.
 * No desktop a logo fica no menu lateral, então aqui só o avatar.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-borda bg-fundo/95 px-4 py-3 backdrop-blur">
      <div className="md:hidden">
        <Logo />
      </div>
      <div className="hidden md:block" />
      <Link
        href="/perfil"
        aria-label="Abrir perfil"
        className="flex h-10 w-10 items-center justify-center rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas text-sm font-bold text-white"
      >
        H
      </Link>
    </header>
  );
}
