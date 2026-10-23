"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Sparkles, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ChatIA } from "@/components/ia/ChatIA";
import { SlotCard } from "@/components/mentoria/SlotCard";
import { SlotForm } from "@/components/mentoria/SlotForm";
import { MinhasMentorias } from "@/components/mentoria/MinhasMentorias";
import { apiAuthJson } from "@/lib/api";
import type { Me, Mentoria, MentoriaSlot } from "@/lib/types";

type Aba = "agenda" | "ia";

export default function MentoriaPage() {
  const [aba, setAba] = useState<Aba>("agenda");
  const [me, setMe] = useState<Me | null>(null);
  const [slots, setSlots] = useState<MentoriaSlot[]>([]);
  const [minhas, setMinhas] = useState<Mentoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agendandoId, setAgendandoId] = useState<number | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function carregar() {
    const [s, m] = await Promise.all([
      apiAuthJson<MentoriaSlot[]>("/api/mentoria/horarios/").catch(() => []),
      apiAuthJson<Mentoria[]>("/api/mentoria/minhas/").catch(() => []),
    ]);
    setSlots(s);
    setMinhas(m);
  }

  useEffect(() => {
    apiAuthJson<Me>("/api/me/").then(setMe).catch(() => setMe(null));
    carregar().finally(() => setCarregando(false));
  }, []);

  async function agendar(slot: MentoriaSlot) {
    setAgendandoId(slot.id);
    setAviso(null);
    try {
      const mentoria = await apiAuthJson<Mentoria>(
        `/api/mentoria/horarios/${slot.id}/agendar/`,
        { method: "POST" },
      );
      setMinhas((atual) => [mentoria, ...atual]);
      setSlots((atual) => atual.filter((s) => s.id !== slot.id));
      setAviso("Mentoria agendada! Veja em “Minhas mentorias”.");
    } catch (err) {
      const e = err as { corpo?: { detail?: string } };
      setAviso(e.corpo?.detail ?? "Não foi possível agendar.");
      // Recarrega para refletir o estado real (ex.: slot tomado por outra).
      carregar();
    } finally {
      setAgendandoId(null);
    }
  }

  const podeCadastrar = me?.empresa_status === "aprovada";

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="font-titulo text-[24px] font-bold text-tinta">Mentoria</h1>
        <p className="text-[14px] text-tinta-suave">
          Converse com a IA mentora e agende uma sessão com profissionais.
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Seções de mentoria">
        <AbaBotao ativo={aba === "agenda"} onClick={() => setAba("agenda")} Icone={CalendarDays}>
          Agenda
        </AbaBotao>
        <AbaBotao ativo={aba === "ia"} onClick={() => setAba("ia")} Icone={Sparkles}>
          IA mentora
        </AbaBotao>
      </div>

      {aba === "agenda" ? (
        <div className="space-y-6">
          {podeCadastrar && (
            <Button variante="destaque" className="h-10" onClick={() => setFormAberto(true)}>
              <Plus className="h-4 w-4" /> Cadastrar horário
            </Button>
          )}

          {aviso && (
            <p className="rounded-chip bg-azul-elas-suave/60 px-3 py-2 text-[13px] text-tinta">
              {aviso}
            </p>
          )}

          {carregando ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
            </div>
          ) : (
            <>
              <section>
                <h2 className="mb-2 font-titulo text-[18px] font-semibold text-tinta">
                  Horários disponíveis
                </h2>
                {slots.length === 0 ? (
                  <p className="text-[13px] text-tinta-suave">
                    Nenhum horário disponível no momento.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {slots.map((s) => (
                      <SlotCard
                        key={s.id}
                        slot={s}
                        agendando={agendandoId === s.id}
                        onAgendar={() => agendar(s)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-2 font-titulo text-[18px] font-semibold text-tinta">
                  Minhas mentorias
                </h2>
                <MinhasMentorias mentorias={minhas} onMudou={setMinhas} />
              </section>
            </>
          )}
        </div>
      ) : (
        <ChatIA agente="mentora" titulo="IA mentora" />
      )}

      {formAberto && (
        <SlotForm
          onFechar={() => setFormAberto(false)}
          onCriado={(slot) => {
            setFormAberto(false);
            setAviso("Horário cadastrado. Ele já aparece para as usuárias.");
            // Só aparece na lista de disponíveis se for de outra empresa; recarrega mesmo assim.
            carregar();
            void slot;
          }}
        />
      )}
    </div>
  );
}

function AbaBotao({
  ativo,
  onClick,
  Icone,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  Icone: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-4 py-2 text-[13px] font-semibold transition-colors",
        ativo
          ? "border-azul-elas bg-azul-elas text-white"
          : "border-borda bg-fundo text-tinta-suave hover:border-azul-elas/60 hover:text-tinta",
      )}
    >
      <Icone className="h-4 w-4" strokeWidth={1.75} />
      {children}
    </button>
  );
}
