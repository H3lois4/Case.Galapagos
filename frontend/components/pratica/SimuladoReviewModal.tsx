"use client";

import { useEffect, useState } from "react";
import { X, Check, X as XIcon, Loader2, Share2, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiAuthJson } from "@/lib/api";
import { gerarPdfSimulado } from "@/lib/pdfSimulado";
import { Button } from "@/components/ui/Button";
import type { ResultadoSimulado } from "@/lib/types";

/** Verifica se o navegador suporta compartilhar arquivos (celular). */
function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
    share?: (d: ShareData) => Promise<void>;
  };
  if (!nav.share || !nav.canShare) return false;
  try {
    const amostra = new File([new Blob()], "x.pdf", { type: "application/pdf" });
    return nav.canShare({ files: [amostra] });
  } catch {
    return false;
  }
}

/**
 * Pop-up que abre o relatório de um simulado já salvo (Minha jornada).
 * Busca GET /api/pratica/simulados/<id>/ e mostra nota + revisão completa.
 */
export function SimuladoReviewModal({
  attemptId,
  onFechar,
}: {
  attemptId: number;
  onFechar: () => void;
}) {
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [compartilhando, setCompartilhando] = useState(false);

  useEffect(() => {
    apiAuthJson<ResultadoSimulado>(`/api/pratica/simulados/${attemptId}/`)
      .then(setResultado)
      .catch(() => setErro("Não foi possível carregar o relatório."));
  }, [attemptId]);

  async function compartilhar() {
    if (!resultado) return;
    setCompartilhando(true);
    try {
      const arquivo = await gerarPdfSimulado(
        resultado,
        resultado.tema_nome ?? "Simulado",
      );
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
        share?: (d: ShareData) => Promise<void>;
      };
      const dados: ShareData = {
        title: "Relatório de simulado — Por ELAS finance",
        text: `Meu resultado: ${resultado.nota}/${resultado.total} em ${
          resultado.tema_nome ?? "simulado"
        }.`,
        files: [arquivo],
      };
      // Compartilha o PDF via Web Share API (celular). Fallback: baixa o PDF.
      if (nav.share && (!nav.canShare || nav.canShare({ files: [arquivo] }))) {
        try {
          await nav.share(dados);
          return;
        } catch {
          // usuária cancelou ou falhou → cai no fallback de download
        }
      }
      baixar(arquivo);
    } catch {
      setErro("Não foi possível gerar o relatório em PDF.");
    } finally {
      setCompartilhando(false);
    }
  }

  function baixar(arquivo: File) {
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = arquivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const pct =
    resultado && resultado.total
      ? Math.round((resultado.nota / resultado.total) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Relatório do simulado"
      onClick={onFechar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-titulo text-[20px] font-bold text-tinta">
            {resultado?.tema_nome ?? "Relatório"}
          </h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!resultado && !erro && (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
          </div>
        )}
        {erro && <p className="text-[13px] text-perigo">{erro}</p>}

        {resultado && (
          <div className="space-y-4">
            <div className="rounded-card border border-borda bg-azul-elas-suave/60 p-4 text-center">
              <p className="font-titulo text-[28px] font-bold text-azul-elas">
                {resultado.nota}/{resultado.total}
              </p>
              <p className="text-[13px] text-tinta-suave">{pct}% de acerto</p>
            </div>

            <ol className="space-y-3">
              {resultado.revisao.map((r, i) => (
                <li
                  key={r.id}
                  className="rounded-card border border-borda bg-fundo p-4"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill text-white",
                        r.acertou ? "bg-sucesso" : "bg-perigo",
                      )}
                    >
                      {r.acertou ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <p className="font-semibold text-tinta">
                      {i + 1}. {r.enunciado}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1 text-[13px]">
                    {r.alternativas.map((alt, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          "rounded-chip px-2.5 py-1.5",
                          idx === r.correta &&
                            "bg-sucesso/10 font-semibold text-sucesso",
                          idx === r.escolhida &&
                            idx !== r.correta &&
                            "bg-perigo/10 text-perigo",
                        )}
                      >
                        {String.fromCharCode(65 + idx)}. {alt}
                        {idx === r.correta && " ✓"}
                        {idx === r.escolhida &&
                          idx !== r.correta &&
                          " (sua resposta)"}
                      </li>
                    ))}
                  </ul>
                  {r.explicacao && (
                    <p className="mt-2 text-[13px] text-tinta-suave">
                      <span className="font-semibold text-tinta">Por quê: </span>
                      {r.explicacao}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <Button bloco onClick={compartilhar} disabled={compartilhando}>
              {compartilhando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : canShareFiles() ? (
                <Share2 className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {canShareFiles() ? "Compartilhar relatório" : "Baixar relatório"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
