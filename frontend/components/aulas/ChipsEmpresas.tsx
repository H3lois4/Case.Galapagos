"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EmpresaComAulas } from "@/lib/types";

export type FiltroAulas =
  | { tipo: "todas" }
  | { tipo: "ia" }
  | { tipo: "empresa"; slug: string };

interface Props {
  empresas: EmpresaComAulas[];
  temIa: boolean;
  filtro: FiltroAulas;
  onSelecionar: (f: FiltroAulas) => void;
}

export function ChipsEmpresas({ empresas, temIa, filtro, onSelecionar }: Props) {
  const ativo = (f: FiltroAulas) =>
    f.tipo === filtro.tipo &&
    (f.tipo !== "empresa" ||
      (filtro.tipo === "empresa" && f.slug === filtro.slug));

  const classeChip = (isAtivo: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-[13px] font-semibold transition-colors",
      isAtivo
        ? "border-azul-elas bg-azul-elas text-white"
        : "border-borda bg-fundo text-tinta-suave hover:border-azul-elas/60 hover:text-tinta",
    );

  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filtrar aulas por empresa"
    >
      <button
        type="button"
        role="tab"
        aria-selected={ativo({ tipo: "todas" })}
        className={classeChip(ativo({ tipo: "todas" }))}
        onClick={() => onSelecionar({ tipo: "todas" })}
      >
        Todas
      </button>

      {temIa && (
        <button
          type="button"
          role="tab"
          aria-selected={ativo({ tipo: "ia" })}
          className={classeChip(ativo({ tipo: "ia" }))}
          onClick={() => onSelecionar({ tipo: "ia" })}
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.75} /> IA Por ELAS
        </button>
      )}

      {empresas.map((e) => {
        const isAtivo = ativo({ tipo: "empresa", slug: e.slug });
        return (
          <button
            key={e.slug}
            type="button"
            role="tab"
            aria-selected={isAtivo}
            className={classeChip(isAtivo)}
            onClick={() => onSelecionar({ tipo: "empresa", slug: e.slug })}
          >
            {e.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={e.logo}
                alt=""
                className="h-5 w-5 rounded-pill object-cover"
              />
            ) : (
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-pill text-[10px] font-bold",
                  isAtivo ? "bg-white/20 text-white" : "bg-azul-elas-suave text-azul-elas",
                )}
              >
                {e.nome.charAt(0).toUpperCase()}
              </span>
            )}
            {e.nome}
          </button>
        );
      })}
    </div>
  );
}
