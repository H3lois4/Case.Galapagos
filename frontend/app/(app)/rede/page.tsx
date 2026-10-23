"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { CarrosselNoticias } from "@/components/rede/CarrosselNoticias";
import { NovoPost } from "@/components/rede/NovoPost";
import { PostCard } from "@/components/rede/PostCard";
import { apiAuthJson } from "@/lib/api";
import type { FiltroFeed, Me, Pagina, Post } from "@/lib/types";

const FILTROS: { v: FiltroFeed; label: string }[] = [
  { v: "todos", label: "Todos" },
  { v: "seguindo", label: "Quem eu sigo" },
  { v: "vagas", label: "Vagas" },
];

export default function RedePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [noticias, setNoticias] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtro, setFiltro] = useState<FiltroFeed>("todos");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    apiAuthJson<Me>("/api/me/").then(setMe).catch(() => setMe(null));
    apiAuthJson<Post[]>("/api/rede/noticias/")
      .then(setNoticias)
      .catch(() => setNoticias([]));
  }, []);

  const carregarFeed = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await apiAuthJson<Pagina<Post>>(`/api/rede/posts/?filtro=${filtro}`);
      setPosts(r.results);
    } catch {
      setPosts([]);
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useEffect(() => {
    carregarFeed();
  }, [carregarFeed]);

  function aoCriar(post: Post) {
    setPosts((atual) => [post, ...atual]);
    if (post.tipo === "noticia") {
      setNoticias((n) => [post, ...n]);
    }
  }

  const podeEmpresa = me?.empresa_status === "aprovada";

  return (
    <div className="space-y-5 py-4">
      <h1 className="font-titulo text-[24px] font-bold text-tinta">Rede</h1>

      {noticias.length > 0 && <CarrosselNoticias noticias={noticias} />}

      <NovoPost podeEmpresa={!!podeEmpresa} onCriado={aoCriar} />

      {/* Filtros */}
      <div className="flex gap-2" role="tablist" aria-label="Filtrar feed">
        {FILTROS.map((f) => (
          <button
            key={f.v}
            type="button"
            role="tab"
            aria-selected={filtro === f.v}
            onClick={() => setFiltro(f.v)}
            className={cn(
              "rounded-pill border px-4 py-2 text-[13px] font-semibold transition-colors",
              filtro === f.v
                ? "border-azul-elas bg-azul-elas text-white"
                : "border-borda bg-fundo text-tinta-suave hover:border-azul-elas/60 hover:text-tinta",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <Users className="h-10 w-10 text-tinta-suave/60" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-tinta">
            {filtro === "seguindo"
              ? "Siga pessoas e empresas para ver posts aqui"
              : filtro === "vagas"
                ? "Nenhuma vaga publicada ainda"
                : "Ainda não há posts"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onExcluido={(id) => setPosts((atual) => atual.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
