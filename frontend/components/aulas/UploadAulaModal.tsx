"use client";

import { useRef, useState } from "react";
import { X, UploadCloud, Loader2, FileVideo, ImagePlus } from "lucide-react";
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
}

type Etapa = "form" | "enviando-video" | "enviando-thumb" | "salvando";

export function UploadAulaModal({ onFechar, onCriada }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroVideo, setErroVideo] = useState<string | null>(null);
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
    if (!titulo.trim()) {
      setErro("Dê um título para a aula.");
      return;
    }
    if (!video) {
      setErroVideo("Escolha um arquivo de vídeo.");
      return;
    }

    try {
      // 1) duração (já validada, mas reusamos o valor para salvar)
      const duracao = await lerDuracaoVideo(video);

      // 2) upload do vídeo
      setEtapa("enviando-video");
      setProgresso(0);
      const videoKey = await enviarParaR2(video, "video", setProgresso);

      // 3) upload da thumbnail (opcional)
      let thumbKey = "";
      if (thumb) {
        setEtapa("enviando-thumb");
        setProgresso(0);
        thumbKey = await enviarParaR2(thumb, "imagem", setProgresso);
      }

      // 4) confirma a criação da aula
      setEtapa("salvando");
      const aula = await apiAuthJson<Aula>("/api/aulas/", {
        method: "POST",
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          video_key: videoKey,
          thumb_key: thumbKey,
          duracao_seg: duracao,
          tamanho_bytes: video.size,
        }),
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

          {/* Vídeo */}
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Vídeo (MP4 ou WebM, até 200 MB e 10 min)
            </span>
            <button
              type="button"
              disabled={enviando}
              onClick={() => videoInput.current?.click()}
              className="flex w-full items-center gap-3 rounded-chip border border-dashed border-tinta-suave/60 bg-fundo-alt px-3.5 py-3 text-left text-[14px] text-tinta-suave hover:border-azul-elas disabled:opacity-50"
            >
              <FileVideo className="h-5 w-5 shrink-0 text-azul-elas" />
              <span className="truncate">
                {video ? video.name : "Escolher vídeo"}
              </span>
            </button>
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => escolherVideo(e.target.files?.[0] ?? null)}
            />
            {erroVideo && <p className="mt-1 text-[12px] text-perigo">{erroVideo}</p>}
          </div>

          {/* Thumbnail */}
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Capa (opcional, JPG/PNG/WebP até 5 MB)
            </span>
            <button
              type="button"
              disabled={enviando}
              onClick={() => thumbInput.current?.click()}
              className="flex w-full items-center gap-3 rounded-chip border border-dashed border-tinta-suave/60 bg-fundo-alt px-3.5 py-3 text-left text-[14px] text-tinta-suave hover:border-azul-elas disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5 shrink-0 text-azul-elas" />
              <span className="truncate">
                {thumb ? thumb.name : "Escolher capa"}
              </span>
            </button>
            <input
              ref={thumbInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => escolherThumb(e.target.files?.[0] ?? null)}
            />
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
