"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * Retorno do OAuth (Google) e de links de e-mail. O cliente Supabase, com
 * detectSessionInUrl, troca o code por sessão automaticamente; aqui só
 * aguardamos a sessão e redirecionamos.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let tentativas = 0;
    const timer = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      tentativas += 1;
      if (data.session) {
        clearInterval(timer);
        router.replace("/aulas");
      } else if (tentativas > 20) {
        clearInterval(timer);
        router.replace("/login");
      }
    }, 300);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-fundo-alt">
      <Loader2 className="h-7 w-7 animate-spin text-azul-elas" />
      <p className="text-[14px] text-tinta-suave">Entrando…</p>
    </div>
  );
}
