/**
 * Gera o relatório de simulado como IMAGEM (PNG) no cliente, desenhando num
 * canvas. Imagem costuma ter suporte melhor que PDF na Web Share API de alguns
 * navegadores (ex.: Samsung Internet). Devolve um File PNG.
 */

import type { ResultadoSimulado } from "@/lib/types";

const AZUL = "#990521"; // vinho
const ROSA = "#EB839E";
const TINTA = "#3A1F26"; // ameixa
const SUAVE = "#7A6168"; // malva
const SUCESSO = "#3D7A5C"; // sálvia
const BORDA = "#ECDFE2";

const LARGURA = 1080; // largura fixa (boa para compartilhar em redes)
const MARGEM = 56;
const CONTEUDO = LARGURA - MARGEM * 2;

export async function gerarImagemSimulado(
  resultado: ResultadoSimulado,
  temaNome: string,
): Promise<File> {
  // Mede a altura necessária primeiro (canvas de medição), depois desenha.
  const medidor = document.createElement("canvas").getContext("2d")!;
  const alturaTotal = calcularAltura(medidor, resultado, temaNome);

  const canvas = document.createElement("canvas");
  const dpr = 2; // nitidez
  canvas.width = LARGURA * dpr;
  canvas.height = alturaTotal * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // Fundo
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, LARGURA, alturaTotal);

  // Cabeçalho azul
  ctx.fillStyle = AZUL;
  ctx.fillRect(0, 0, LARGURA, 90);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Por ELAS finance", MARGEM, 56);
  ctx.font = "20px Arial, sans-serif";
  const subt = "Relatório de simulado";
  ctx.fillText(subt, LARGURA - MARGEM - ctx.measureText(subt).width, 54);

  let y = 150;

  // Tema
  ctx.fillStyle = TINTA;
  ctx.font = "bold 40px Arial, sans-serif";
  y = texto(ctx, temaNome, MARGEM, y, CONTEUDO, 46, "bold 40px Arial, sans-serif", TINTA);
  // traço rosa
  ctx.strokeStyle = ROSA;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(MARGEM, y + 2);
  ctx.lineTo(MARGEM + 70, y + 2);
  ctx.stroke();
  y += 34;

  // Acertos
  const pct = resultado.total
    ? Math.round((resultado.nota / resultado.total) * 100)
    : 0;
  ctx.fillStyle = AZUL;
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillText(
    `Acertos: ${resultado.nota} de ${resultado.total}  (${pct}%)`,
    MARGEM,
    y + 10,
  );
  y += 54;

  // Questões
  resultado.revisao.forEach((r, i) => {
    const marca = r.acertou ? "  ✓ acertou" : "  ✕ errou";
    y = texto(
      ctx,
      `${i + 1}. ${r.enunciado}${marca}`,
      MARGEM,
      y,
      CONTEUDO,
      30,
      "bold 24px Arial, sans-serif",
      TINTA,
    );
    y += 6;

    r.alternativas.forEach((alt, idx) => {
      const letra = String.fromCharCode(65 + idx);
      const ehCorreta = idx === r.correta;
      const ehEscolhida = idx === r.escolhida;
      let sufixo = "";
      if (ehCorreta) sufixo = "  (correta)";
      else if (ehEscolhida) sufixo = "  (sua resposta)";
      const cor = ehCorreta ? SUCESSO : TINTA;
      const fonte = ehCorreta
        ? "bold 22px Arial, sans-serif"
        : "22px Arial, sans-serif";
      y = texto(ctx, `${letra}. ${alt}${sufixo}`, MARGEM + 20, y, CONTEUDO - 20, 28, fonte, cor);
    });

    if (r.explicacao) {
      y += 2;
      y = texto(
        ctx,
        `Por quê: ${r.explicacao}`,
        MARGEM + 20,
        y,
        CONTEUDO - 20,
        26,
        "italic 20px Arial, sans-serif",
        SUAVE,
      );
    }

    // linha separadora
    y += 14;
    ctx.strokeStyle = BORDA;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGEM, y);
    ctx.lineTo(LARGURA - MARGEM, y);
    ctx.stroke();
    y += 22;
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Não foi possível gerar a imagem.");
  return new File([blob], `por-elas-simulado-${resultado.attempt_id}.png`, {
    type: "image/png",
  });
}

/** Desenha texto com quebra de linha; devolve o novo y. */
function texto(
  ctx: CanvasRenderingContext2D,
  conteudo: string,
  x: number,
  y: number,
  largura: number,
  alturaLinha: number,
  fonte: string,
  cor: string,
): number {
  ctx.font = fonte;
  ctx.fillStyle = cor;
  for (const linha of quebrarLinhas(ctx, conteudo, largura)) {
    ctx.fillText(linha, x, y);
    y += alturaLinha;
  }
  return y;
}

/** Mede a altura total do relatório sem desenhar. */
function calcularAltura(
  ctx: CanvasRenderingContext2D,
  resultado: ResultadoSimulado,
  temaNome: string,
): number {
  let y = 150;
  y += contarLinhas(ctx, temaNome, CONTEUDO, "bold 40px Arial, sans-serif") * 46;
  y += 34 + 54;
  resultado.revisao.forEach((r) => {
    y +=
      contarLinhas(ctx, `${r.enunciado}xx`, CONTEUDO, "bold 24px Arial, sans-serif") *
        30 +
      6;
    r.alternativas.forEach((alt) => {
      y += contarLinhas(ctx, `A. ${alt} (sua resposta)`, CONTEUDO - 20, "22px Arial, sans-serif") * 28;
    });
    if (r.explicacao) {
      y += 2 + contarLinhas(ctx, `Por quê: ${r.explicacao}`, CONTEUDO - 20, "italic 20px Arial, sans-serif") * 26;
    }
    y += 14 + 22;
  });
  return y + MARGEM;
}

function contarLinhas(
  ctx: CanvasRenderingContext2D,
  conteudo: string,
  largura: number,
  fonte: string,
): number {
  ctx.font = fonte;
  return quebrarLinhas(ctx, conteudo, largura).length;
}

function quebrarLinhas(
  ctx: CanvasRenderingContext2D,
  conteudo: string,
  largura: number,
): string[] {
  const palavras = conteudo.split(/\s+/);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(tentativa).width > largura && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas.length ? linhas : [""];
}
