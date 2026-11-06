import Link from "next/link";
import type { ReactNode } from "react";

/** Layout simples e público das páginas legais (sem login). */
export function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-tinta">
      <Link
        href="/login"
        className="text-[14px] font-semibold text-azul-elas hover:underline"
      >
        ← Por ELAS finance
      </Link>
      <h1 className="mt-4 font-titulo text-[26px] font-bold">{titulo}</h1>
      <p className="mt-1 text-[13px] text-tinta-suave">
        Última atualização: {atualizadoEm}
      </p>
      <div className="mt-6 space-y-6 text-[15px] leading-relaxed [&_h2]:font-titulo [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-azul-elas [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}
