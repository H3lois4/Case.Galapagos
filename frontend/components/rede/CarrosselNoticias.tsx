"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/cn";
import { gradienteCategoria } from "./comum";
import type { Post } from "@/lib/types";

const INTERVALO = 6000;

export function CarrosselNoticias({ noticias }: { noticias: Post[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const router = useRouter();
  const touchX = useRef<number | null>(null);

  const total = noticias.length;

  useEffect(() => {
    if (total <= 1 || pausado) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const t = setInterval(() => setAtual((i) => (i + 1) % total), INTERVALO);
    return () => clearInterval(t);
  }, [total, pausado]);

  if (total === 0) return null;

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) {
      setAtual((i) => (dx < 0 ? (i + 1) % total : (i - 1 + total) % total));
    }
    touchX.current = null;
  }

  const n = noticias[atual];

  return (
    <section
      aria-label="Notícias em destaque"
      className="relative"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={() => router.push(`/post/${n.id}`)}
        className="block w-full overflow-hidden rounded-card text-left"
      >
        <div
          className={cn(
            "relative flex aspect-[2/1] w-full items-end bg-gradient-to-br p-4 text-white",
            gradienteCategoria(n.categoria),
          )}
          style={
            n.imagem_url
              ? {
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,.1)), url(${n.imagem_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!n.imagem_url && (
            <Newspaper className="absolute right-4 top-4 h-8 w-8 opacity-50" strokeWidth={1.5} />
          )}
          <div>
            {n.categoria && (
              <span className="mb-1 inline-block rounded-chip bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase">
                {n.categoria}
              </span>
            )}
            <h2 className="font-titulo text-[18px] font-bold leading-tight">{n.titulo}</h2>
          </div>
        </div>
      </button>

      {total > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Notícias">
          {noticias.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-label={`Notícia ${i + 1}`}
              aria-selected={i === atual}
              onClick={() => setAtual(i)}
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
