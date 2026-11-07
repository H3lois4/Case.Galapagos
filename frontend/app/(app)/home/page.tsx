"use client";

import { useEffect, useState } from "react";
import { MinhaJornada } from "@/components/jornada/MinhaJornada";
import { apiAuthJson } from "@/lib/api";
import type { Me } from "@/lib/types";

/**
 * Home: saudação + "Minha Jornada". O topo (logo + foto que leva ao Perfil)
 * vem do TopBar do layout (app).
 */
export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiAuthJson<Me>("/api/me/")
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const nome = me?.nome_exibicao?.trim() || me?.username || "";

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="font-titulo text-[24px] font-bold text-tinta">
          Olá{nome ? <>, <span className="text-azul-elas">{nome}</span></> : ""}!
        </h1>
        <p className="text-[14px] text-tinta-suave">
          Acompanhe tudo o que você já construiu por aqui.
        </p>
      </div>

      <MinhaJornada titulo="Minha Jornada" />
    </div>
  );
}
