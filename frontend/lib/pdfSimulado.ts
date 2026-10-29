/**
 * PDF do relatório de simulado — gerado no cliente (jsPDF).
 * Inclui o número de acertos e todas as questões com a resposta correta
 * marcada e a explicação. Devolve um File (para compartilhar ou baixar).
 */

import type { ResultadoSimulado } from "@/lib/types";

const AZUL: [number, number, number] = [31, 78, 158];
const ROSA: [number, number, number] = [235, 131, 158];
const TINTA: [number, number, number] = [26, 29, 43];
const SUAVE: [number, number, number] = [91, 96, 112];
const SUCESSO: [number, number, number] = [26, 122, 76];

export async function gerarPdfSimulado(
  resultado: ResultadoSimulado,
  temaNome: string,
): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 16;
  const larguraTexto = largura - margem * 2;
  let y = 0;

  // Cabeçalho
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, largura, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Por ELAS finance", margem, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Relatório de simulado", largura - margem, 16, { align: "right" });
  y = 38;

  // Título (tema)
  doc.setTextColor(...TINTA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(temaNome, margem, y);
  y += 7;
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(1);
  doc.line(margem, y, margem + 30, y);
  y += 9;

  // Nota / acertos
  const pct = resultado.total
    ? Math.round((resultado.nota / resultado.total) * 100)
    : 0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...AZUL);
  doc.text(
    `Acertos: ${resultado.nota} de ${resultado.total}  (${pct}%)`,
    margem,
    y,
  );
  y += 10;

  // Questões
  resultado.revisao.forEach((r, i) => {
    y = quebra(doc, y, altura, margem, 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TINTA);
    const marca = r.acertou ? "[acertou]" : "[errou]";
    y = paragrafo(
      doc,
      `${i + 1}. ${r.enunciado}  ${marca}`,
      margem,
      y,
      larguraTexto,
      5,
      altura,
    );
    y += 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    r.alternativas.forEach((alt, idx) => {
      const letra = String.fromCharCode(65 + idx);
      const ehCorreta = idx === r.correta;
      const ehEscolhida = idx === r.escolhida;
      let sufixo = "";
      if (ehCorreta) sufixo = "  <- correta";
      if (ehEscolhida && !ehCorreta) sufixo = "  (sua resposta)";

      if (ehCorreta) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...SUCESSO);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TINTA);
      }
      y = paragrafo(
        doc,
        `${letra}. ${alt}${sufixo}`,
        margem + 4,
        y,
        larguraTexto - 4,
        5,
        altura,
      );
    });

    if (r.explicacao) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(...SUAVE);
      y = paragrafo(
        doc,
        `Por quê: ${r.explicacao}`,
        margem + 4,
        y + 1,
        larguraTexto - 4,
        4.5,
        altura,
      );
      doc.setFont("helvetica", "normal");
    }
    y += 5;
  });

  const blob = doc.output("blob");
  return new File([blob], `por-elas-simulado-${resultado.attempt_id}.pdf`, {
    type: "application/pdf",
  });
}

function paragrafo(
  doc: import("jspdf").jsPDF,
  texto: string,
  x: number,
  y: number,
  largura: number,
  alturaLinha: number,
  alturaPagina: number,
): number {
  const linhas = doc.splitTextToSize(texto, largura) as string[];
  for (const linha of linhas) {
    y = quebra(doc, y, alturaPagina, 16, alturaLinha);
    doc.text(linha, x, y);
    y += alturaLinha;
  }
  return y;
}

function quebra(
  doc: import("jspdf").jsPDF,
  y: number,
  alturaPagina: number,
  margem: number,
  precisa: number,
): number {
  if (y + precisa > alturaPagina - margem) {
    doc.addPage();
    return margem + 6;
  }
  return y;
}
