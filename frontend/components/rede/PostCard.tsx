"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Trash2,
  Briefcase,
  ExternalLink,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { apiAuth, apiAuthJson } from "@/lib/api";
import { SeloAutor, dataCurta, gradienteCategoria } from "./comum";
import { Comentarios } from "./Comentarios";
import { BotaoCompartilhar } from "./BotaoCompartilhar";
import type { Post } from "@/lib/types";

export function PostCard({
  post,
  onExcluido,
}: {
  post: Post;
  onExcluido: (id: number) => void;
}) {
  const [curtiu, setCurtiu] = useState(post.curtiu);
  const [curtidas, setCurtidas] = useState(post.curtidas_count);
  const [comentarios, setComentarios] = useState(post.comentarios_count);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);

  async function curtir() {
    // otimista
    setCurtiu((v) => !v);
    setCurtidas((n) => n + (curtiu ? -1 : 1));
    const r = await apiAuthJson<{ curtiu: boolean; curtidas_count: number }>(
      `/api/rede/posts/${post.id}/curtir/`,
      { method: "POST" },
    ).catch(() => null);
    if (r) {
      setCurtiu(r.curtiu);
      setCurtidas(r.curtidas_count);
    }
  }

  async function excluir() {
    if (!confirm("Excluir este post?")) return;
    const res = await apiAuth(`/api/rede/posts/${post.id}/`, { method: "DELETE" });
    if (res.ok) onExcluido(post.id);
  }

  return (
    <article className="rounded-card border border-borda bg-fundo p-4 shadow-[var(--sombra-card)]">
      <div className="flex items-start justify-between gap-3">
        <SeloAutor autor={post.autor} />
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-tinta-suave">{dataCurta(post.criado_em)}</span>
          {post.pode_excluir && (
            <button
              onClick={excluir}
              aria-label="Excluir post"
              className="text-tinta-suave hover:text-perigo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notícia */}
      {post.tipo === "noticia" && (
        <Link href={`/post/${post.id}`} className="mt-3 block">
          {post.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imagem_url}
              alt=""
              className="aspect-video w-full rounded-card object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex aspect-video w-full items-center justify-center rounded-card bg-gradient-to-br text-white",
                gradienteCategoria(post.categoria),
              )}
            >
              <Newspaper className="h-10 w-10 opacity-80" strokeWidth={1.5} />
            </div>
          )}
          <h3 className="mt-2 font-titulo text-[16px] font-semibold text-tinta">
            {post.titulo}
          </h3>
        </Link>
      )}

      {/* Vaga */}
      {post.tipo === "vaga" && (
        <div className="mt-3 rounded-card border border-azul-elas/30 bg-azul-elas-suave/50 p-3">
          <p className="inline-flex items-center gap-1.5 font-semibold text-tinta">
            <Briefcase className="h-4 w-4 text-azul-elas" /> {post.vaga_cargo}
          </p>
          {post.vaga_local && (
            <p className="text-[13px] text-tinta-suave">{post.vaga_local}</p>
          )}
          {post.vaga_link && (
            <a
              href={post.vaga_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-azul-elas hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Candidatar-se
            </a>
          )}
        </div>
      )}

      {/* Texto */}
      {post.texto && (
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-tinta">
          {post.texto}
        </p>
      )}

      {/* Imagem de post comum */}
      {post.tipo === "post" && post.imagem_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imagem_url}
          alt=""
          className="mt-3 w-full rounded-card object-cover"
        />
      )}

      {post.tipo === "noticia" && post.fonte_url && (
        <a
          href={post.fonte_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[12px] text-tinta-suave hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Fonte
        </a>
      )}

      {/* Ações */}
      <div className="mt-3 flex items-center gap-5 border-t border-borda pt-3">
        <button
          onClick={curtir}
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-semibold",
            curtiu ? "text-rosa-elas-texto" : "text-tinta-suave hover:text-rosa-elas-texto",
          )}
        >
          <Heart className={cn("h-4 w-4", curtiu && "fill-current")} /> {curtidas}
        </button>
        <button
          onClick={() => setMostrarComentarios((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tinta-suave hover:text-azul-elas"
        >
          <MessageCircle className="h-4 w-4" /> {comentarios}
        </button>
        <BotaoCompartilhar postId={post.id} titulo={post.titulo || post.texto.slice(0, 60)} />
      </div>

      {mostrarComentarios && (
        <Comentarios
          postId={post.id}
          onMudouTotal={(d) => setComentarios((n) => Math.max(0, n + d))}
        />
      )}
    </article>
  );
}
