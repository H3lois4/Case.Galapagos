"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuthJson } from "@/lib/api";
import { comprimirImagem, enviarImagemRede, validarArquivo } from "@/lib/upload";
import type { Post, TipoPost } from "@/lib/types";

type PostarComo = "usuaria" | "empresa" | "ia";

export function NovoPost({
  podeEmpresa,
  ehAdmin = false,
  nomeUsuaria = "Você",
  onCriado,
}: {
  podeEmpresa: boolean;
  ehAdmin?: boolean;
  nomeUsuaria?: string;
  onCriado: (post: Post) => void;
}) {
  const [tipo, setTipo] = useState<TipoPost>("post");
  const [postarComo, setPostarComo] = useState<PostarComo>("usuaria");
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("economia");
  const [fonteUrl, setFonteUrl] = useState("");
  const [vagaCargo, setVagaCargo] = useState("");
  const [vagaLocal, setVagaLocal] = useState("");
  const [vagaLink, setVagaLink] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);

  async function escolherImagem(arquivo: File | null) {
    setErro(null);
    if (!arquivo) {
      setImagem(null);
      setPrevia(null);
      return;
    }
    setProcessando(true);
    try {
      // Comprime/redimensiona (resolve crash de foto grande da câmera e HEIC).
      const otimizada = await comprimirImagem(arquivo);
      const msg = await validarArquivo(otimizada, "imagem");
      if (msg) {
        setErro(msg);
        setImagem(null);
        setPrevia(null);
        return;
      }
      setImagem(otimizada);
      setPrevia(URL.createObjectURL(otimizada));
    } catch {
      setErro("Não foi possível processar a imagem. Tente outra.");
      setImagem(null);
      setPrevia(null);
    } finally {
      setProcessando(false);
    }
  }

  // Abre o seletor de arquivos/galeria. Quando o navegador suporta a File
  // System Access API, usamos showOpenFilePicker, que abre direto a galeria/
  // arquivos sem oferecer a câmera (o menu "Câmera/Filmadora" do Android some).
  async function abrirSeletorImagem() {
    type JanelaComPicker = Window & {
      showOpenFilePicker?: (opts?: unknown) => Promise<Array<{ getFile: () => Promise<File> }>>;
    };
    const win = window as JanelaComPicker;
    if (typeof win.showOpenFilePicker === "function") {
      try {
        const [handle] = await win.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Imagens",
              accept: {
                "image/jpeg": [".jpg", ".jpeg"],
                "image/png": [".png"],
                "image/webp": [".webp"],
              },
            },
          ],
          excludeAcceptAllOption: false,
        });
        if (handle) {
          const arquivo = await handle.getFile();
          void escolherImagem(arquivo);
        }
      } catch {
        /* usuária cancelou ou API indisponível: não faz nada */
      }
      return;
    }
    // Fallback: input de arquivo tradicional.
    imgInput.current?.click();
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
        imagemKey = await enviarImagemRede(imagem);
      }
      const post = await apiAuthJson<Post>("/api/rede/posts/", {
        method: "POST",
        body: JSON.stringify({
          tipo,
          texto: texto.trim(),
          imagem_key: imagemKey,
          titulo: titulo.trim(),
          categoria: tipo === "noticia" ? categoria : "",
          fonte_url: tipo === "noticia" ? fonteUrl.trim() : "",
          vaga_cargo: vagaCargo.trim(),
          vaga_local: vagaLocal.trim(),
          vaga_link: vagaLink.trim(),
          ...(ehAdmin ? { postar_como: postarComo } : {}),
        }),
      });
      onCriado(post);
      // limpa
      setTexto("");
      setTitulo("");
      setCategoria("economia");
      setFonteUrl("");
      setVagaCargo("");
      setVagaLocal("");
      setVagaLink("");
      setImagem(null);
      setPrevia(null);
      setTipo("post");
      setPostarComo("usuaria");
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
      {/* Administradora escolhe em nome de quem publicar. */}
      {ehAdmin && (
        <div className="mb-3">
          <span className="mb-1.5 block text-[12px] font-semibold text-tinta-suave">
            Publicar como
          </span>
          <div className="flex flex-wrap gap-2">
            {([
              { v: "ia", label: "Por ELAS" },
              { v: "empresa", label: "Galapagos Capital" },
              { v: "usuaria", label: nomeUsuaria },
            ] as { v: PostarComo; label: string }[]).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setPostarComo(o.v)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-[12px] font-semibold transition-colors",
                  postarComo === o.v
                    ? "border-rosa-elas bg-rosa-elas text-tinta"
                    : "border-borda text-tinta-suave hover:border-rosa-elas/60",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(podeEmpresa || ehAdmin) && (
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
        <div className="mb-2 space-y-2">
          <Input
            name="titulo"
            rotulo="Título da notícia"
            value={titulo}
            maxLength={200}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <div className="w-full">
            <label
              htmlFor="categoria"
              className="mb-1.5 block text-[13px] font-semibold text-tinta"
            >
              Categoria
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-11 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 text-[15px] text-tinta focus:border-azul-elas focus:outline-none"
            >
              {["economia", "juros", "bolsa", "cambio", "cripto", "carreira"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Input
            name="fonte_url"
            rotulo="Link da notícia fonte"
            placeholder="https://..."
            value={fonteUrl}
            onChange={(e) => setFonteUrl(e.target.value)}
          />
        </div>
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

      {previa && (
        <div className="relative mt-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previa}
            alt="Prévia"
            className="max-h-48 rounded-card object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setImagem(null);
              setPrevia(null);
            }}
            aria-label="Remover imagem"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-pill bg-tinta/70 text-white hover:bg-perigo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {erro && <p className="mt-2 text-[13px] text-perigo">{erro}</p>}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={abrirSeletorImagem}
          disabled={processando}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tinta-suave hover:text-azul-elas disabled:opacity-50"
        >
          {processando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Imagem
        </button>
        <input
          ref={imgInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            void escolherImagem(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <Button type="submit" className="h-10" disabled={enviando || processando}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar
        </Button>
      </div>
    </form>
  );
}
