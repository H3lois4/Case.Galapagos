"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { cn } from "@/lib/cn";
import { GraduationCap, Building2 } from "lucide-react";
import type { AccountType } from "@/lib/types";

export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<AccountType>("pessoal");
  const [termos, setTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!termos) {
      setErro("É preciso aceitar os termos e a política de privacidade.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Guardamos a intenção de tipo de conta para aplicar no 1º acesso.
        data: { account_type: tipo },
      },
    });
    setEnviando(false);
    if (error) {
      setErro(error.message || "Não foi possível criar a conta.");
      return;
    }
    setSucesso(true);
  }

  async function cadastrarComGoogle() {
    if (!termos) {
      setErro("É preciso aceitar os termos e a política de privacidade.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro("Não foi possível iniciar o cadastro com o Google.");
  }

  if (sucesso) {
    return (
      <div className="text-center">
        <h1 className="font-titulo text-[22px] font-bold text-tinta">Confirme seu e-mail</h1>
        <p className="mt-2 text-[14px] text-tinta-suave">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra o
          e-mail e clique no link para ativar sua conta.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-[14px] font-semibold text-azul-elas hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-titulo text-[22px] font-bold text-tinta">Criar conta</h1>
      <p className="mt-1 text-[14px] text-tinta-suave">
        Comece sua jornada no mercado financeiro.
      </p>

      {/* Tipo de conta */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <TipoCard
          ativo={tipo === "pessoal"}
          onClick={() => setTipo("pessoal")}
          Icone={GraduationCap}
          titulo="Quero me capacitar"
        />
        <TipoCard
          ativo={tipo === "empresa"}
          onClick={() => setTipo("empresa")}
          Icone={Building2}
          titulo="Represento uma empresa"
        />
      </div>

      <form onSubmit={cadastrar} className="mt-4 space-y-3">
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
          placeholder="mínimo 6 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
        />

        <label className="flex items-start gap-2 text-[13px] text-tinta-suave">
          <input
            type="checkbox"
            checked={termos}
            onChange={(e) => setTermos(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--azul-elas)]"
          />
          <span>
            Li e aceito os termos de uso e a política de privacidade (LGPD).
          </span>
        </label>

        {erro && <p className="text-[13px] text-perigo">{erro}</p>}

        <Button type="submit" bloco disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-[12px] text-tinta-suave">
        <span className="h-px flex-1 bg-borda" /> ou <span className="h-px flex-1 bg-borda" />
      </div>
      <Button variante="secondary" bloco type="button" onClick={cadastrarComGoogle}>
        <GoogleIcon className="h-5 w-5" />
        Continuar com Google
      </Button>

      <p className="mt-4 text-center text-[13px] text-tinta-suave">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-azul-elas hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

function TipoCard({
  ativo,
  onClick,
  Icone,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  Icone: typeof GraduationCap;
  titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-botao border p-3 text-center text-[13px] font-semibold transition-colors",
        ativo
          ? "border-azul-elas bg-azul-elas-suave text-azul-elas"
          : "border-borda text-tinta-suave hover:bg-fundo-alt",
      )}
    >
      <Icone className="h-6 w-6" strokeWidth={1.75} />
      {titulo}
    </button>
  );
}
