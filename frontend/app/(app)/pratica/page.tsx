"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Mic,
  Loader2,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ChatIA } from "@/components/ia/ChatIA";
import { Simulado } from "@/components/pratica/Simulado";
import { EntrevistaSetup } from "@/components/pratica/EntrevistaSetup";
import { RelatorioEntrevista } from "@/components/pratica/RelatorioEntrevista";
import { apiAuthJson } from "@/lib/api";
import type {
  Entrevista,
  RelatorioEntrevista as Relatorio,
  TemaSimulado,
} from "@/lib/types";

type Aba = "simulados" | "entrevista";

export default function PraticaPage() {
  const [aba, setAba] = useState<Aba>("simulados");
  const [temas, setTemas] = useState<TemaSimulado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [temaAtivo, setTemaAtivo] = useState<string | null>(null);

  useEffect(() => {
    apiAuthJson<TemaSimulado[]>("/api/pratica/temas/")
      .then(setTemas)
      .catch(() => setTemas([]))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="font-titulo text-[24px] font-bold text-tinta">Prática</h1>
        <p className="text-[14px] text-tinta-suave">
          Treine com simulados e faça uma entrevista com a IA.
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Seções de prática">
        <AbaBotao ativo={aba === "simulados"} onClick={() => setAba("simulados")} Icone={ClipboardList}>
          Simulados
        </AbaBotao>
        <AbaBotao ativo={aba === "entrevista"} onClick={() => setAba("entrevista")} Icone={Mic}>
          Entrevista com IA
        </AbaBotao>
      </div>

      {aba === "simulados" ? (
        temaAtivo ? (
          <Simulado tema={temaAtivo} onSair={() => setTemaAtivo(null)} />
        ) : carregando ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {temas.map((t) => (
              <button
                key={t.slug}
                type="button"
                disabled={t.questoes === 0}
                onClick={() => setTemaAtivo(t.slug)}
                className={cn(
                  "flex h-full flex-col rounded-card border border-borda bg-fundo p-4 text-left shadow-[var(--sombra-card)] transition-transform",
                  t.questoes > 0
                    ? "hover:-translate-y-0.5 hover:border-azul-elas/50"
                    : "cursor-not-allowed opacity-60",
                )}
              >
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
                  <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-titulo text-[15px] font-semibold text-tinta">{t.nome}</h3>
                <p className="mt-1 text-[12px] text-tinta-suave">
                  {t.questoes} {t.questoes === 1 ? "questão" : "questões"}
                </p>
              </button>
            ))}
          </div>
        )
      ) : (
        <Entrevista />
      )}
    </div>
  );
}

function Entrevista() {
  const [entrevista, setEntrevista] = useState<Entrevista | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function encerrar() {
    if (!entrevista) return;
    setGerando(true);
    setErro(null);
    try {
      const r = await apiAuthJson<Relatorio>(
        `/api/pratica/entrevistas/${entrevista.id}/relatorio/`,
        { method: "POST" },
      );
      setRelatorio(r);
    } catch (err) {
      const e = err as { corpo?: { detail?: string } };
      setErro(e.corpo?.detail ?? "Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  }

  function reiniciar() {
    setEntrevista(null);
    setRelatorio(null);
    setErro(null);
  }

  if (!entrevista) {
    return <EntrevistaSetup onIniciada={setEntrevista} />;
  }

  if (relatorio) {
    return (
      <div className="space-y-4">
        <RelatorioEntrevista entrevista={entrevista} relatorio={relatorio} />
        <Button variante="secondary" bloco onClick={reiniciar}>
          Nova entrevista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ChatIA
        agente="entrevistadora"
        titulo={`Entrevista: ${entrevista.vaga}`}
        conversaIdInicial={entrevista.conversa_id}
        vozLang={entrevista.idioma === "en" ? "en-US" : "pt-BR"}
        ocultarNovaConversa
      />
      {erro && <p className="text-[13px] text-perigo">{erro}</p>}
      <Button bloco onClick={encerrar} disabled={gerando}>
        {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Encerrar e ver feedback
      </Button>
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
  Icone: typeof Mic;
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
