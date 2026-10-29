/**
 * Upload direto do navegador para o Cloudflare R2 via URL pré-assinada.
 *
 * Usa XMLHttpRequest (e não fetch) porque só o XHR expõe o progresso do
 * upload. A URL pré-assinada vem do backend (POST /api/aulas/upload-url/) e
 * exige o mesmo Content-Type usado para assinar.
 */

import { apiAuthJson } from "@/lib/api";
import type { UploadUrlResp } from "@/lib/types";

export interface LimitesUpload {
  videoMaxBytes: number;
  imgMaxBytes: number;
  videoMaxSeg: number;
}

export const LIMITES: LimitesUpload = {
  videoMaxBytes: 209_715_200, // 200 MB
  imgMaxBytes: 5_242_880, // 5 MB
  videoMaxSeg: 600, // 10 min
};

export const TIPOS_VIDEO = ["video/mp4", "video/webm"];
export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

/**
 * Redimensiona e recomprime uma imagem no navegador antes do upload.
 *
 * Resolve dois problemas de fotos vindas da câmera do celular:
 *  - tamanho enorme (muitos MP) que estoura memória e faz o app recarregar;
 *  - formatos como HEIC/HEIF que o backend não aceita — a saída é sempre JPEG.
 *
 * Mantém a proporção, limita o maior lado a `maxLado` px e exporta em JPEG.
 * Se algo falhar (ex.: formato que o navegador não decodifica), devolve o
 * arquivo original para o fluxo normal de validação tratar.
 */
export async function comprimirImagem(
  arquivo: File,
  maxLado = 1600,
  qualidade = 0.82,
): Promise<File> {
  // GIF animado: não mexer (perderia a animação).
  if (arquivo.type === "image/gif") return arquivo;

  try {
    const bitmap = await carregarBitmap(arquivo);
    const { width, height } = bitmap;
    const escala = Math.min(1, maxLado / Math.max(width, height));
    const w = Math.round(width * escala);
    const h = Math.round(height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, w, h);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", qualidade),
    );
    if (!blob) return arquivo;

    const nome = (arquivo.name || "foto").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

/** Decodifica o arquivo em um ImageBitmap (com fallback via <img>). */
async function carregarBitmap(
  arquivo: File,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(arquivo);
    } catch {
      /* cai para o fallback abaixo */
    }
  }
  const url = URL.createObjectURL(arquivo);
  try {
    const img = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("imagem inválida"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lê a duração (em segundos) de um arquivo de vídeo pelo elemento <video>. */
export function lerDuracaoVideo(arquivo: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration || 0));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler o vídeo."));
    };
    video.src = url;
  });
}

/** Valida tipo/tamanho (e duração, se vídeo). Retorna mensagem de erro ou null. */
export async function validarArquivo(
  arquivo: File,
  tipo: "video" | "imagem",
): Promise<string | null> {
  if (tipo === "video") {
    if (!TIPOS_VIDEO.includes(arquivo.type)) {
      return "Formato não suportado. Envie um vídeo MP4 ou WebM.";
    }
    if (arquivo.size > LIMITES.videoMaxBytes) {
      return "Vídeo acima de 200 MB. Escolha um arquivo menor.";
    }
    try {
      const seg = await lerDuracaoVideo(arquivo);
      if (seg > LIMITES.videoMaxSeg) {
        return "Vídeo acima de 10 minutos. Escolha um vídeo mais curto.";
      }
    } catch {
      return "Não foi possível ler o vídeo. Tente outro arquivo.";
    }
    return null;
  }
  // imagem
  if (!TIPOS_IMAGEM.includes(arquivo.type)) {
    return "Imagem não suportada. Use JPG, PNG ou WebP.";
  }
  if (arquivo.size > LIMITES.imgMaxBytes) {
    return "Imagem acima de 5 MB.";
  }
  return null;
}

/** Faz o PUT direto no R2 com callback de progresso (0–100). */
function putComProgresso(
  url: string,
  arquivo: File,
  contentType: string,
  onProgresso: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgresso(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Falha no upload (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Erro de rede durante o upload."));
    xhr.send(arquivo);
  });
}

/**
 * Pede a URL pré-assinada ao backend e envia o arquivo direto ao R2.
 * Retorna a chave do objeto para confirmar a criação da aula.
 */
export async function enviarParaR2(
  arquivo: File,
  tipo: "video" | "imagem",
  onProgresso: (pct: number) => void,
): Promise<string> {
  const presign = await apiAuthJson<UploadUrlResp>("/api/aulas/upload-url/", {
    method: "POST",
    body: JSON.stringify({
      tipo,
      content_type: arquivo.type,
      tamanho: arquivo.size,
    }),
  });
  await putComProgresso(presign.url, arquivo, presign.content_type, onProgresso);
  return presign.key;
}

/**
 * Envia a foto de perfil ao R2 (endpoint próprio, liberado a qualquer usuária)
 * e devolve a URL pública para salvar no perfil via PATCH /api/me/.
 */
export async function enviarFotoPerfil(
  arquivo: File,
  onProgresso: (pct: number) => void,
): Promise<string> {
  const presign = await apiAuthJson<UploadUrlResp & { url_publica: string }>(
    "/api/me/foto-upload-url/",
    {
      method: "POST",
      body: JSON.stringify({
        content_type: arquivo.type,
        tamanho: arquivo.size,
      }),
    },
  );
  await putComProgresso(presign.url, arquivo, presign.content_type, onProgresso);
  return presign.url_publica;
}
