// Gera os ícones do PWA (placeholder): símbolo de barras + seta, rosa sobre
// fundo azul da marca. Substitua pelos ícones oficiais quando a logo chegar.
//
// Uso: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const AZUL = "#1F4E9E";
const ROSA = "#EB839E";
const OUT = "public/icons";

// `pad` = margem interna para versão maskable (safe zone).
function svg(size, { rounded, pad }) {
  const bg = rounded
    ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${AZUL}"/>`
    : `<rect width="${size}" height="${size}" fill="${AZUL}"/>`;
  // Desenha o símbolo num viewBox 24x24, centralizado com escala/translação.
  const inner = size * (1 - pad * 2);
  const scale = inner / 24;
  const offset = size * pad;
  const stroke = 2.4;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <g transform="translate(${offset} ${offset}) scale(${scale})"
     fill="none" stroke="${ROSA}" stroke-width="${stroke}"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 20V11M10 20V7M16 20v-4"/>
    <path d="M14 5h6v6"/>
    <path d="M20 5l-9 9"/>
  </g>
</svg>`;
}

async function png(size, opts, name) {
  const buf = Buffer.from(svg(size, opts));
  await sharp(buf).png().toFile(`${OUT}/${name}`);
  console.log("gerado", name);
}

await mkdir(OUT, { recursive: true });
await png(192, { rounded: true, pad: 0.22 }, "icon-192.png");
await png(512, { rounded: true, pad: 0.22 }, "icon-512.png");
await png(512, { rounded: false, pad: 0.3 }, "maskable-512.png");
await png(180, { rounded: true, pad: 0.22 }, "apple-touch-icon.png");
console.log("ícones do PWA gerados em", OUT);
