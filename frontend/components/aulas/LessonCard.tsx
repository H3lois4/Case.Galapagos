import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { Aula } from "@/lib/types";

function formatarDuracao(seg: number): string {
  if (!seg) return "";
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LessonCard({ aula }: { aula: Aula }) {
  const duracao = formatarDuracao(aula.duracao_seg);
  return (
    <Link
      href={`/aulas/${aula.id}`}
      className="group block w-64 shrink-0 overflow-hidden rounded-card border border-borda bg-fundo shadow-[var(--sombra-card)] transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-video bg-azul-elas-suave">
        {aula.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aula.thumb_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlayCircle
              className="h-10 w-10 text-azul-elas/70"
              strokeWidth={1.5}
            />
          </div>
        )}
        {duracao && (
          <span className="absolute bottom-2 right-2 rounded-chip bg-tinta/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {duracao}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-[14px] font-semibold text-tinta group-hover:text-azul-elas">
          {aula.titulo}
        </h3>
        <p className="mt-1 truncate text-[12px] text-tinta-suave">
          {aula.autor_nome}
        </p>
      </div>
    </Link>
  );
}
