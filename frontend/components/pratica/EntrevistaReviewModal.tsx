"use client";

import { useEffect, useState } from "react";
import { X, Loader2, FileText } from "lucide-react";
import { apiAuthJson } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { RelatorioEntrevista } from "@/components/pratica/RelatorioEntrevista";
import type { Entrevista, RelatorioEntrevista as Relatorio } from "@/lib/types";

/**
 * Pop-up que abre o relatório de uma entrevista já feita (Minha Jornada).
 * Busca GET /api/pratica/entrevistas/<id>/. Se a entrevista ainda não tiver
 * relatório (não foi encerrada), permite gerar o feedback na hora.
 */
export function EntrevistaReviewModal({
  entrevistaId,
  onFechar,
  onRelatorioGerado,
}: {
  entrevistaId: number;
  onFechar: () => void;
  /** Avisa a lista para atualizar a nota quando o relatório é gerado aqui. */
  onRelatorioGerado?: (entrevista: Entrevista) => void;
}) {
  const [entrevista, setEntrevista] = useState<Entrevista | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    apiAuthJson<Entrevista>(`/api/pratica/entrevistas/${entrevistaId}/`)
      .then(setEntrevista)
      .catch(() => setErro("Não foi possível carregar a entrevista."));
  }, [entrevistaId]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  async function gerarFeedback() {
    if (!entrevista) return;
    setGerando(true);
    setErro(null);
    try {
      const relatorio = await apiAuthJson<Relatorio>(
        `/api/pratica/entrevistas/${entrevista.id}/relatorio/`,
        { method: "POST" },
      );
      const atualizada: Entrevista = {
        ...entrevista,
        relatorio,
        nota_geral: relatorio.nota_geral,
        finalizado_em: entrevista.finalizado_em ?? new Date().toISOString(),
      };
      setEntrevista(atualizada);
      onRelatorioGerado?.(atualizada);
    } catch (err) {
      const e = err as { corpo?: { detail?: string } };
      setErro(e.corpo?.detail ?? "Não foi possível gerar o feedback. Tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Relatório da entrevista"
      onClick={onFechar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-titulo text-[20px] font-bold text-tinta">
              {entrevista?.vaga ?? "Relatório"}
            </h2>
            {entrevista && (
              <p className="text-[13px] text-tinta-suave">Entrevista simulada com IA</p>
            )}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!entrevista && !erro && (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
          </div>
        )}

        {entrevista?.relatorio ? (
          <RelatorioEntrevista entrevista={entrevista} relatorio={entrevista.relatorio} />
        ) : entrevista ? (
          <div className="space-y-4 text-center">
            <p className="text-[14px] text-tinta-suave">
              Esta entrevista ainda não foi encerrada, então o feedback não foi
              gerado.
            </p>
            <Button bloco onClick={gerarFeedback} disabled={gerando}>
              {gerando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {gerando ? "Gerando feedback…" : "Gerar feedback agora"}
            </Button>
          </div>
        ) : null}

        {erro && <p className="mt-3 text-[13px] text-perigo">{erro}</p>}
      </div>
    </div>
  );
}
