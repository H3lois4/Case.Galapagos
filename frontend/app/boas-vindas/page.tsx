"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Logo } from "@/components/brand/LogoMark";
import { apiAuthJson } from "@/lib/api";
import { marcarBoasVindasVistas } from "@/lib/boasVindas";
import type { Me } from "@/lib/types";

/**
 * Splash de boas-vindas, exibida só no primeiro acesso (o RouteGuard manda
 * para cá enquanto a usuária não tiver visto). Ao abrir, já marca como vista.
 */
export default function BoasVindasPage() {
  const router = useRouter();
  const { session, carregando } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [saindo, setSaindo] = useState(false);
  const marcacao = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (carregando) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    apiAuthJson<Me>("/api/me/")
      .then((m) => {
        if (m.precisa_username) {
          router.replace("/escolher-usuario");
          return;
        }
        setMe(m);
        // Marca já ao exibir: "só na primeira vez", mesmo que feche o app aqui.
        marcacao.current ??= marcarBoasVindasVistas(session);
      })
      .catch(() => router.replace("/home"));
  }, [session, carregando, router]);

  async function irParaHome(e: React.MouseEvent) {
    e.preventDefault();
    setSaindo(true);
    // Garante que a marca foi salva antes de entrar (evita voltar para cá).
    await (marcacao.current ?? marcarBoasVindasVistas(session));
    router.replace("/home");
  }

  if (!me) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-fundo">
        <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
      </div>
    );
  }

  const nome = me.nome_exibicao?.trim() || me.username || "";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-fundo px-6 py-12 text-center">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="font-titulo text-[28px] font-bold leading-tight text-tinta">
          Bem-vinda{nome ? <>, <span className="text-azul-elas">{nome}</span></> : ""}!
        </h1>

        <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-tinta-suave">
          <p>
            O Por ELAS finance é o seu espaço para entrar e crescer no mercado
            financeiro, criado em parceria com a Galapagos Capital.
          </p>
          <p>
            Aqui você assiste a aulas no seu ritmo, pratica com simulados de
            certificação e entrevistas com IA, descobre as áreas do mercado e
            monta seu plano de carreira, agenda mentorias com profissionais e
            troca experiências com outras mulheres na Rede.
          </p>
          <p>Tudo o que você fizer fica guardado na sua jornada.</p>
        </div>

        <div className="mt-10 [&_img]:h-16 sm:[&_img]:h-20">
          <Logo />
        </div>

        <a
          href="/home"
          onClick={irParaHome}
          aria-disabled={saindo}
          className="mt-12 inline-flex items-center gap-2 rounded-botao px-4 py-3 font-titulo text-[16px] font-semibold text-azul-elas transition-colors hover:bg-fundo-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul-elas/40"
        >
          {saindo ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : null}
          Ir para a home
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
