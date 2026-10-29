"use client";

import { useEffect } from "react";
import { X, ClipboardCheck, Clock, ListChecks, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TemaSimulado } from "@/lib/types";

/**
 * Pop-up com as informações do simulado, mostrado antes de iniciar.
 * Ao confirmar, chama onIniciar() com o slug do tema.
 */
export function SimuladoInfoModal({
  tema,
  onIniciar,
  onFechar,
}: {
  tema: TemaSimulado;
  onIniciar: () => void;
  onFechar: () => void;
}) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const total = tema.questoes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Simulado: ${tema.nome}`}
      onClick={onFechar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2 className="font-titulo text-[20px] font-bold text-tinta">{tema.nome}</h2>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-[14px] text-tinta-suave">
          Antes de começar, veja como funciona este simulado:
        </p>

        <ul className="mt-4 space-y-3">
          <InfoItem Icone={ListChecks} titulo={`${total} ${total === 1 ? "questão" : "questões"}`}>
            Perguntas de múltipla escolha sobre {tema.nome.toLowerCase()}.
          </InfoItem>
          <InfoItem Icone={Clock} titulo="Cronômetro opcional">
            Você decide se quer marcar o tempo. É só ativar o cronômetro no topo da
            tela — ele não interrompe o simulado, serve apenas para você acompanhar
            quanto tempo levou.
          </InfoItem>
          <InfoItem Icone={BookOpenCheck} titulo="Correção e explicação">
            Ao finalizar, você vê sua nota, a resposta certa de cada questão e uma
            explicação. Dá para baixar tudo em PDF.
          </InfoItem>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Button bloco onClick={onIniciar}>
            Iniciar simulado
          </Button>
          <Button variante="ghost" bloco onClick={onFechar}>
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  Icone,
  titulo,
  children,
}: {
  Icone: typeof Clock;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-rosa-elas-suave text-rosa-elas-texto">
        <Icone className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-[14px] font-semibold text-tinta">{titulo}</p>
        <p className="text-[13px] leading-relaxed text-tinta-suave">{children}</p>
      </div>
    </li>
  );
}
