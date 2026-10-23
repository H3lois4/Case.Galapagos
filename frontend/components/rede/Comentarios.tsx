"use client";

import { useEffect, useState } from "react";
import { Send, Trash2, Loader2 } from "lucide-react";
import { apiAuth, apiAuthJson } from "@/lib/api";
import { dataCurta } from "./comum";
import type { ComentarioPost } from "@/lib/types";

export function Comentarios({
  postId,
  onMudouTotal,
}: {
  postId: number;
  onMudouTotal: (delta: number) => void;
}) {
  const [comentarios, setComentarios] = useState<ComentarioPost[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    apiAuthJson<ComentarioPost[]>(`/api/rede/posts/${postId}/comentarios/`)
      .then(setComentarios)
      .catch(() => setComentarios([]))
      .finally(() => setCarregando(false));
  }, [postId]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    try {
      const novo = await apiAuthJson<ComentarioPost>(
        `/api/rede/posts/${postId}/comentarios/`,
        { method: "POST", body: JSON.stringify({ texto: t }) },
      );
      setComentarios((c) => [...c, novo]);
      setTexto("");
      onMudouTotal(1);
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(id: number) {
    const res = await apiAuth(`/api/rede/comentarios/${id}/`, { method: "DELETE" });
    if (res.ok) {
      setComentarios((c) => c.filter((x) => x.id !== id));
      onMudouTotal(-1);
    }
  }

  return (
    <div className="mt-3 border-t border-borda pt-3">
      {carregando ? (
        <Loader2 className="h-4 w-4 animate-spin text-azul-elas" />
      ) : (
        <ul className="space-y-2">
          {comentarios.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2">
              <p className="text-[13px] text-tinta">
                <span className="font-semibold">
                  {c.autor_nome || `@${c.autor_username}`}
                </span>{" "}
                <span className="text-tinta-suave">· {dataCurta(c.criado_em)}</span>
                <br />
                {c.texto}
              </p>
              {c.pode_excluir && (
                <button
                  onClick={() => excluir(c.id)}
                  aria-label="Excluir comentário"
                  className="shrink-0 text-tinta-suave hover:text-perigo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          {comentarios.length === 0 && (
            <p className="text-[13px] text-tinta-suave">Seja a primeira a comentar.</p>
          )}
        </ul>
      )}

      <form onSubmit={enviar} className="mt-3 flex items-center gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Comentar…"
          className="h-10 flex-1 rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 text-[14px] text-tinta focus:border-azul-elas focus:outline-none"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          aria-label="Enviar comentário"
          className="flex h-10 w-10 items-center justify-center rounded-pill bg-azul-elas text-white disabled:opacity-50"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
