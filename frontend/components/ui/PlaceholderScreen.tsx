import type { LucideIcon } from "lucide-react";

/**
 * Tela placeholder usada nas rotas da fundação. Cada seção real é
 * construída nas próximas etapas do projeto.
 */
export function PlaceholderScreen({
  titulo,
  descricao,
  Icone,
}: {
  titulo: string;
  descricao: string;
  Icone?: LucideIcon;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {Icone && (
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
          <Icone className="h-7 w-7" strokeWidth={1.75} />
        </span>
      )}
      <h1 className="font-titulo text-[28px] font-bold leading-tight text-tinta">
        {titulo}
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-tinta-suave">
        {descricao}
      </p>
      <span className="mt-6 inline-flex items-center gap-2 rounded-pill bg-rosa-elas-suave px-4 py-1.5 text-[13px] font-semibold text-rosa-elas-texto">
        Em construção · próxima etapa
      </span>
    </div>
  );
}
