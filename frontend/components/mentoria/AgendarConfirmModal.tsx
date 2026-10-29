"use client";

import { useEffect } from "react";
import { X, CalendarClock, Mail, CalendarRange, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dataHora } from "./formato";
import type { MentoriaSlot } from "@/lib/types";

/**
 * Pop-up de confirmação ao agendar uma mentoria. Explica as regras
 * (confirmação por e-mail, limite de 1/mês, cancelamento até 24h antes)
 * antes de efetivar o agendamento.
 */
export function AgendarConfirmModal({
  slot,
  agendando,
  onConfirmar,
  onFechar,
}: {
  slot: MentoriaSlot;
  agendando: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape" && !agendando) onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar, agendando]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar agendamento"
      onClick={() => !agendando && onFechar()}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-titulo text-[20px] font-bold text-tinta">
            Confirmar mentoria
          </h2>
          <button
            onClick={onFechar}
            disabled={agendando}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo do horário */}
        <div className="rounded-card border border-borda bg-fundo-alt p-3">
          <p className="text-[14px] font-semibold text-tinta">{slot.tema}</p>
          <p className="text-[12px] text-tinta-suave">
            {slot.empresa_nome} · {slot.mentora_nome}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-tinta-suave">
            <CalendarClock className="h-3.5 w-3.5" /> {dataHora(slot.inicio)} ·{" "}
            {slot.duracao_min} min
          </p>
        </div>

        <p className="mt-4 text-[14px] text-tinta-suave">Antes de confirmar:</p>
        <ul className="mt-3 space-y-3">
          <Regra Icone={Mail} titulo="Confirmação por e-mail">
            Você recebe um convite no seu e-mail (com o link da reunião). Aceite o
            convite para o encontro entrar na sua agenda.
          </Regra>
          <Regra Icone={CalendarRange} titulo="Uma mentoria por mês">
            Cada usuária pode ter uma mentoria agendada por mês. Conclua ou cancele
            a atual para marcar outra no mesmo mês.
          </Regra>
          <Regra Icone={Ban} titulo="Cancelamento até 24h antes">
            Dá para cancelar somente até 24 horas antes do horário marcado.
          </Regra>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Button bloco onClick={onConfirmar} disabled={agendando}>
            {agendando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar agendamento
          </Button>
          <Button variante="ghost" bloco onClick={onFechar} disabled={agendando}>
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Regra({
  Icone,
  titulo,
  children,
}: {
  Icone: typeof Mail;
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
