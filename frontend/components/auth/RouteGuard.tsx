"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { apiAuthJson } from "@/lib/api";
import type { Me } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface GuardState {
  carregando: boolean;
  me: Me | null;
}

/**
 * Protege o grupo (app): exige sessão e username definido.
 * - Sem sessão → /login
 * - Com sessão, sem username → /escolher-usuario
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, carregando: authCarregando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<GuardState>({ carregando: true, me: null });

  useEffect(() => {
    if (authCarregando) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    let ativo = true;
    apiAuthJson<Me>("/api/me/")
      .then((me) => {
        if (!ativo) return;
        if (me.precisa_username) {
          router.replace("/escolher-usuario");
          return;
        }
        setEstado({ carregando: false, me });
      })
      .catch(() => {
        if (ativo) setEstado({ carregando: false, me: null });
      });

    return () => {
      ativo = false;
    };
  }, [session, authCarregando, router, pathname]);

  if (authCarregando || estado.carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
      </div>
    );
  }

  return (
    <>
      {estado.me?.account_type === "empresa" &&
        estado.me?.empresa_status === "pendente" && (
          <div className="mx-4 mt-3 rounded-botao bg-rosa-elas-suave px-4 py-2.5 text-[13px] font-semibold text-rosa-elas-texto">
            Sua empresa está em análise. Enquanto isso, você usa o app como conta pessoal.
          </div>
        )}
      {children}
    </>
  );
}
