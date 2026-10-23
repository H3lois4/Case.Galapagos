"use client";

import { useEffect, useState } from "react";
import { X, Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiAuthJson } from "@/lib/api";
import { baixarPdfArea } from "@/lib/pdfArea";
import type { AreaDetalhe } from "@/lib/types";

function ListaChips({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (!itens?.length) return null;
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-azul-elas">{titulo}</h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {itens.map((i) => (
          <span
            key={i}
            className="rounded-chip bg-fundo-alt px-2.5 py-1 text-[12px] text-tinta"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  if (!texto) return null;
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-azul-elas">{titulo}</h3>
      <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-tinta">
        {texto}
      </p>
    </div>
  );
}

export function AreaModal({ slug, onFechar }: { slug: string; onFechar: () => void }) {
  const [area, setArea] = useState<AreaDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    apiAuthJson<AreaDetalhe>(`/api/carreira/areas/${slug}/`)
      .then(setArea)
      .catch(() => setErro("Não foi possível carregar a área."));
  }, [slug]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  async function baixar() {
    if (!area) return;
    setBaixando(true);
    setErro(null);
    try {
      await baixarPdfArea(area);
    } catch {
      setErro("Não foi possível gerar o PDF.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={area?.nome ?? "Área"}
      onClick={onFechar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-titulo text-[20px] font-bold text-tinta">
            {area?.nome ?? "Carregando…"}
          </h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!area && !erro && (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
          </div>
        )}

        {area && (
          <div className="space-y-4">
            <p className="text-[14px] italic text-tinta-suave">{area.resumo}</p>
            <Bloco titulo="Descrição" texto={area.descricao} />
            <Bloco titulo="Formação comum" texto={area.formacao} />
            <ListaChips titulo="Certificações" itens={area.certificacoes} />
            <ListaChips titulo="Hard skills" itens={area.hard_skills} />
            <ListaChips titulo="Soft skills" itens={area.soft_skills} />
            <ListaChips titulo="Cargos de entrada" itens={area.cargos_entrada} />

            {area.mulheres?.length > 0 && (
              <div>
                <h3 className="text-[13px] font-semibold text-azul-elas">
                  Mulheres que atuam na área
                </h3>
                <ul className="mt-2 space-y-2">
                  {area.mulheres.map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-tinta">
                          {m.nome}
                        </p>
                        <p className="truncate text-[12px] text-tinta-suave">{m.cargo}</p>
                      </div>
                      {m.linkedin && (
                        <a
                          href={m.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`LinkedIn de ${m.nome}`}
                          className="inline-flex items-center gap-1 rounded-chip bg-azul-elas-suave px-2.5 py-1 text-[12px] font-semibold text-azul-elas hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {erro && <p className="text-[13px] text-perigo">{erro}</p>}

            <Button variante="secondary" bloco onClick={baixar} disabled={baixando}>
              {baixando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Baixar PDF
            </Button>
          </div>
        )}

        {erro && !area && <p className="text-[13px] text-perigo">{erro}</p>}
      </div>
    </div>
  );
}
