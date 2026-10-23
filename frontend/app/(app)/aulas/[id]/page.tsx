"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuth, apiAuthJson } from "@/lib/api";
import type { Aula } from "@/lib/types";

function dataBr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PlayerAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [aula, setAula] = useState<Aula | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "" });

  useEffect(() => {
    apiAuthJson<Aula>(`/api/aulas/${id}/`)
      .then((a) => {
        setAula(a);
        setForm({ titulo: a.titulo, descricao: a.descricao });
      })
      .catch(() => setNaoEncontrada(true))
      .finally(() => setCarregando(false));
  }, [id]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const atualizada = await apiAuthJson<Aula>(`/api/aulas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
      }),
    }).catch(() => null);
    setSalvando(false);
    if (atualizada) {
      setAula((a) => (a ? { ...a, ...atualizada } : atualizada));
      setEditando(false);
    }
  }

  async function excluir() {
    if (!confirm("Excluir esta aula? Essa ação é definitiva.")) return;
    setExcluindo(true);
    const res = await apiAuth(`/api/aulas/${id}/`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/aulas");
    } else {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
      </div>
    );
  }

  if (naoEncontrada || !aula) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-[15px] font-semibold text-tinta">Aula não encontrada</p>
        <Link href="/aulas" className="mt-2 text-[14px] font-semibold text-azul-elas hover:underline">
          Voltar para as aulas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Link
        href="/aulas"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tinta-suave hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" /> Aulas
      </Link>

      {/* Player */}
      <div className="overflow-hidden rounded-card border border-borda bg-black">
        <video
          controls
          playsInline
          poster={aula.thumb_url || undefined}
          className="aspect-video w-full bg-black"
          src={aula.video_url}
        >
          Seu navegador não suporta vídeo.
        </video>
      </div>

      {editando ? (
        <form onSubmit={salvar} className="space-y-3 rounded-card border border-borda bg-fundo p-4">
          <Input
            name="titulo"
            rotulo="Título"
            value={form.titulo}
            maxLength={160}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
          <div>
            <label htmlFor="descricao" className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Descrição
            </label>
            <textarea
              id="descricao"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 py-2.5 text-[15px] text-tinta focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={salvando} className="h-10">
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
            <Button
              type="button"
              variante="ghost"
              className="h-10"
              onClick={() => {
                setEditando(false);
                setForm({ titulo: aula.titulo, descricao: aula.descricao });
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <h1 className="font-titulo text-[22px] font-bold text-tinta">
            {aula.titulo}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-tinta-suave">
            <span className="inline-flex items-center gap-1 font-semibold text-azul-elas">
              {aula.origem === "ia" ? (
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
              )}
              {aula.autor_nome}
            </span>
            <span aria-hidden>•</span>
            <span>{dataBr(aula.publicado_em)}</span>
          </div>
          {aula.descricao && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-tinta">
              {aula.descricao}
            </p>
          )}
        </div>
      )}

      {/* Ações do dono */}
      {aula.pode_editar && !editando && (
        <div className="flex gap-3 border-t border-borda pt-4">
          <Button variante="secondary" className="h-10" onClick={() => setEditando(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <button
            onClick={excluir}
            disabled={excluindo}
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-perigo hover:underline disabled:opacity-50"
          >
            {excluindo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
