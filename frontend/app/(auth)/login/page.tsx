"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleIcon } from "@/components/brand/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const { session, carregando } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!carregando && session) router.replace("/aulas");
  }, [session, carregando, router]);

  async function entrarComEmail(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
      return;
    }
    router.replace("/aulas");
  }

  async function entrarComGoogle() {
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro("Não foi possível iniciar o login com o Google.");
  }

  return (
    <div>
      <h1 className="font-titulo text-[22px] font-bold text-tinta">Bem-vinda de volta</h1>
      <p className="mt-1 text-[14px] text-tinta-suave">
        Entre para continuar sua jornada no mercado financeiro.
      </p>

      <Button
        variante="secondary"
        bloco
        className="mt-5"
        onClick={entrarComGoogle}
        type="button"
      >
        <GoogleIcon className="h-5 w-5" />
        Entrar com Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-[12px] text-tinta-suave">
        <span className="h-px flex-1 bg-borda" /> ou <span className="h-px flex-1 bg-borda" />
      </div>

      <form onSubmit={entrarComEmail} className="space-y-3">
        <Input
          name="email"
          type="email"
          rotulo="E-mail"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          name="senha"
          type="password"
          rotulo="Senha"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        {erro && <p className="text-[13px] text-perigo">{erro}</p>}
        <Button type="submit" bloco disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-1 text-center text-[13px]">
        <Link href="/recuperar-senha" className="text-azul-elas hover:underline">
          Esqueci minha senha
        </Link>
        <span className="text-tinta-suave">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-azul-elas hover:underline">
            Criar conta
          </Link>
        </span>
      </div>
    </div>
  );
}
