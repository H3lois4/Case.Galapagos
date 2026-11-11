"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles, Building2, Briefcase, Newspaper } from "lucide-react";
import { cn } from "@/lib/cn";
import { dataCurta } from "./comum";
import type { Post } from "@/lib/types";

const INTERVALO = 6000;
const LIMIAR_SWIPE = 40; // px para considerar que a pessoa arrastou

/** Título do slide: título (notícia), cargo (vaga) ou o começo do texto. */
function tituloDoPost(p: Post): string {
  if (p.titulo?.trim()) return p.titulo.trim();
  if (p.tipo === "vaga" && p.vaga_cargo?.trim()) return p.vaga_cargo.trim();
  const primeiraLinha = (p.texto || "").trim().split("\n")[0] ?? "";
  if (!primeiraLinha) return "Nova publicação";
  return primeiraLinha.length > 90 ? `${primeiraLinha.slice(0, 90).trimEnd()}…` : primeiraLinha;
}

function Avatar({ post }: { post: Post }) {
  const { autor } = post;
  const inicial = (autor.nome || "?").charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-pill text-[13px] font-bold text-white ring-2 ring-white/80",
        autor.tipo === "ia"
          ? "bg-gradient-to-br from-rosa-elas to-azul-elas"
          : "bg-azul-elas",
      )}
    >
      {autor.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={autor.foto} alt="" className="h-full w-full object-cover" />
      ) : autor.tipo === "ia" ? (
        <Sparkles className="h-4 w-4" strokeWidth={2} />
      ) : (
        inicial
      )}
    </span>
  );
}

function SeloTipo({ post }: { post: Post }) {
  if (post.tipo === "post") return null;
  const Icone = post.tipo === "vaga" ? Briefcase : Newspaper;
  return (
    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
      <Icone className="h-3.5 w-3.5" strokeWidth={2} />
      {post.tipo === "vaga" ? "Vaga" : "Notícia"}
    </span>
  );
}

/**
 * Carrossel "Novidades em Rede" da Home: posts recentes com imagem.
 * Passa sozinho (pausa ao tocar/passar o mouse e com movimento reduzido) e
 * também desliza com o dedo, acompanhando o arraste.
 */
export function CarrosselRede({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [arraste, setArraste] = useState(0); // deslocamento do dedo em px
  const inicioX = useRef<number | null>(null);
  const inicioY = useRef<number | null>(null);
  const horizontal = useRef<boolean | null>(null);
  const arrastou = useRef(false);

  const total = posts.length;

  useEffect(() => {
    if (total <= 1 || pausado) return;
    const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) return;
    const t = setInterval(() => setAtual((i) => (i + 1) % total), INTERVALO);
    return () => clearInterval(t);
  }, [total, pausado, atual]); // `atual` reinicia o timer após troca manual

  if (total === 0) return null;

  function irPara(i: number) {
    setAtual(((i % total) + total) % total);
  }

  function onTouchStart(e: React.TouchEvent) {
    inicioX.current = e.touches[0].clientX;
    inicioY.current = e.touches[0].clientY;
    horizontal.current = null;
    arrastou.current = false;
    setPausado(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (inicioX.current === null || inicioY.current === null) return;
    const dx = e.touches[0].clientX - inicioX.current;
    const dy = e.touches[0].clientY - inicioY.current;
    // Decide a direção no começo: vertical = rolar a página, não o carrossel.
    if (horizontal.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      horizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (horizontal.current) {
      arrastou.current = true;
      setArraste(dx);
    }
  }

  function onTouchEnd() {
    if (horizontal.current && Math.abs(arraste) > LIMIAR_SWIPE) {
      irPara(arraste < 0 ? atual + 1 : atual - 1);
    }
    setArraste(0);
    inicioX.current = null;
    inicioY.current = null;
    horizontal.current = null;
    setPausado(false);
  }

  function abrir(e: React.MouseEvent, id: number) {
    // Um arraste não deve abrir o post.
    if (arrastou.current) {
      e.preventDefault();
      arrastou.current = false;
      return;
    }
    e.preventDefault();
    router.push(`/post/${id}`);
  }

  return (
    <section aria-labelledby="titulo-novidades-rede" aria-roledescription="carrossel">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          id="titulo-novidades-rede"
          className="font-titulo text-[18px] font-semibold text-tinta"
        >
          Novidades em Rede
        </h2>
        <Link
          href="/rede"
          className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-azul-elas hover:underline"
        >
          Ver tudo <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        className="relative overflow-hidden rounded-card shadow-[var(--sombra-card)]"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <ul
          className={cn(
            "flex",
            arraste === 0 && "transition-transform duration-500 ease-out motion-reduce:transition-none",
          )}
          style={{ transform: `translateX(calc(${-atual * 100}% + ${arraste}px))` }}
        >
          {posts.map((p, i) => (
            <li
              key={p.id}
              className="w-full shrink-0"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={i !== atual}
            >
              <a
                href={`/post/${p.id}`}
                onClick={(e) => abrir(e, p.id)}
                tabIndex={i === atual ? 0 : -1}
                className="relative block aspect-[16/10] w-full bg-azul-elas-suave"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imagem_url}
                  alt=""
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full select-none object-cover"
                />
                {/* Degradê para o texto ficar legível sobre qualquer foto */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                />
                <SeloTipo post={p} />

                <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="line-clamp-2 font-titulo text-[17px] font-bold leading-snug drop-shadow-sm">
                    {tituloDoPost(p)}
                  </span>
                  <span className="mt-2.5 flex items-center gap-2">
                    <Avatar post={p} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-[13px] font-semibold">
                        {p.autor.nome}
                        {p.autor.tipo === "empresa" && (
                          <Building2 className="h-3.5 w-3.5 shrink-0 opacity-90" />
                        )}
                      </span>
                      <span className="block text-[11px] text-white/80">
                        {dataCurta(p.criado_em)}
                      </span>
                    </span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {total > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5" role="tablist" aria-label="Escolher publicação">
          {posts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-label={`Publicação ${i + 1}`}
              aria-selected={i === atual}
              onClick={() => irPara(i)}
              className={cn(
                "h-1.5 rounded-pill transition-all",
                i === atual ? "w-5 bg-azul-elas" : "w-1.5 bg-borda",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
