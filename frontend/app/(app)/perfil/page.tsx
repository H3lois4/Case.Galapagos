"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiStatusBadge } from "@/components/diagnostico/ApiStatusBadge";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiAuth, apiAuthJson } from "@/lib/api";
import type { Me } from "@/lib/types";
import { LogOut, Trash2, Building2, Loader2 } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome_exibicao: "", descricao: "", linkedin: "" });

  useEffect(() => {
    apiAuthJson<Me>("/api/me/")
      .then((m) => {
        setMe(m);
        setForm({
          nome_exibicao: m.nome_exibicao ?? "",
          descricao: m.descricao ?? "",
          linkedin: m.linkedin ?? "",
        });
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const m = await apiAuthJson<Me>("/api/me/", {
      method: "PATCH",
      body: JSON.stringify(form),
    }).catch(() => null);
    setSalvando(false);
    if (m) setMe(m);
  }

  async function sair() {
    await signOut();
    router.replace("/login");
  }

  async function excluir() {
    if (!confirm("Tem certeza que deseja excluir sua conta? Essa ação é definitiva.")) return;
    await apiAuth("/api/me/", { method: "DELETE" });
    await signOut();
    router.replace("/login");
  }

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas text-xl font-bold text-white">
          {me?.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.foto} alt="" className="h-full w-full object-cover" />
          ) : (
            (me?.nome_exibicao || me?.username || me?.email || "?").charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <h1 className="font-titulo text-[22px] font-bold text-tinta">
            {me?.nome_exibicao || me?.username}
          </h1>
          <p className="truncate text-[14px] text-tinta-suave">@{me?.username}</p>
          {me?.username && (
            <Link
              href={`/u/${me.username}`}
              className="text-[13px] font-semibold text-azul-elas hover:underline"
            >
              Ver perfil público
            </Link>
          )}
        </div>
      </div>

      {/* Dados privados */}
      <Card>
        <h2 className="font-titulo text-[18px] font-semibold text-tinta">Seus dados</h2>
        <dl className="mt-3 space-y-1 text-[14px]">
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-suave">E-mail</dt>
            <dd className="truncate text-tinta">{me?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-suave">Tipo de conta</dt>
            <dd className="text-tinta">{me?.account_type}</dd>
          </div>
          {me?.account_type === "empresa" && (
            <div className="flex justify-between gap-4">
              <dt className="text-tinta-suave">Empresa</dt>
              <dd className="text-tinta">
                {me?.empresa?.nome ?? "—"}{" "}
                {me?.empresa_status && (
                  <span className="text-tinta-suave">({me.empresa_status})</span>
                )}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-suave">Seguidores</dt>
            <dd className="text-tinta">{me?.total_seguidores}</dd>
          </div>
        </dl>
      </Card>

      {/* Verificação de empresa */}
      {(me?.account_type === "empresa" || !me?.empresa) && me?.empresa_status !== "aprovada" && (
        <Card>
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 shrink-0 text-azul-elas" strokeWidth={1.75} />
            <div>
              <h2 className="font-titulo text-[16px] font-semibold text-tinta">
                {me?.empresa_status === "pendente"
                  ? "Empresa em análise"
                  : "Representa uma empresa?"}
              </h2>
              <p className="mt-1 text-[13px] text-tinta-suave">
                {me?.empresa_status === "pendente"
                  ? "Nossa equipe está avaliando sua empresa."
                  : "Verifique um e-mail corporativo para publicar em nome da empresa."}
              </p>
              {me?.empresa_status !== "pendente" && (
                <Link href="/verificar-empresa">
                  <Button variante="secondary" className="mt-3 h-10">
                    Verificar empresa
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Editar */}
      <Card>
        <h2 className="font-titulo text-[18px] font-semibold text-tinta">Editar perfil</h2>
        <form onSubmit={salvar} className="mt-3 space-y-3">
          <Input
            name="nome_exibicao"
            rotulo="Nome de exibição"
            value={form.nome_exibicao}
            onChange={(e) => setForm({ ...form, nome_exibicao: e.target.value })}
          />
          <Input
            name="descricao"
            rotulo="Descrição curta"
            value={form.descricao}
            maxLength={200}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
          <Input
            name="linkedin"
            rotulo="LinkedIn"
            placeholder="https://linkedin.com/in/voce"
            value={form.linkedin}
            onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
          />
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </Card>

      {/* Seções reservadas (próximas etapas) */}
      <Card>
        <h2 className="font-titulo text-[18px] font-semibold text-tinta">Minha jornada</h2>
        <ul className="mt-2 space-y-1 text-[14px] text-tinta-suave">
          <li>Plano de carreira — em breve (etapa Carreira)</li>
          <li>Minhas mentorias — em breve (etapa Mentoria)</li>
          <li>Histórico de entrevistas e simulados — em breve (etapa Prática)</li>
        </ul>
      </Card>

      <Card>
        <h2 className="font-titulo text-[18px] font-semibold text-tinta">Diagnóstico</h2>
        <div className="mt-3">
          <ApiStatusBadge />
        </div>
        <Link
          href="/assistente"
          className="mt-3 inline-block text-[13px] font-semibold text-azul-elas hover:underline"
        >
          Testar assistente de IA
        </Link>
      </Card>

      {/* Ações da conta */}
      <div className="flex flex-col gap-3">
        <Button variante="secondary" onClick={sair}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
        <button
          onClick={excluir}
          className="inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-perigo hover:underline"
        >
          <Trash2 className="h-4 w-4" /> Excluir conta
        </button>
      </div>
    </div>
  );
}
