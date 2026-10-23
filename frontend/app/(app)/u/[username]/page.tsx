"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/rede/PostCard";
import { apiAuth, apiAuthJson } from "@/lib/api";
import type { PerfilPublico, Pagina, Post } from "@/lib/types";
import { ExternalLink, Loader2, Building2 } from "lucide-react";

export default function PerfilPublicoPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    apiAuthJson<PerfilPublico>(`/api/u/${username}/`)
      .then(setPerfil)
      .catch(() => setNaoEncontrado(true))
      .finally(() => setCarregando(false));
    apiAuthJson<Pagina<Post>>(`/api/rede/posts/?autor=${encodeURIComponent(username)}`)
      .then((r) => setPosts(r.results))
      .catch(() => setPosts([]));
  }, [username]);

  async function alternarSeguir() {
    if (!perfil) return;
    setProcessando(true);
    const metodo = perfil.seguindo ? "DELETE" : "POST";
    const res = await apiAuth(`/api/u/${username}/seguir/`, { method: metodo });
    setProcessando(false);
    if (res.ok) {
      const r = await res.json();
      setPerfil({
        ...perfil,
        seguindo: r.seguindo,
        total_seguidores: r.total_seguidores,
      });
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
      </div>
    );
  }

  if (naoEncontrado || !perfil) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-titulo text-[22px] font-bold text-tinta">
          Perfil não encontrado
        </h1>
        <p className="mt-2 text-[14px] text-tinta-suave">
          Não existe ninguém com @{username}.
        </p>
      </div>
    );
  }

  const ehEmpresa = perfil.account_type === "empresa" && perfil.empresa;

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-start gap-4">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas text-2xl font-bold text-white">
          {perfil.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.foto} alt="" className="h-full w-full object-cover" />
          ) : (
            (perfil.nome_exibicao || perfil.username).charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-titulo text-[22px] font-bold text-tinta">
            {perfil.nome_exibicao || perfil.username}
          </h1>
          <p className="text-[14px] text-tinta-suave">@{perfil.username}</p>
          <div className="mt-2 flex gap-4 text-[13px]">
            <span>
              <strong className="text-tinta">{perfil.total_seguidores}</strong>{" "}
              <span className="text-tinta-suave">seguidores</span>
            </span>
            <span>
              <strong className="text-tinta">{perfil.total_seguindo}</strong>{" "}
              <span className="text-tinta-suave">seguindo</span>
            </span>
          </div>
        </div>
      </div>

      {perfil.descricao && (
        <p className="text-[15px] leading-relaxed text-tinta">{perfil.descricao}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variante={perfil.seguindo ? "secondary" : "primary"}
          onClick={alternarSeguir}
          disabled={processando}
        >
          {perfil.seguindo ? "Seguindo" : "Seguir"}
        </Button>
        {perfil.linkedin && (
          <a
            href={perfil.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-azul-elas hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> LinkedIn
          </a>
        )}
      </div>

      {ehEmpresa && (
        <Card>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-azul-elas" strokeWidth={1.75} />
            <div>
              <h2 className="font-titulo text-[16px] font-semibold text-tinta">
                {perfil.empresa?.nome}
              </h2>
              {perfil.empresa?.site && (
                <a
                  href={perfil.empresa.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-azul-elas hover:underline"
                >
                  {perfil.empresa.site}
                </a>
              )}
            </div>
          </div>
          {perfil.empresa?.descricao && (
            <p className="mt-2 text-[14px] text-tinta-suave">{perfil.empresa.descricao}</p>
          )}
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-titulo text-[18px] font-semibold text-tinta">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-[13px] text-tinta-suave">Nenhum post ainda.</p>
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
    </div>
  );
}
