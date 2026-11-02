// Gera os ícones do PWA a partir da miniatura oficial da marca
// (public/brand/miniatura.jpeg): recorta o quadrado vinho central (removendo
// a moldura rosa clara) e exporta nos tamanhos do PWA.
//
// Uso: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const FONTE = "public/brand/miniatura.jpeg";
const OUT = "public/icons";
const VINHO = "#990521"; // usado como fundo das versões "any" e maskable

// Recorte do quadrado vinho dentro da miniatura (a imagem tem borda rosa).
// A moldura ocupa ~11% de cada lado; recortamos um quadrado central.
async function recorteQuadrado() {
  const img = sharp(FONTE);
  const { width, height } = await img.metadata();
  const lado = Math.round(Math.min(width, height) * 0.71); // quadrado central (sem a moldura rosa)
  const left = Math.round((width - lado) / 2);
  const top = Math.round((height - lado) / 2);
  return sharp(FONTE)
    .extract({ left, top, width: lado, height: lado })
    .toBuffer();
}

async function png(buf, size, name, { pad = 0 } = {}) {
  if (pad > 0) {
    // Versão maskable: encolhe o ícone dentro de um quadrado vinho (safe zone).
    const inner = Math.round(size * (1 - pad * 2));
    const icone = await sharp(buf).resize(inner, inner).toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: VINHO,
      },
    })
      .composite([{ input: icone, gravity: "center" }])
      .png()
      .toFile(`${OUT}/${name}`);
  } else {
    await sharp(buf).resize(size, size).png().toFile(`${OUT}/${name}`);
  }
  console.log("gerado", name);
}

await mkdir(OUT, { recursive: true });
const base = await recorteQuadrado();
await png(base, 192, "icon-192.png");
await png(base, 512, "icon-512.png");
await png(base, 512, "maskable-512.png", { pad: 0.14 });
await png(base, 180, "apple-touch-icon.png");
console.log("ícones do PWA gerados em", OUT, "a partir de", FONTE);
