/**
 * PDF do relatório de entrevista — no cliente (jsPDF).
 */

import type { Entrevista, RelatorioEntrevista } from "@/lib/types";

const AZUL: [number, number, number] = [31, 78, 158];
const ROSA: [number, number, number] = [235, 131, 158];
const TINTA: [number, number, number] = [26, 29, 43];
const SUAVE: [number, number, number] = [91, 96, 112];

export async function baixarPdfRelatorio(
  entrevista: Entrevista,
  relatorio: RelatorioEntrevista,
): Promise<void> {
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
  doc.text("Relatório de entrevista", largura - margem, 16, { align: "right" });
  y = 38;

  doc.setTextColor(...TINTA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(entrevista.vaga, margem, y);
  y += 7;
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(1);
  doc.line(margem, y, margem + 30, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...AZUL);
  doc.text(`Nota geral: ${relatorio.nota_geral}/10`, margem, y);
  y += 8;

  const lista = (titulo: string, itens: string[]) => {
    if (!itens?.length) return;
    y = quebra(doc, y, altura, margem, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...AZUL);
    doc.text(titulo, margem, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...TINTA);
    for (const item of itens) {
      y = paragrafo(doc, `•  ${item}`, margem, y, larguraTexto, 5, altura);
    }
    y += 3;
  };

  lista("Pontos fortes", relatorio.pontos_fortes);
  lista("A melhorar", relatorio.melhorias);

  if (relatorio.por_pergunta?.length) {
    y = quebra(doc, y, altura, margem, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...AZUL);
    doc.text("Por pergunta", margem, y);
    y += 6;
    relatorio.por_pergunta.forEach((p, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...TINTA);
      y = paragrafo(doc, `${i + 1}. ${p.pergunta}`, margem, y, larguraTexto, 5, altura);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SUAVE);
      if (p.avaliacao)
        y = paragrafo(doc, `Avaliação: ${p.avaliacao}`, margem, y, larguraTexto, 5, altura);
      if (p.sugestao)
        y = paragrafo(doc, `Sugestão: ${p.sugestao}`, margem, y, larguraTexto, 5, altura);
      y += 2;
    });
  }

  lista("Próximos passos", relatorio.proximos_passos);

  doc.save(`por-elas-entrevista-${entrevista.id}.pdf`);
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
