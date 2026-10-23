"use client";

import Link from "next/link";
import { Sparkles, Building2, User } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AutorPost } from "@/lib/types";

/** Gradiente por categoria de notícia (sem imagem externa). */
export const GRADIENTE_CATEGORIA: Record<string, string> = {
  juros: "from-azul-elas to-azul-elas-escuro",
  bolsa: "from-sucesso to-azul-elas",
  cambio: "from-alerta to-rosa-elas",
  cripto: "from-tinta to-azul-elas",
  carreira: "from-rosa-elas to-azul-elas",
  economia: "from-azul-elas to-rosa-elas",
};

export function gradienteCategoria(cat: string): string {
  return GRADIENTE_CATEGORIA[cat] ?? GRADIENTE_CATEGORIA.economia;
}

export function dataCurta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

/** Avatar + nome do autor, com selo por tipo. Link para o perfil quando houver. */
export function SeloAutor({ autor }: { autor: AutorPost }) {
  const inicial = (autor.nome || "?").charAt(0).toUpperCase();
  const Icone = autor.tipo === "ia" ? Sparkles : autor.tipo === "empresa" ? Building2 : User;

  const conteudo = (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center overflow-hidden rounded-pill text-sm font-bold text-white",
          autor.tipo === "ia"
            ? "bg-gradient-to-br from-rosa-elas to-azul-elas"
            : "bg-azul-elas",
        )}
      >
        {autor.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={autor.foto} alt="" className="h-full w-full object-cover" />
        ) : (
          inicial
        )}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[14px] font-semibold text-tinta">
          {autor.nome}
          <Icone
            className={cn(
              "h-3.5 w-3.5",
              autor.tipo === "ia" ? "text-rosa-elas-texto" : "text-azul-elas",
            )}
            strokeWidth={2}
          />
        </span>
        {autor.username && (
          <span className="block text-[12px] text-tinta-suave">@{autor.username}</span>
        )}
        {autor.tipo === "ia" && (
          <span className="block text-[12px] text-tinta-suave">IA Por ELAS</span>
        )}
      </span>
    </span>
  );

  if (autor.username) {
    return (
      <Link href={`/u/${autor.username}`} className="hover:opacity-80">
        {conteudo}
      </Link>
    );
  }
  return conteudo;
}
