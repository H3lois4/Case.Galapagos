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
