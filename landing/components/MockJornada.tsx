import { Compass, MessageCircleHeart, Mic, ClipboardCheck } from "lucide-react";
import { Logo } from "./Logo";

/**
 * Prévia ilustrativa da tela de Início do app ("Minha Jornada"), feita em
 * HTML/CSS com os mesmos tokens — fica nítida e acompanha o tema.
 */
export function MockJornada() {
  const itens = [
    { Icone: Compass, titulo: "Plano de carreira", detalhe: "3 de 5 passos concluídos", progresso: 60 },
    { Icone: MessageCircleHeart, titulo: "Mentoria agendada", detalhe: "Qui, 14h · Research" },
    { Icone: ClipboardCheck, titulo: "Simulado · Certificações / CPA", detalhe: "8/10 acertos" },
    { Icone: Mic, titulo: "Entrevista com IA · Analista", detalhe: "Nota 8/10 · ver relatório" },
  ];

  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-[22rem] rounded-[2rem] border border-borda bg-fundo p-3 shadow-[0_24px_60px_-20px_rgba(153,5,33,0.35)]"
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-borda">
        <div className="flex items-center justify-between border-b border-borda bg-topo px-4 py-3">
          <Logo className="h-7 w-auto" />
          <span className="h-8 w-8 rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas" />
        </div>
        <div className="space-y-3 bg-fundo p-4">
          <p className="font-titulo text-[18px] font-bold text-tinta">
            Olá, <span className="text-azul-elas">Ana</span>!
          </p>
          <div className="rounded-card border border-borda bg-fundo p-3 shadow-[var(--sombra-card)]">
            <p className="font-titulo text-[14px] font-semibold text-tinta">Minha Jornada</p>
            <ul className="mt-2 space-y-2">
              {itens.map(({ Icone, titulo, detalhe, progresso }) => (
                <li key={titulo} className="flex items-start gap-2.5 rounded-chip bg-fundo-alt p-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
                    <Icone className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-tinta">{titulo}</span>
                    <span className="block text-[11px] text-tinta-suave">{detalhe}</span>
                    {progresso !== undefined && (
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-pill bg-rosa-elas-suave">
                        <span className="block h-full rounded-pill bg-azul-elas" style={{ width: `${progresso}%` }} />
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
