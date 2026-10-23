"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuthJson } from "@/lib/api";
import { enviarParaR2, validarArquivo } from "@/lib/upload";
import type { Post, TipoPost } from "@/lib/types";

export function NovoPost({
  podeEmpresa,
  onCriado,
}: {
  podeEmpresa: boolean;
  onCriado: (post: Post) => void;
}) {
  const [tipo, setTipo] = useState<TipoPost>("post");
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [vagaCargo, setVagaCargo] = useState("");
  const [vagaLocal, setVagaLocal] = useState("");
  const [vagaLink, setVagaLink] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);

  async function escolherImagem(arquivo: File | null) {
    setErro(null);
    if (!arquivo) {
      setImagem(null);
      return;
    }
    const msg = await validarArquivo(arquivo, "imagem");
    if (msg) {
      setErro(msg);
      return;
    }
    setImagem(arquivo);
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (tipo === "post" && !texto.trim() && !imagem) {
      setErro("Escreva algo ou adicione uma imagem.");
      return;
    }
    if (tipo === "vaga" && !vagaCargo.trim()) {
      setErro("Informe o cargo da vaga.");
      return;
    }
    if (tipo === "noticia" && !titulo.trim()) {
      setErro("Informe o título da notícia.");
      return;
    }

    setEnviando(true);
    try {
      let imagemKey = "";
      if (imagem) {
        imagemKey = await enviarParaR2(imagem, "imagem", () => {});
      }
      const post = await apiAuthJson<Post>("/api/rede/posts/", {
        method: "POST",
        body: JSON.stringify({
          tipo,
          texto: texto.trim(),
          imagem_key: imagemKey,
          titulo: titulo.trim(),
          vaga_cargo: vagaCargo.trim(),
          vaga_local: vagaLocal.trim(),
          vaga_link: vagaLink.trim(),
        }),
      });
      onCriado(post);
      // limpa
      setTexto("");
      setTitulo("");
      setVagaCargo("");
      setVagaLocal("");
      setVagaLink("");
      setImagem(null);
      setTipo("post");
    } catch (err) {
      const ex = err as { corpo?: { detail?: string } };
      setErro(ex.corpo?.detail ?? "Não foi possível publicar.");
    } finally {
      setEnviando(false);
    }
  }

  const tipos: { v: TipoPost; label: string }[] = [
    { v: "post", label: "Post" },
    { v: "vaga", label: "Vaga" },
    { v: "noticia", label: "Notícia" },
  ];

  return (
    <form
      onSubmit={publicar}
      className="rounded-card border border-borda bg-fundo p-4 shadow-[var(--sombra-card)]"
    >
      {podeEmpresa && (
        <div className="mb-3 flex gap-2">
          {tipos.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTipo(t.v)}
              className={cn(
                "rounded-pill border px-3 py-1 text-[12px] font-semibold transition-colors",
                tipo === t.v
                  ? "border-azul-elas bg-azul-elas text-white"
                  : "border-borda text-tinta-suave hover:border-azul-elas/60",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tipo === "noticia" && (
        <Input
          name="titulo"
          rotulo="Título da notícia"
          value={titulo}
          maxLength={200}
          onChange={(e) => setTitulo(e.target.value)}
          className="mb-2"
        />
      )}

      {tipo === "vaga" && (
        <div className="mb-2 space-y-2">
          <Input name="vaga_cargo" rotulo="Cargo" value={vagaCargo} onChange={(e) => setVagaCargo(e.target.value)} />
          <Input name="vaga_local" rotulo="Local / modelo" placeholder="Ex.: Remoto, São Paulo" value={vagaLocal} onChange={(e) => setVagaLocal(e.target.value)} />
          <Input name="vaga_link" rotulo="Link de candidatura" placeholder="https://" value={vagaLink} onChange={(e) => setVagaLink(e.target.value)} />
        </div>
      )}

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={
          tipo === "vaga"
            ? "Descreva a vaga (opcional)"
            : tipo === "noticia"
              ? "Resumo da notícia"
              : "O que você quer compartilhar?"
        }
        className="w-full resize-none rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 py-2.5 text-[15px] text-tinta placeholder:text-tinta-suave/70 focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
      />

      {imagem && (
        <div className="mt-2 flex items-center justify-between rounded-chip bg-fundo-alt px-3 py-2 text-[13px] text-tinta">
          <span className="truncate">{imagem.name}</span>
          <button type="button" onClick={() => setImagem(null)} aria-label="Remover imagem">
            <X className="h-4 w-4 text-tinta-suave hover:text-perigo" />
          </button>
        </div>
      )}

      {erro && <p className="mt-2 text-[13px] text-perigo">{erro}</p>}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => imgInput.current?.click()}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tinta-suave hover:text-azul-elas"
        >
          <ImagePlus className="h-4 w-4" /> Imagem
        </button>
        <input
          ref={imgInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => escolherImagem(e.target.files?.[0] ?? null)}
        />
        <Button type="submit" className="h-10" disabled={enviando}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar
        </Button>
      </div>
    </form>
  );
}
