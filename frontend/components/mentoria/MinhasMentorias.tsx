"use client";

import { useState } from "react";
import { CalendarClock, Video, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiAuthJson } from "@/lib/api";
import { dataHora } from "./formato";
import type { Mentoria } from "@/lib/types";

interface Props {
  mentorias: Mentoria[];
  onMudou: (mentorias: Mentoria[]) => void;
  compacto?: boolean;
}

export function MinhasMentorias({ mentorias, onMudou, compacto }: Props) {
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Nunca listamos canceladas. No modo compacto (perfil), só as futuras.
  const ativas = mentorias.filter((m) => m.status === "ativa");
  const lista = compacto ? ativas.filter((m) => !m.passada) : ativas;

  async function cancelar(id: number) {
    if (!confirm("Cancelar esta mentoria?")) return;
    setCancelandoId(id);
    setErro(null);
    try {
      const atualizada = await apiAuthJson<Mentoria>(
        `/api/mentoria/minhas/${id}/cancelar/`,
        { method: "POST" },
      );
      onMudou(mentorias.map((m) => (m.id === id ? atualizada : m)));
    } catch (err) {
      const e = err as { corpo?: { detail?: string } };
      setErro(e.corpo?.detail ?? "Não foi possível cancelar.");
    } finally {
      setCancelandoId(null);
    }
  }

  if (lista.length === 0) {
    return (
      <p className="text-[13px] text-tinta-suave">
        {compacto
          ? "Nenhuma mentoria agendada."
          : "Você ainda não agendou mentorias."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {erro && <p className="text-[13px] text-perigo">{erro}</p>}
      {lista.map((m) => (
        <div
          key={m.id}
          className={cn(
            "rounded-card border border-borda p-3",
            m.status === "cancelada" && "opacity-60",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-tinta">{m.slot.tema}</p>
              <p className="truncate text-[12px] text-tinta-suave">
                {m.slot.empresa_nome} · {m.slot.mentora_nome}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-tinta-suave">
                <CalendarClock className="h-3.5 w-3.5" /> {dataHora(m.slot.inicio)}
              </p>
            </div>
            {m.status === "cancelada" ? (
              <span className="text-[12px] font-semibold text-perigo">Cancelada</span>
            ) : m.passada ? (
              <span className="text-[12px] text-tinta-suave">Realizada</span>
            ) : null}
          </div>

          {m.status === "ativa" && m.meet_link && !m.passada && (
            <a
              href={m.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-azul-elas hover:underline"
            >
              <Video className="h-4 w-4" /> Entrar na reunião
            </a>
          )}

          {m.pode_cancelar && (
            <button
              onClick={() => cancelar(m.id)}
              disabled={cancelandoId === m.id}
              className="mt-2 ml-auto flex items-center gap-1 text-[12px] font-semibold text-perigo hover:underline disabled:opacity-50"
            >
              {cancelandoId === m.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Cancelar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
