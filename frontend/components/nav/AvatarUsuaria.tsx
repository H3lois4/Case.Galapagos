"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiAuthJson } from "@/lib/api";
import type { Me } from "@/lib/types";

/** Cache simples em módulo para não rebuscar o perfil a cada navegação. */
let meCache: Me | null = null;

/** Zera o cache do avatar (ex.: após a usuária trocar a foto). */
export function invalidarAvatarCache(): void {
  meCache = null;
}

function inicial(me: Me | null): string {
  const base =
    me?.nome_exibicao?.trim() ||
    me?.username?.trim() ||
    me?.email?.trim() ||
    "";
  return base ? base.charAt(0).toUpperCase() : "·";
}

/**
 * Avatar do topo que leva ao perfil. Mostra a foto da usuária, se houver;
 * caso contrário, a primeira letra do nome (ou username/e-mail).
 */
export function AvatarUsuaria() {
  const [me, setMe] = useState<Me | null>(meCache);

  useEffect(() => {
    if (meCache) return; // já temos em cache
    let ativo = true;
    apiAuthJson<Me>("/api/me/")
      .then((dados) => {
        meCache = dados;
        if (ativo) setMe(dados);
      })
      .catch(() => {
        /* sem sessão/erro: mantém o fallback */
      });
    return () => {
      ativo = false;
    };
  }, []);

  const temFoto = Boolean(me?.foto);

  return (
    <Link
      href="/perfil"
      aria-label="Abrir perfil"
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas text-sm font-bold text-white"
    >
      {temFoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={me!.foto}
          alt="Foto de perfil"
          className="h-full w-full object-cover"
        />
      ) : (
        inicial(me)
      )}
    </Link>
  );
}
