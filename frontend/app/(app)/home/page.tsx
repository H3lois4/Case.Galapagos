"use client";

import { useEffect, useState } from "react";
import { MinhaJornada } from "@/components/jornada/MinhaJornada";
import { CarrosselRede } from "@/components/rede/CarrosselRede";
import { apiAuthJson } from "@/lib/api";
import type { Me, Pagina, Post } from "@/lib/types";

/** Quantas publicações entram no carrossel "Novidades em Rede". */
const MAX_NOVIDADES = 5;

/**
 * Home: saudação, "Novidades em Rede" (últimos posts com imagem) e
 * "Minha Jornada". O topo (logo + foto que leva ao Perfil) vem do TopBar.
 */
export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [novidades, setNovidades] = useState<Post[]>([]);

  useEffect(() => {
    apiAuthJson<Me>("/api/me/")
      .then(setMe)
      .catch(() => setMe(null));
    apiAuthJson<Pagina<Post>>("/api/rede/posts/?com_imagem=1")
      .then((r) =>
        // Filtro duplo: o backend já manda só posts com imagem.
        setNovidades(r.results.filter((p) => p.imagem_url).slice(0, MAX_NOVIDADES)),
      )
      .catch(() => setNovidades([]));
  }, []);

  const nome = me?.nome_exibicao?.trim() || me?.username || "";

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="font-titulo text-[24px] font-bold text-tinta">
          Olá{nome ? <>, <span className="text-azul-elas">{nome}</span></> : ""}!
        </h1>
        <p className="text-[14px] text-tinta-suave">
          Acompanhe tudo o que você já construiu por aqui.
        </p>
      </div>

      {novidades.length > 0 && <CarrosselRede posts={novidades} />}

      <MinhaJornada titulo="Minha Jornada" />
    </div>
  );
}
