"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Clock, Check, X as XIcon, ArrowLeft, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { apiAuthJson } from "@/lib/api";
import type {
  QuestaoPublica,
  ResultadoSimulado,
  SimuladoIniciado,
} from "@/lib/types";

interface Props {
  tema: string;
  onSair: () => void;
}

export function Simulado({ tema, onSair }: Props) {
  const [iniciado, setIniciado] = useState<SimuladoIniciado | null>(null);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Cronômetro opcional
  const [usarCronometro, setUsarCronometro] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiAuthJson<SimuladoIniciado>("/api/pratica/simulados/", {
      method: "POST",
      body: JSON.stringify({ tema }),
    })
      .then(setIniciado)
      .catch((err) => {
        const e = err as { corpo?: { detail?: string } };
        setErro(e.corpo?.detail ?? "Não foi possível iniciar o simulado.");
      })
      .finally(() => setCarregando(false));
  }, [tema]);

  useEffect(() => {
    if (usarCronometro && !resultado) {
      timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [usarCronometro, resultado]);

  function escolher(qid: number, idx: number) {
    setRespostas((r) => ({ ...r, [qid]: idx }));
  }

  async function finalizar() {
    if (!iniciado) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await apiAuthJson<ResultadoSimulado>(
        `/api/pratica/simulados/${iniciado.attempt_id}/responder/`,
        { method: "POST", body: JSON.stringify({ respostas }) },
      );
      setResultado(r);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch {
      setErro("Não foi possível enviar as respostas.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
      </div>
    );
  }

  if (erro && !iniciado) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-[14px] text-tinta-suave">{erro}</p>
        <Button variante="secondary" onClick={onSair}>
          Voltar aos temas
        </Button>
      </div>
    );
  }

  if (resultado) {
    return <Resultado resultado={resultado} onSair={onSair} />;
  }

  if (!iniciado) return null;

  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const respondidas = Object.keys(respostas).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onSair}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tinta-suave hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" /> Temas
        </button>
        <label className="flex items-center gap-2 text-[13px] text-tinta-suave">
          <input
            type="checkbox"
            checked={usarCronometro}
            onChange={(e) => setUsarCronometro(e.target.checked)}
            className="h-4 w-4 accent-azul-elas"
          />
          <Clock className="h-4 w-4" />
          {usarCronometro ? `${mm}:${ss}` : "Cronômetro"}
        </label>
      </div>

      <h2 className="font-titulo text-[18px] font-semibold text-tinta">
        {iniciado.tema_nome}
      </h2>

      <ol className="space-y-4">
        {iniciado.questoes.map((q, i) => (
          <QuestaoItem
            key={q.id}
            numero={i + 1}
            questao={q}
            escolhida={respostas[q.id]}
            onEscolher={(idx) => escolher(q.id, idx)}
          />
        ))}
      </ol>

      {erro && <p className="text-[13px] text-perigo">{erro}</p>}

      <Button
        bloco
        onClick={finalizar}
        disabled={enviando}
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Finalizar ({respondidas}/{iniciado.questoes.length})
      </Button>
    </div>
  );
}

function QuestaoItem({
  numero,
  questao,
  escolhida,
  onEscolher,
}: {
  numero: number;
  questao: QuestaoPublica;
  escolhida: number | undefined;
  onEscolher: (idx: number) => void;
}) {
  return (
    <li className="rounded-card border border-borda bg-fundo p-4">
      <p className="font-semibold text-tinta">
        {numero}. {questao.enunciado}
      </p>
      <div className="mt-2 space-y-2">
        {questao.alternativas.map((alt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onEscolher(idx)}
            className={cn(
              "flex w-full items-center gap-2 rounded-chip border px-3 py-2 text-left text-[14px] transition-colors",
              escolhida === idx
                ? "border-azul-elas bg-azul-elas-suave text-tinta"
                : "border-borda bg-fundo text-tinta hover:border-azul-elas/60",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border text-[11px] font-bold",
                escolhida === idx
                  ? "border-azul-elas bg-azul-elas text-white"
                  : "border-tinta-suave/50 text-tinta-suave",
              )}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            {alt}
          </button>
        ))}
      </div>
    </li>
  );
}

function Resultado({
  resultado,
  onSair,
}: {
  resultado: ResultadoSimulado;
  onSair: () => void;
}) {
  const [salvo, setSalvo] = useState(false);
  const [toast, setToast] = useState(false);
  const pct = resultado.total
    ? Math.round((resultado.nota / resultado.total) * 100)
    : 0;

  // O simulado já é persistido ao finalizar; o botão confirma e avisa a usuária.
  function salvar() {
    setSalvo(true);
    setToast(true);
    setTimeout(() => setToast(false), 4000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-borda bg-azul-elas-suave/60 p-4 text-center">
        <p className="font-titulo text-[28px] font-bold text-azul-elas">
          {resultado.nota}/{resultado.total}
        </p>
        <p className="text-[13px] text-tinta-suave">{pct}% de acerto</p>
      </div>

      <ol className="space-y-3">
        {resultado.revisao.map((r, i) => (
          <li key={r.id} className="rounded-card border border-borda bg-fundo p-4">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill text-white",
                  r.acertou ? "bg-sucesso" : "bg-perigo",
                )}
              >
                {r.acertou ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
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
                    idx === r.correta && "bg-sucesso/10 font-semibold text-sucesso",
                    idx === r.escolhida && idx !== r.correta && "bg-perigo/10 text-perigo",
                  )}
                >
                  {String.fromCharCode(65 + idx)}. {alt}
                  {idx === r.correta && " ✓"}
                  {idx === r.escolhida && idx !== r.correta && " (sua resposta)"}
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

      <Button bloco onClick={salvar} disabled={salvo}>
        <BookmarkCheck className="h-4 w-4" />
        {salvo ? "Relatório salvo" : "Salvar relatório"}
      </Button>

      <Button bloco variante="secondary" onClick={onSair}>
        Voltar aos temas
      </Button>

      {/* Toast de confirmação */}
      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit items-center gap-2 rounded-pill bg-tinta px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg md:bottom-8"
        >
          <BookmarkCheck className="h-4 w-4 text-rosa-elas" />
          Salvo em Minha jornada
        </div>
      )}
    </div>
  );
}
