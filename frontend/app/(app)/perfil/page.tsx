"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiStatusBadge } from "@/components/diagnostico/ApiStatusBadge";
import { useAuth } from "@/components/auth/AuthProvider";
import { PlanoChecklist } from "@/components/carreira/PlanoChecklist";
import { MinhasMentorias } from "@/components/mentoria/MinhasMentorias";
import { apiAuth, apiAuthJson } from "@/lib/api";
import { enviarFotoPerfil, validarArquivo } from "@/lib/upload";
import { invalidarAvatarCache } from "@/components/nav/AvatarUsuaria";
import type {
  Me,
  Mentoria,
  PlanoCarreira,
  SimuladoHistorico,
  EntrevistaHistorico,
} from "@/lib/types";
import { LogOut, Trash2, Building2, Loader2, Camera } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [plano, setPlano] = useState<PlanoCarreira | null>(null);
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [simulados, setSimulados] = useState<SimuladoHistorico[]>([]);
  const [entrevistas, setEntrevistas] = useState<EntrevistaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome_exibicao: "", descricao: "", linkedin: "" });
  const [fotoProgresso, setFotoProgresso] = useState<number | null>(null);
  const [fotoErro, setFotoErro] = useState<string | null>(null);

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
    // Plano de carreira (pode não existir → 404, ignorado)
    apiAuthJson<PlanoCarreira>("/api/carreira/plano/")
      .then(setPlano)
      .catch(() => setPlano(null));
    // Minhas mentorias
    apiAuthJson<Mentoria[]>("/api/mentoria/minhas/")
      .then(setMentorias)
      .catch(() => setMentorias([]));
    // Histórico de prática
    apiAuthJson<SimuladoHistorico[]>("/api/pratica/simulados/historico/")
      .then(setSimulados)
      .catch(() => setSimulados([]));
    apiAuthJson<EntrevistaHistorico[]>("/api/pratica/entrevistas/historico/")
      .then(setEntrevistas)
      .catch(() => setEntrevistas([]));
  }, []);

  function dataCurta(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "";
    }
  }

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

  async function aoEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite reescolher o mesmo arquivo
    if (!arquivo) return;
    setFotoErro(null);

    const erro = await validarArquivo(arquivo, "imagem");
    if (erro) {
      setFotoErro(erro);
      return;
    }
    try {
      setFotoProgresso(0);
      const urlPublica = await enviarFotoPerfil(arquivo, setFotoProgresso);
      const m = await apiAuthJson<Me>("/api/me/", {
        method: "PATCH",
        body: JSON.stringify({ foto: urlPublica }),
      });
      setMe(m);
      invalidarAvatarCache(); // atualiza o avatar do topo
    } catch {
      setFotoErro("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setFotoProgresso(null);
    }
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
        <label
          className="group relative h-16 w-16 shrink-0 cursor-pointer"
          title="Trocar foto de perfil"
        >
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas text-xl font-bold text-white">
            {me?.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.foto} alt="" className="h-full w-full object-cover" />
            ) : (
              (me?.nome_exibicao || me?.username || me?.email || "?").charAt(0).toUpperCase()
            )}
          </span>
          {/* Badge de câmera */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-pill border-2 border-fundo bg-azul-elas text-white">
            {fotoProgresso !== null ? (
              <span className="text-[9px] font-bold">{fotoProgresso}%</span>
            ) : (
              <Camera className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={aoEscolherFoto}
            disabled={fotoProgresso !== null}
          />
        </label>
        <div className="min-w-0">
          <h1 className="font-titulo text-[22px] font-bold text-tinta">
            {me?.nome_exibicao || me?.username}
          </h1>
          <p className="truncate text-[14px] text-tinta-suave">@{me?.username}</p>
          {fotoErro ? (
            <p className="text-[12px] text-perigo">{fotoErro}</p>
          ) : (
            me?.username && (
              <Link
                href={`/u/${me.username}`}
                className="text-[13px] font-semibold text-azul-elas hover:underline"
              >
                Ver perfil público
              </Link>
            )
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

      {/* Minha jornada */}
      <Card>
        <h2 className="font-titulo text-[18px] font-semibold text-tinta">Minha jornada</h2>
        <div className="mt-3">
          <h3 className="text-[14px] font-semibold text-tinta">Plano de carreira</h3>
          {plano ? (
            <div className="mt-2">
              <PlanoChecklist plano={plano} onMudou={setPlano} />
            </div>
          ) : (
            <p className="mt-1 text-[13px] text-tinta-suave">
              Você ainda não tem um plano.{" "}
              <Link href="/carreira" className="font-semibold text-azul-elas hover:underline">
                Montar com a IA de carreira
              </Link>
              .
            </p>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-[14px] font-semibold text-tinta">Minhas mentorias</h3>
          <div className="mt-2">
            <MinhasMentorias mentorias={mentorias} onMudou={setMentorias} compacto />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-[14px] font-semibold text-tinta">Simulados</h3>
          {simulados.length === 0 ? (
            <p className="mt-1 text-[13px] text-tinta-suave">
              Nenhum simulado feito.{" "}
              <Link href="/pratica" className="font-semibold text-azul-elas hover:underline">
                Fazer um
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-[13px]">
              {simulados.slice(0, 5).map((s) => (
                <li key={s.id} className="flex justify-between gap-3 text-tinta">
                  <span className="truncate">{s.tema}</span>
                  <span className="shrink-0 text-tinta-suave">
                    {s.nota}/{s.total} · {dataCurta(s.criado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-[14px] font-semibold text-tinta">Entrevistas</h3>
          {entrevistas.length === 0 ? (
            <p className="mt-1 text-[13px] text-tinta-suave">Nenhuma entrevista feita.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-[13px]">
              {entrevistas.slice(0, 5).map((e) => (
                <li key={e.id} className="flex justify-between gap-3 text-tinta">
                  <span className="truncate">{e.vaga}</span>
                  <span className="shrink-0 text-tinta-suave">
                    {e.nota_geral != null ? `${e.nota_geral}/10 · ` : ""}
                    {dataCurta(e.criado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
