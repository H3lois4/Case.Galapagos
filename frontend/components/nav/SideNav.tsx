"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/LogoMark";
import { navItems } from "./navItems";

/** Menu lateral (desktop). Visível a partir de md:. */
export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-borda bg-fundo px-3 py-5 md:flex">
      <div className="mb-5 px-2">
        <Logo />
      </div>
      <nav aria-label="Navegação principal">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, rotulo, Icone }) => {
            const ativo = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-botao px-3 py-2.5 text-[14px] font-semibold transition-colors",
                    ativo
                      ? "bg-azul-elas-suave text-azul-elas"
                      : "text-tinta-suave hover:bg-fundo-alt",
                  )}
                >
                  {ativo && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-pill bg-rosa-elas" />
                  )}
                  <Icone
                    className="h-[18px] w-[18px]"
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
    </aside>
  );
}
