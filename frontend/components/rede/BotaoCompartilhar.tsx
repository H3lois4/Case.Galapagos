"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/** Compartilha via Web Share API; fallback copia o link. */
export function BotaoCompartilhar({
  postId,
  titulo,
}: {
  postId: number;
  titulo?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = `${window.location.origin}/post/${postId}`;
    const dados = { title: titulo || "Por ELAS finance", url };
    const nav = navigator as Navigator & {
      share?: (d: ShareData) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share(dados);
        return;
      } catch {
        // usuária cancelou ou falhou → cai no fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem clipboard */
    }
  }

  return (
    <button
      onClick={compartilhar}
      aria-label="Compartilhar"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tinta-suave hover:text-azul-elas"
    >
      {copiado ? <Check className="h-4 w-4 text-sucesso" /> : <Share2 className="h-4 w-4" />}
      {copiado ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
