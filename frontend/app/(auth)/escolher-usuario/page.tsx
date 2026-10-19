"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiAuth, apiAuthJson } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, X, Loader2 } from "lucide-react";

type Disp = "vazio" | "checando" | "ok" | "indisponivel";

export default function EscolherUsuarioPage() {
  const router = useRouter();
  const { session, carregando } = useAuth();
  const [username, setUsername] = useState("");
  const [disp, setDisp] = useState<Disp>("vazio");
  const [msg, setMsg] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!carregando && !session) router.replace("/login");
  }, [session, carregando, router]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const u = username.trim().toLowerCase();
    if (!u) {
      setDisp("vazio");
      setMsg(null);
      return;
    }
    setDisp("checando");
    timer.current = setTimeout(async () => {
      try {
        const r = await apiAuthJson<{ disponivel: boolean; erro: string | null }>(
          `/api/me/username-disponivel/?u=${encodeURIComponent(u)}`,
        );
        setDisp(r.disponivel ? "ok" : "indisponivel");
        setMsg(r.erro);
      } catch {
        setDisp("indisponivel");
        setMsg("Não foi possível verificar agora.");
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [username]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await apiAuth("/api/me/username/", {
      method: "POST",
      body: JSON.stringify({ username: username.trim().toLowerCase() }),
    });
    setEnviando(false);
    if (res.ok) {
      router.replace("/aulas");
    } else {
      const corpo = await res.json().catch(() => null);
      setMsg(corpo?.username?.[0] ?? "Não foi possível salvar.");
      setDisp("indisponivel");
    }
  }

  return (
    <div>
      <h1 className="font-titulo text-[22px] font-bold text-tinta">
        Escolha seu nome de usuário
      </h1>
      <p className="mt-1 text-[14px] text-tinta-suave">
        É como você aparece nos posts e no seu perfil. Pode usar letras,
        números, ponto e sublinhado.
      </p>
      <form onSubmit={salvar} className="mt-5 space-y-3">
        <div className="relative">
          <Input
            name="username"
            rotulo="Nome de usuário"
            placeholder="ex.: ana.lima"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            erro={disp === "indisponivel" ? msg : null}
          />
          <span className="pointer-events-none absolute right-3 top-9">
            {disp === "checando" && (
              <Loader2 className="h-4 w-4 animate-spin text-tinta-suave" />
            )}
            {disp === "ok" && <Check className="h-4 w-4 text-sucesso" />}
            {disp === "indisponivel" && <X className="h-4 w-4 text-perigo" />}
          </span>
        </div>
        {disp === "ok" && (
          <p className="text-[12px] text-sucesso">Disponível!</p>
        )}
        <Button type="submit" bloco disabled={enviando || disp !== "ok"}>
          {enviando ? "Salvando…" : "Continuar"}
        </Button>
      </form>
    </div>
  );
}
