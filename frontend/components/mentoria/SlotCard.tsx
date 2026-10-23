"use client";

import { CalendarClock, Clock, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dataHora } from "./formato";
import type { MentoriaSlot } from "@/lib/types";

interface Props {
  slot: MentoriaSlot;
  agendando: boolean;
  onAgendar: () => void;
}

export function SlotCard({ slot, agendando, onAgendar }: Props) {
  return (
    <div className="rounded-card border border-borda bg-fundo p-4 shadow-[var(--sombra-card)]">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-azul-elas">
        <Building2 className="h-4 w-4" strokeWidth={1.75} />
        {slot.empresa_nome}
      </div>
      <h3 className="mt-1 font-titulo text-[16px] font-semibold text-tinta">
        {slot.tema}
      </h3>
      <p className="text-[13px] text-tinta-suave">
        {slot.mentora_nome}
        {slot.mentora_cargo ? ` — ${slot.mentora_cargo}` : ""}
      </p>
      <div className="mt-2 flex items-center gap-4 text-[13px] text-tinta-suave">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-4 w-4" /> {dataHora(slot.inicio)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" /> {slot.duracao_min} min
        </span>
      </div>
      <Button className="mt-3 h-10" bloco onClick={onAgendar} disabled={agendando}>
        {agendando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Agendar
      </Button>
    </div>
  );
}
