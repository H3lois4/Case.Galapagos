"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { navItems } from "./navItems";

/** Barra inferior fixa (celular). Escondida a partir de md:. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-fundo shadow-[0_-1px_12px_rgba(26,29,43,0.05)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between">
        {navItems.map(({ href, rotulo, Icone }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors",
                  ativo ? "text-rosa-elas-texto" : "text-tinta-suave",
                )}
              >
                <Icone
                  className="h-6 w-6"
                  strokeWidth={ativo ? 2 : 1.75}
                  aria-hidden="true"
                />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
