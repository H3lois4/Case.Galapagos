"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PlanoChecklist } from "@/components/carreira/PlanoChecklist";
import { MinhasMentorias } from "@/components/mentoria/MinhasMentorias";
import { SimuladoReviewModal } from "@/components/pratica/SimuladoReviewModal";
import { EntrevistaReviewModal } from "@/components/pratica/EntrevistaReviewModal";
import { apiAuthJson } from "@/lib/api";
import type {
  EntrevistaHistorico,
  Mentoria,
  PlanoCarreira,
  SimuladoHistorico,
} from "@/lib/types";

function dataCurta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

/** Cabeçalho de cada bloco, com link "ver tudo" para a área do app. */
function Secao({
  titulo,
  href,
  rotuloLink,
  children,
}: {
  titulo: string;
  href: string;
  rotuloLink: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-tinta">{titulo}</h3>
        <Link
          href={href}
          className="shrink-0 text-[12px] font-semibold text-azul-elas hover:underline"
        >
          {rotuloLink}
        </Link>
      </div>
      {children}
    </div>
  );
}

/**
 * "Minha jornada": plano de carreira, mentorias, simulados e entrevistas da
 * usuária. Busca os próprios dados (cada fonte falha de forma independente).
 * Exibido na Home.
 */
export function MinhaJornada({ titulo = "Minha Jornada" }: { titulo?: string }) {
  const [plano, setPlano] = useState<PlanoCarreira | null>(null);
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [simulados, setSimulados] = useState<SimuladoHistorico[]>([]);
  const [entrevistas, setEntrevistas] = useState<EntrevistaHistorico[]>([]);
  const [nomesTemas, setNomesTemas] = useState<Record<string, string>>({});
  const [simuladoAberto, setSimuladoAberto] = useState<number | null>(null);
  const [entrevistaAberta, setEntrevistaAberta] = useState<number | null>(null);

  useEffect(() => {
    // Plano de carreira (pode não existir → 404, tratado como "sem plano")
    apiAuthJson<PlanoCarreira>("/api/carreira/plano/")
      .then(setPlano)
      .catch(() => setPlano(null));
    apiAuthJson<Mentoria[]>("/api/mentoria/minhas/")
      .then(setMentorias)
      .catch(() => setMentorias([]));
    apiAuthJson<SimuladoHistorico[]>("/api/pratica/simulados/historico/")
      .then(setSimulados)
      .catch(() => setSimulados([]));
    apiAuthJson<EntrevistaHistorico[]>("/api/pratica/entrevistas/historico/")
      .then(setEntrevistas)
      .catch(() => setEntrevistas([]));
    // Nomes dos temas, para mostrar "Renda fixa" em vez do slug.
    apiAuthJson<{ slug: string; nome: string }[]>("/api/pratica/temas/")
      .then((temas) =>
        setNomesTemas(Object.fromEntries(temas.map((t) => [t.slug, t.nome]))),
      )
      .catch(() => setNomesTemas({}));
  }, []);

  return (
    <Card>
      <h2 className="font-titulo text-[18px] font-semibold text-tinta">{titulo}</h2>

      <Secao titulo="Plano de carreira" href="/carreira" rotuloLink="Carreira">
        {plano ? (
          <div className="mt-2">
            <PlanoChecklist plano={plano} onMudou={setPlano} />
          </div>
        ) : (
          <p className="mt-1 text-[13px] text-tinta-suave">
            Você ainda não tem um plano.{" "}
            <Link href="/carreira" className="font-semibold text-azul-elas hover:underline">
              Montar com a IA de carreira
            </Link>
            .
          </p>
        )}
      </Secao>

      <Secao titulo="Minhas mentorias" href="/mentoria" rotuloLink="Agendar">
        <div className="mt-2">
          <MinhasMentorias mentorias={mentorias} onMudou={setMentorias} compacto />
        </div>
      </Secao>

      <Secao titulo="Simulados" href="/pratica" rotuloLink="Praticar">
        {simulados.length === 0 ? (
          <p className="mt-1 text-[13px] text-tinta-suave">
            Nenhum simulado feito.{" "}
            <Link href="/pratica" className="font-semibold text-azul-elas hover:underline">
              Fazer um
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-[13px]">
            {simulados.slice(0, 5).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSimuladoAberto(s.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-chip px-2 py-1.5 text-left text-tinta transition-colors hover:bg-fundo-alt"
                >
                  <span className="truncate">{nomesTemas[s.tema] ?? s.tema}</span>
                  <span className="shrink-0 text-tinta-suave">
                    {s.nota}/{s.total} · {dataCurta(s.criado_em)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao titulo="Entrevistas" href="/pratica" rotuloLink="Treinar">
        {entrevistas.length === 0 ? (
          <p className="mt-1 text-[13px] text-tinta-suave">
            Nenhuma entrevista feita.{" "}
            <Link href="/pratica" className="font-semibold text-azul-elas hover:underline">
              Simular uma com a IA
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-[13px]">
            {entrevistas.slice(0, 5).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setEntrevistaAberta(e.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-chip px-2 py-1.5 text-left text-tinta transition-colors hover:bg-fundo-alt"
                >
                  <span className="truncate">{e.vaga}</span>
                  <span className="shrink-0 text-tinta-suave">
                    {e.nota_geral != null ? `${e.nota_geral}/10 · ` : "Sem feedback · "}
                    {dataCurta(e.criado_em)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {simuladoAberto !== null && (
        <SimuladoReviewModal
          attemptId={simuladoAberto}
          onFechar={() => setSimuladoAberto(null)}
        />
      )}

      {entrevistaAberta !== null && (
        <EntrevistaReviewModal
          entrevistaId={entrevistaAberta}
          onFechar={() => setEntrevistaAberta(null)}
          onRelatorioGerado={(atualizada) =>
            // Atualiza a nota na lista sem recarregar.
            setEntrevistas((lista) =>
              lista.map((e) =>
                e.id === atualizada.id
                  ? {
                      ...e,
                      nota_geral: atualizada.nota_geral,
                      finalizado_em: atualizada.finalizado_em,
                    }
                  : e,
              ),
            )
          }
        />
      )}
    </Card>
  );
}
