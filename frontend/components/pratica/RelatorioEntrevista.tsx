"use client";

import { useState } from "react";
import { Download, ThumbsUp, Wrench, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { baixarPdfRelatorio } from "@/lib/pdfRelatorio";
import type { Entrevista, RelatorioEntrevista as Relatorio } from "@/lib/types";

function Secao({
  titulo,
  Icone,
  itens,
}: {
  titulo: string;
  Icone: typeof ThumbsUp;
  itens: string[];
}) {
  if (!itens?.length) return null;
  return (
    <div>
      <h3 className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-azul-elas">
        <Icone className="h-4 w-4" strokeWidth={1.75} /> {titulo}
      </h3>
      <ul className="mt-1.5 space-y-1">
        {itens.map((i, idx) => (
          <li key={idx} className="text-[14px] text-tinta">
            • {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RelatorioEntrevista({
  entrevista,
  relatorio,
}: {
  entrevista: Entrevista;
  relatorio: Relatorio;
}) {
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar() {
    setBaixando(true);
    setErro(null);
    try {
      await baixarPdfRelatorio(entrevista, relatorio);
    } catch {
      setErro("Não foi possível gerar o PDF.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-borda bg-azul-elas-suave/60 p-4 text-center">
        <p className="font-titulo text-[28px] font-bold text-azul-elas">
          {relatorio.nota_geral}/10
        </p>
        <p className="text-[13px] text-tinta-suave">Nota geral</p>
      </div>

      <Secao titulo="Pontos fortes" Icone={ThumbsUp} itens={relatorio.pontos_fortes} />
      <Secao titulo="A melhorar" Icone={Wrench} itens={relatorio.melhorias} />

      {relatorio.por_pergunta?.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold text-azul-elas">Por pergunta</h3>
          <ol className="mt-2 space-y-3">
            {relatorio.por_pergunta.map((p, i) => (
              <li key={i} className="rounded-card border border-borda p-3">
                <p className="text-[14px] font-semibold text-tinta">
                  {i + 1}. {p.pergunta}
                </p>
                {p.resumo_resposta && (
                  <p className="mt-1 text-[13px] text-tinta-suave">
                    Sua resposta: {p.resumo_resposta}
                  </p>
                )}
                {p.avaliacao && (
                  <p className="mt-1 text-[13px] text-tinta">{p.avaliacao}</p>
                )}
                {p.sugestao && (
                  <p className="mt-1 text-[13px] text-azul-elas">💡 {p.sugestao}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <Secao titulo="Próximos passos" Icone={ArrowRight} itens={relatorio.proximos_passos} />

      {erro && <p className="text-[13px] text-perigo">{erro}</p>}

      <Button variante="secondary" bloco onClick={baixar} disabled={baixando}>
        {baixando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Baixar PDF
      </Button>
    </div>
  );
}
