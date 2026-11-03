"use client";

import { useRef, useState } from "react";
import {
  X,
  UploadCloud,
  Loader2,
  FileVideo,
  ImagePlus,
  MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuthJson } from "@/lib/api";
import {
  enviarParaR2,
  lerDuracaoVideo,
  validarArquivo,
} from "@/lib/upload";
import type { Aula } from "@/lib/types";

interface Props {
  onFechar: () => void;
  onCriada: (aula: Aula) => void;
  /** Administradora (Por ELAS): mostra o seletor "Publicar como". */
  ehAdmin?: boolean;
}

type PostarComo = "ia" | "empresa";
type Fonte = "upload" | "youtube";

type Etapa = "form" | "enviando-video" | "enviando-thumb" | "salvando";

/** Extrai o ID (11 chars) de um link do YouTube, ou null se inválido. */
function extrairYoutubeId(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(u)) return u;
  const padroes = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|v)\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of padroes) {
    const m = u.match(p);
    if (m) return m[1];
  }
  return null;
}

export function UploadAulaModal({ onFechar, onCriada, ehAdmin = false }: Props) {
  const [fonte, setFonte] = useState<Fonte>("upload");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [postarComo, setPostarComo] = useState<PostarComo>("ia");
  const [video, setVideo] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumb, setThumb] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroVideo, setErroVideo] = useState<string | null>(null);
  const [erroYoutube, setErroYoutube] = useState<string | null>(null);
  const [erroThumb, setErroThumb] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [progresso, setProgresso] = useState(0);
  const videoInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);

  const enviando = etapa !== "form";

  async function escolherVideo(arquivo: File | null) {
    setErroVideo(null);
    if (!arquivo) {
      setVideo(null);
      return;
    }
    const msg = await validarArquivo(arquivo, "video");
    if (msg) {
      setErroVideo(msg);
      setVideo(null);
      return;
    }
    setVideo(arquivo);
  }

  async function escolherThumb(arquivo: File | null) {
    setErroThumb(null);
    if (!arquivo) {
      setThumb(null);
      return;
    }
    const msg = await validarArquivo(arquivo, "imagem");
    if (msg) {
      setErroThumb(msg);
      setThumb(null);
      return;
    }
    setThumb(arquivo);
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErroVideo(null);
    setErroYoutube(null);

    if (!titulo.trim()) {
      setErro("Dê um título para a aula.");
      return;
    }

    // Valida o conteúdo conforme a fonte escolhida.
    let youtubeId: string | null = null;
    if (fonte === "upload") {
      if (!video) {
        setErroVideo("Escolha um arquivo de vídeo.");
        return;
      }
    } else {
      youtubeId = extrairYoutubeId(youtubeUrl);
      if (!youtubeId) {
        setErroYoutube("Cole um link válido do YouTube.");
        return;
      }
    }

    // A miniatura é obrigatória para link do YouTube (não temos o frame do
    // vídeo); para upload é opcional.
    if (fonte === "youtube" && !thumb) {
      setErroThumb("Escolha uma imagem de miniatura para a aula do YouTube.");
      return;
    }

    try {
      let videoKey = "";
      let duracao = 0;

      if (fonte === "upload" && video) {
        // Duração (já validada) e upload do vídeo para o R2.
        duracao = await lerDuracaoVideo(video);
        setEtapa("enviando-video");
        setProgresso(0);
        videoKey = await enviarParaR2(video, "video", setProgresso);
      }

      // Upload da miniatura (opcional no upload, obrigatória no YouTube).
      let thumbKey = "";
      if (thumb) {
        setEtapa("enviando-thumb");
        setProgresso(0);
        thumbKey = await enviarParaR2(thumb, "imagem", setProgresso);
      }

      // Confirma a criação da aula.
      setEtapa("salvando");
      const corpo: Record<string, unknown> = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        thumb_key: thumbKey,
        ...(ehAdmin ? { postar_como: postarComo } : {}),
      };
      if (fonte === "upload" && video) {
        corpo.video_key = videoKey;
        corpo.duracao_seg = duracao;
        corpo.tamanho_bytes = video.size;
      } else {
        corpo.youtube_url = youtubeUrl.trim();
      }

      const aula = await apiAuthJson<Aula>("/api/aulas/", {
        method: "POST",
        body: JSON.stringify(corpo),
      });
      onCriada(aula);
    } catch (err) {
      const e = err as { corpo?: { detail?: string }; message?: string };
      setErro(e.corpo?.detail ?? e.message ?? "Não foi possível publicar a aula.");
      setEtapa("form");
    }
  }

  const rotuloEtapa =
    etapa === "enviando-video"
      ? `Enviando vídeo… ${progresso}%`
      : etapa === "enviando-thumb"
        ? `Enviando capa… ${progresso}%`
        : etapa === "salvando"
          ? "Salvando…"
          : "Publicar aula";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar aula"
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titulo text-[20px] font-bold text-tinta">
            Adicionar aula
          </h2>
          <button
            onClick={onFechar}
            disabled={enviando}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={publicar} className="space-y-4">
          {ehAdmin && (
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-tinta">
                Publicar como
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setPostarComo("ia")}
                  aria-pressed={postarComo === "ia"}
                  className={`flex-1 rounded-chip border px-3 py-2.5 text-[14px] font-semibold transition disabled:opacity-50 ${
                    postarComo === "ia"
                      ? "border-azul-elas bg-azul-elas-suave text-azul-elas"
                      : "border-tinta-suave/50 bg-fundo-alt text-tinta-suave hover:border-azul-elas"
                  }`}
                >
                  Por ELAS
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setPostarComo("empresa")}
                  aria-pressed={postarComo === "empresa"}
                  className={`flex-1 rounded-chip border px-3 py-2.5 text-[14px] font-semibold transition disabled:opacity-50 ${
                    postarComo === "empresa"
                      ? "border-azul-elas bg-azul-elas-suave text-azul-elas"
                      : "border-tinta-suave/50 bg-fundo-alt text-tinta-suave hover:border-azul-elas"
                  }`}
                >
                  Galapagos Capital
                </button>
              </div>
            </div>
          )}

          <Input
            name="titulo"
            rotulo="Título"
            placeholder="Ex.: Como começar a investir"
            value={titulo}
            maxLength={160}
            disabled={enviando}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <div className="w-full">
            <label
              htmlFor="descricao"
              className="mb-1.5 block text-[13px] font-semibold text-tinta"
            >
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              disabled={enviando}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Sobre o que é essa aula?"
              className="w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 py-2.5 text-[15px] text-tinta placeholder:text-tinta-suave/70 focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
            />
          </div>

          {/* Conteúdo: upload de vídeo OU link do YouTube */}
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Conteúdo
            </span>
            <div
              role="tablist"
              aria-label="Fonte do vídeo"
              className="mb-3 flex gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={fonte === "upload"}
                disabled={enviando}
                onClick={() => setFonte("upload")}
                className={`flex-1 rounded-chip border px-3 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${
                  fonte === "upload"
                    ? "border-azul-elas bg-azul-elas-suave text-azul-elas"
                    : "border-tinta-suave/50 bg-fundo-alt text-tinta-suave hover:border-azul-elas"
                }`}
              >
                <FileVideo className="mr-1 inline h-4 w-4" /> Upload de vídeo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={fonte === "youtube"}
                disabled={enviando}
                onClick={() => setFonte("youtube")}
                className={`flex-1 rounded-chip border px-3 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${
                  fonte === "youtube"
                    ? "border-azul-elas bg-azul-elas-suave text-azul-elas"
                    : "border-tinta-suave/50 bg-fundo-alt text-tinta-suave hover:border-azul-elas"
                }`}
              >
                <MonitorPlay className="mr-1 inline h-4 w-4" /> Link do YouTube
              </button>
            </div>

            {fonte === "upload" ? (
              <div>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => videoInput.current?.click()}
                  className="flex w-full items-center gap-3 rounded-chip border border-dashed border-tinta-suave/60 bg-fundo-alt px-3.5 py-3 text-left text-[14px] text-tinta-suave hover:border-azul-elas disabled:opacity-50"
                >
                  <FileVideo className="h-5 w-5 shrink-0 text-azul-elas" />
                  <span className="truncate">
                    {video ? video.name : "Escolher vídeo (MP4 ou WebM)"}
                  </span>
                </button>
                <input
                  ref={videoInput}
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => escolherVideo(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1 text-[12px] text-tinta-suave">
                  Até 200 MB e 10 minutos.
                </p>
                {erroVideo && (
                  <p className="mt-1 text-[12px] text-perigo">{erroVideo}</p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  inputMode="url"
                  disabled={enviando}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-label="Link do vídeo no YouTube"
                  className="h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 text-[15px] text-tinta placeholder:text-tinta-suave/70 focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30 disabled:opacity-50"
                />
                <p className="mt-1 text-[12px] text-tinta-suave">
                  Cole o link do vídeo. Ao abrir a aula, o vídeo toca dentro do
                  app.
                </p>
                {erroYoutube && (
                  <p className="mt-1 text-[12px] text-perigo">{erroYoutube}</p>
                )}
              </div>
            )}
          </div>

          {/* Miniatura */}
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Miniatura{" "}
              <span className="font-normal text-tinta-suave">
                {fonte === "youtube" ? "(obrigatória)" : "(opcional)"}
              </span>
            </span>
            <button
              type="button"
              disabled={enviando}
              onClick={() => thumbInput.current?.click()}
              className="flex w-full items-center gap-3 rounded-chip border border-dashed border-tinta-suave/60 bg-fundo-alt px-3.5 py-3 text-left text-[14px] text-tinta-suave hover:border-azul-elas disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5 shrink-0 text-azul-elas" />
              <span className="truncate">
                {thumb ? thumb.name : "Escolher imagem de capa"}
              </span>
            </button>
            <input
              ref={thumbInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => escolherThumb(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-[12px] text-tinta-suave">
              Proporção 16:9, ideal 1280×720 px. JPG, PNG ou WebP até 5 MB.
            </p>
            {erroThumb && <p className="mt-1 text-[12px] text-perigo">{erroThumb}</p>}
          </div>

          {/* Barra de progresso */}
          {(etapa === "enviando-video" || etapa === "enviando-thumb") && (
            <div
              className="h-2 w-full overflow-hidden rounded-pill bg-azul-elas-suave"
              role="progressbar"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-pill bg-azul-elas transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          )}

          {erro && (
            <p className="rounded-chip bg-perigo/10 px-3 py-2 text-[13px] text-perigo">
              {erro}
            </p>
          )}

          <Button type="submit" bloco disabled={enviando}>
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {rotuloEtapa}
          </Button>
        </form>
      </div>
    </div>
  );
}
