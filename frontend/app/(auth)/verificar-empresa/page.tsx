"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuth } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Etapa = "form" | "codigo" | "ok";

export default function VerificarEmpresaPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [nome, setNome] = useState("");
  const [site, setSite] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ empresa: string; status: string } | null>(null);

  async function iniciar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const res = await apiAuth("/api/empresa/verificar/", {
      method: "POST",
      body: JSON.stringify({
        nome_empresa: nome,
        site,
        cnpj,
        email_corporativo: email,
      }),
    });
    setEnviando(false);
    const corpo = await res.json().catch(() => null);
    if (res.ok) {
      setEtapa("codigo");
    } else {
      setErro(corpo?.detail ?? "Não foi possível enviar o código.");
    }
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const res = await apiAuth("/api/empresa/confirmar/", {
      method: "POST",
      body: JSON.stringify({ codigo }),
    });
    setEnviando(false);
    const corpo = await res.json().catch(() => null);
    if (res.ok) {
      setResultado(corpo);
      setEtapa("ok");
    } else {
      setErro(corpo?.detail ?? "Código inválido.");
    }
  }

  async function reenviar() {
    setErro(null);
    await apiAuth("/api/empresa/reenviar/", { method: "POST" });
  }

  if (etapa === "ok") {
    const aprovada = resultado?.status === "aprovada";
    return (
      <div className="text-center">
        <h1 className="font-titulo text-[22px] font-bold text-tinta">
          {aprovada ? "Empresa verificada!" : "Quase lá!"}
        </h1>
        <p className="mt-2 text-[14px] text-tinta-suave">
          {aprovada
            ? `A empresa ${resultado?.empresa} foi aprovada. As funções de empresa já estão liberadas.`
            : "Recebemos sua verificação. Sua empresa está em análise pela nossa equipe. Enquanto isso, você usa o app como conta pessoal."}
        </p>
        <Button className="mt-5" bloco onClick={() => router.replace("/perfil")}>
          Ir para o perfil
        </Button>
      </div>
    );
  }

  if (etapa === "codigo") {
    return (
      <div>
        <h1 className="font-titulo text-[22px] font-bold text-tinta">Digite o código</h1>
        <p className="mt-1 text-[14px] text-tinta-suave">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>. Ele
          expira em 15 minutos.
        </p>
        <form onSubmit={confirmar} className="mt-5 space-y-3">
          <Input
            name="codigo"
            rotulo="Código de verificação"
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            className="text-center text-[20px] tracking-[0.4em]"
            erro={erro}
          />
          <Button type="submit" bloco disabled={enviando || codigo.length !== 6}>
            {enviando ? "Confirmando…" : "Confirmar"}
          </Button>
        </form>
        <button
          type="button"
          onClick={reenviar}
          className="mt-4 w-full text-center text-[13px] text-azul-elas hover:underline"
        >
          Reenviar código
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-titulo text-[22px] font-bold text-tinta">Verificar empresa</h1>
      <p className="mt-1 text-[14px] text-tinta-suave">
        Comprove seu vínculo com um e-mail corporativo para publicar em nome da
        empresa.
      </p>
      <form onSubmit={iniciar} className="mt-5 space-y-3">
        <Input
          name="nome"
          rotulo="Nome da empresa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          name="site"
          rotulo="Site (opcional)"
          placeholder="https://"
          value={site}
          onChange={(e) => setSite(e.target.value)}
        />
        <Input
          name="cnpj"
          rotulo="CNPJ (opcional)"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />
        <Input
          name="email"
          type="email"
          rotulo="E-mail corporativo"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {erro && <p className="text-[13px] text-perigo">{erro}</p>}
        <Button type="submit" bloco disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar código"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => router.replace("/perfil")}
        className="mt-4 w-full text-center text-[13px] text-tinta-suave hover:underline"
      >
        Fazer isso depois
      </button>
    </div>
  );
}
