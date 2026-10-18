"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { getHealth } from "@/lib/api";
import { cn } from "@/lib/cn";

type Estado = "carregando" | "ok" | "erro";

/** Selo que consome GET /api/health/ e prova a integração front ↔ back. */
export function ApiStatusBadge() {
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    let ativo = true;
    getHealth()
      .then((h) => ativo && setEstado(h.status === "ok" ? "ok" : "erro"))
      .catch(() => ativo && setEstado("erro"));
    return () => {
      ativo = false;
    };
  }, []);

  const conteudo = {
    carregando: {
      Icone: Loader2,
      texto: "Verificando API…",
      classe: "bg-fundo-alt text-tinta-suave",
      girar: true,
    },
    ok: {
      Icone: CheckCircle2,
      texto: "API: conectada",
      classe: "bg-azul-elas-suave text-azul-elas",
      girar: false,
    },
    erro: {
      Icone: AlertTriangle,
      texto: "API: indisponível",
      classe: "bg-rosa-elas-suave text-rosa-elas-texto",
      girar: false,
    },
  }[estado];

  const { Icone, texto, classe, girar } = conteudo;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-[13px] font-semibold",
        classe,
      )}
    >
      <Icone className={cn("h-4 w-4", girar && "animate-spin")} strokeWidth={2} />
      {texto}
    </span>
  );
}
