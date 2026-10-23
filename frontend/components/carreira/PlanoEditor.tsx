"use client";

import { useState } from "react";
import { X, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuthJson } from "@/lib/api";
import type { PlanoCarreira, PlanoRascunho, PassoPlano } from "@/lib/types";

interface Props {
  rascunho: PlanoRascunho;
  onFechar: () => void;
  onSalvo: (plano: PlanoCarreira) => void;
}

export function PlanoEditor({ rascunho, onFechar, onSalvo }: Props) {
  const [titulo, setTitulo] = useState(rascunho.titulo);
  const [passos, setPassos] = useState<PassoPlano[]>(rascunho.passos);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function editarPasso(id: number, campo: keyof PassoPlano, valor: string) {
    setPassos((ps) =>
      ps.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)),
    );
  }

  function removerPasso(id: number) {
    setPassos((ps) => ps.filter((p) => p.id !== id));
  }

  async function salvar() {
    if (!passos.length) {
      setErro("O plano precisa de ao menos um passo.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const plano = await apiAuthJson<PlanoCarreira>("/api/carreira/plano/", {
        method: "PUT",
        body: JSON.stringify({ titulo, passos }),
      });
      onSalvo(plano);
    } catch {
      setErro("Não foi possível salvar o plano.");
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Revisar plano de carreira"
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-titulo text-[20px] font-bold text-tinta">Seu plano</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Input
          name="titulo"
          rotulo="Título do plano"
          value={titulo}
          maxLength={160}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <ol className="mt-4 space-y-3">
          {passos.map((p, i) => (
            <li key={p.id} className="rounded-card border border-borda p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-azul-elas">
                  Passo {i + 1}
                </span>
                <button
                  onClick={() => removerPasso(p.id)}
                  aria-label="Remover passo"
                  className="text-tinta-suave hover:text-perigo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={p.titulo}
                onChange={(e) => editarPasso(p.id, "titulo", e.target.value)}
                className="mb-2 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 py-2 text-[14px] font-semibold text-tinta focus:border-azul-elas focus:outline-none"
              />
              <textarea
                value={p.descricao}
                onChange={(e) => editarPasso(p.id, "descricao", e.target.value)}
                rows={2}
                placeholder="Descrição"
                className="mb-2 w-full resize-none rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 py-2 text-[13px] text-tinta focus:border-azul-elas focus:outline-none"
              />
              <input
                value={p.prazo}
                onChange={(e) => editarPasso(p.id, "prazo", e.target.value)}
                placeholder="Prazo (ex.: 2 meses)"
                className="w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 py-2 text-[13px] text-tinta focus:border-azul-elas focus:outline-none"
              />
            </li>
          ))}
        </ol>

        {erro && <p className="mt-2 text-[13px] text-perigo">{erro}</p>}

        <Button className="mt-4" bloco onClick={salvar} disabled={salvando}>
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar plano
        </Button>
      </div>
    </div>
  );
}
