import { Logo } from "@/components/brand/LogoMark";
import { AvatarUsuaria } from "@/components/nav/AvatarUsuaria";

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
      <AvatarUsuaria />
    </header>
  );
}
