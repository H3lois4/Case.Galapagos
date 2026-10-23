/**
 * Geração do PDF de uma área do mercado financeiro — no cliente (jsPDF).
 *
 * Sem dependência de servidor (as funções serverless têm limite). O layout usa
 * as cores da marca Por ELAS finance.
 */

import type { AreaDetalhe } from "@/lib/types";

const AZUL: [number, number, number] = [31, 78, 158]; // azul-elas
const ROSA: [number, number, number] = [235, 131, 158]; // rosa-elas
const TINTA: [number, number, number] = [26, 29, 43];
const SUAVE: [number, number, number] = [91, 96, 112];

export async function baixarPdfArea(area: AreaDetalhe): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 16;
  const larguraTexto = larguraPagina - margem * 2;
  let y = 0;

  // Cabeçalho com a marca
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, larguraPagina, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Por ELAS finance", margem, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Guia de carreira", larguraPagina - margem, 16, { align: "right" });
  y = 38;

  // Título da área
  doc.setTextColor(...TINTA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(area.nome, margem, y);
  y += 7;
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(1);
  doc.line(margem, y, margem + 30, y);
  y += 8;

  // Resumo
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...SUAVE);
  y = escreverParagrafo(doc, area.resumo, margem, y, larguraTexto, 5);
  y += 4;

  const bloco = (titulo: string, corpo: string | string[]) => {
    if (!corpo || (Array.isArray(corpo) && corpo.length === 0)) return;
    y = garantirEspaco(doc, y, alturaPagina, margem, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...AZUL);
    doc.text(titulo, margem, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...TINTA);
    if (Array.isArray(corpo)) {
      for (const item of corpo) {
        y = garantirEspaco(doc, y, alturaPagina, margem, 8);
        y = escreverParagrafo(doc, `•  ${item}`, margem, y, larguraTexto, 5);
      }
    } else {
      y = escreverParagrafo(doc, corpo, margem, y, larguraTexto, 5);
    }
    y += 4;
  };

  bloco("Descrição", area.descricao);
  bloco("Formação comum", area.formacao);
  bloco("Certificações", area.certificacoes);
  bloco("Hard skills", area.hard_skills);
  bloco("Soft skills", area.soft_skills);
  bloco("Cargos de entrada", area.cargos_entrada);

  if (area.mulheres?.length) {
    y = garantirEspaco(doc, y, alturaPagina, margem, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...AZUL);
    doc.text("Mulheres que atuam na área", margem, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...TINTA);
    for (const m of area.mulheres) {
      y = garantirEspaco(doc, y, alturaPagina, margem, 8);
      const linha = `•  ${m.nome}${m.cargo ? ` — ${m.cargo}` : ""}`;
      y = escreverParagrafo(doc, linha, margem, y, larguraTexto, 5);
      if (m.linkedin) {
        doc.setTextColor(...AZUL);
        doc.textWithLink("   LinkedIn", margem, y, { url: m.linkedin });
        doc.setTextColor(...TINTA);
        y += 5;
      }
    }
  }

  doc.save(`por-elas-${area.slug}.pdf`);
}

function escreverParagrafo(
  doc: import("jspdf").jsPDF,
  texto: string,
  x: number,
  y: number,
  largura: number,
  alturaLinha: number,
): number {
  const linhas = doc.splitTextToSize(texto, largura) as string[];
  const alturaPagina = doc.internal.pageSize.getHeight();
  for (const linha of linhas) {
    y = garantirEspaco(doc, y, alturaPagina, 16, alturaLinha);
    doc.text(linha, x, y);
    y += alturaLinha;
  }
  return y;
}

function garantirEspaco(
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
