"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiAuth, apiAuthJson } from "@/lib/api";
import type { PlanoCarreira } from "@/lib/types";

interface Props {
  plano: PlanoCarreira;
  onMudou: (plano: PlanoCarreira | null) => void;
}

export function PlanoChecklist({ plano, onMudou }: Props) {
  const [ocupado, setOcupado] = useState(false);

  async function alternar(id: number, concluido: boolean) {
    setOcupado(true);
    const atualizado = await apiAuthJson<PlanoCarreira>(
      `/api/carreira/plano/passo/${id}/`,
      { method: "PATCH", body: JSON.stringify({ concluido }) },
    ).catch(() => null);
    setOcupado(false);
    if (atualizado) onMudou(atualizado);
  }

  async function excluir() {
    if (!confirm("Excluir seu plano de carreira?")) return;
    setOcupado(true);
    const res = await apiAuth("/api/carreira/plano/", { method: "DELETE" });
    setOcupado(false);
    if (res.ok) onMudou(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-tinta">{plano.titulo}</p>
        <span className="text-[12px] text-tinta-suave">
          {plano.concluidos}/{plano.total_passos}
        </span>
      </div>

      {/* Trilho de progresso */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-pill bg-rosa-elas-suave">
        <div
          className="h-full rounded-pill bg-azul-elas transition-all"
          style={{
            width: `${plano.total_passos ? (plano.concluidos / plano.total_passos) * 100 : 0}%`,
          }}
        />
      </div>

      <ul className="space-y-2">
        {plano.passos.map((p) => (
          <li key={p.id} className="flex items-start gap-3">
            <button
              onClick={() => alternar(p.id, !p.concluido)}
              disabled={ocupado}
              aria-label={p.concluido ? "Desmarcar passo" : "Marcar passo como concluído"}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border transition-colors",
                p.concluido
                  ? "border-azul-elas bg-azul-elas text-white"
                  : "border-tinta-suave/60 text-transparent hover:border-azul-elas",
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[14px] font-medium text-tinta",
                  p.concluido && "line-through opacity-60",
                )}
              >
                {p.titulo}
                {p.prazo && (
                  <span className="ml-2 text-[12px] font-normal text-tinta-suave">
                    ({p.prazo})
                  </span>
                )}
              </p>
              {p.descricao && (
                <p className="text-[12px] text-tinta-suave">{p.descricao}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={excluir}
        disabled={ocupado}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-perigo hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" /> Excluir plano
      </button>
    </div>
  );
}
