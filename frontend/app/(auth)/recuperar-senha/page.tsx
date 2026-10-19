"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setEnviando(false);
    setEnviado(true); // sempre confirma (não revela se o e-mail existe)
  }

  if (enviado) {
    return (
      <div className="text-center">
        <h1 className="font-titulo text-[22px] font-bold text-tinta">Verifique seu e-mail</h1>
        <p className="mt-2 text-[14px] text-tinta-suave">
          Se existir uma conta com <strong>{email}</strong>, enviamos um link
          para redefinir a senha.
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
      <h1 className="font-titulo text-[22px] font-bold text-tinta">Recuperar senha</h1>
      <p className="mt-1 text-[14px] text-tinta-suave">
        Enviaremos um link para você criar uma nova senha.
      </p>
      <form onSubmit={enviar} className="mt-5 space-y-3">
        <Input
          name="email"
          type="email"
          rotulo="E-mail"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" bloco disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-[13px]">
        <Link href="/login" className="text-azul-elas hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
