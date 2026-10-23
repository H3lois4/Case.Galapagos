"use client";

import { useEffect, useState } from "react";
import { Compass, Sparkles, ListChecks, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ChatIA } from "@/components/ia/ChatIA";
import { AreaCard } from "@/components/carreira/AreaCard";
import { AreaModal } from "@/components/carreira/AreaModal";
import { PlanoEditor } from "@/components/carreira/PlanoEditor";
import { apiAuthJson } from "@/lib/api";
import type { AreaResumo, PlanoRascunho } from "@/lib/types";

type Aba = "areas" | "ia";

export default function CarreiraPage() {
  const [aba, setAba] = useState<Aba>("areas");
  const [areas, setAreas] = useState<AreaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [areaAberta, setAreaAberta] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [rascunho, setRascunho] = useState<PlanoRascunho | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    apiAuthJson<AreaResumo[]>("/api/carreira/areas/")
      .then(setAreas)
      .catch(() => setAreas([]))
      .finally(() => setCarregando(false));
  }, []);

  async function gerarPlano() {
    setGerando(true);
    setAviso(null);
    try {
      const r = await apiAuthJson<PlanoRascunho>("/api/carreira/plano/gerar/", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setRascunho(r);
    } catch (err) {
      const e = err as { corpo?: { detail?: string } };
      setAviso(e.corpo?.detail ?? "Não foi possível gerar o plano agora.");
    } finally {
      setGerando(false);
    }
  }

  function aoSalvarPlano() {
    setRascunho(null);
    setAviso("Plano salvo! Veja no seu Perfil, em “Minha jornada”.");
  }

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="font-titulo text-[24px] font-bold text-tinta">Carreira</h1>
        <p className="text-[14px] text-tinta-suave">
          Explore as áreas do mercado e monte seu plano com a IA.
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-2" role="tablist" aria-label="Seções de carreira">
        <AbaBotao ativo={aba === "areas"} onClick={() => setAba("areas")} Icone={Compass}>
          Áreas
        </AbaBotao>
        <AbaBotao ativo={aba === "ia"} onClick={() => setAba("ia")} Icone={Sparkles}>
          IA de carreira
        </AbaBotao>
      </div>

      {aba === "areas" ? (
        carregando ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {areas.map((a) => (
              <AreaCard key={a.slug} area={a} onAbrir={() => setAreaAberta(a.slug)} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div className="rounded-card border border-borda bg-azul-elas-suave/60 p-3">
            <p className="text-[13px] text-tinta">
              Converse sobre seus objetivos e, quando quiser, gere um plano de
              carreira para acompanhar no seu perfil.
            </p>
            <Button
              variante="destaque"
              className="mt-2 h-10"
              onClick={gerarPlano}
              disabled={gerando}
            >
              {gerando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ListChecks className="h-4 w-4" />
              )}
              Gerar meu plano
            </Button>
            {aviso && <p className="mt-2 text-[13px] text-tinta-suave">{aviso}</p>}
          </div>
          <ChatIA agente="carreira" titulo="IA de carreira" />
        </div>
      )}

      {areaAberta && (
        <AreaModal slug={areaAberta} onFechar={() => setAreaAberta(null)} />
      )}
      {rascunho && (
        <PlanoEditor
          rascunho={rascunho}
          onFechar={() => setRascunho(null)}
          onSalvo={aoSalvarPlano}
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
  Icone: typeof Compass;
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
