"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) {
      setErro("Não foi possível redefinir. Abra o link do e-mail novamente.");
      return;
    }
    router.replace("/aulas");
  }

  return (
    <div>
      <h1 className="font-titulo text-[22px] font-bold text-tinta">Nova senha</h1>
      <p className="mt-1 text-[14px] text-tinta-suave">Defina sua nova senha.</p>
      <form onSubmit={salvar} className="mt-5 space-y-3">
        <Input
          name="senha"
          type="password"
          rotulo="Nova senha"
          placeholder="mínimo 6 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
        />
        {erro && <p className="text-[13px] text-perigo">{erro}</p>}
        <Button type="submit" bloco disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
