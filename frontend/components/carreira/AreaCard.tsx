import { Compass } from "lucide-react";
import type { AreaResumo } from "@/lib/types";

export function AreaCard({
  area,
  onAbrir,
}: {
  area: AreaResumo;
  onAbrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex h-full flex-col rounded-card border border-borda bg-fundo p-4 text-left shadow-[var(--sombra-card)] transition-transform hover:-translate-y-0.5 hover:border-azul-elas/50"
    >
      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
        <Compass className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="font-titulo text-[15px] font-semibold text-tinta">{area.nome}</h3>
      <p className="mt-1 text-[13px] leading-snug text-tinta-suave">{area.resumo}</p>
    </button>
  );
}
