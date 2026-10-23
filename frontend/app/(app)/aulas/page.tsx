"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Search, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChipsEmpresas, type FiltroAulas } from "@/components/aulas/ChipsEmpresas";
import { LessonCard } from "@/components/aulas/LessonCard";
import { UploadAulaModal } from "@/components/aulas/UploadAulaModal";
import { apiAuthJson } from "@/lib/api";
import type {
  Aula,
  EmpresaComAulas,
  EmpresasComAulasResp,
  Me,
  Pagina,
} from "@/lib/types";

export default function AulasPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaComAulas[]>([]);
  const [temIa, setTemIa] = useState(false);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [filtro, setFiltro] = useState<FiltroAulas>({ tipo: "todas" });
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega perfil e empresas (uma vez).
  useEffect(() => {
    apiAuthJson<Me>("/api/me/")
      .then(setMe)
      .catch(() => setMe(null));
    apiAuthJson<EmpresasComAulasResp>("/api/aulas/empresas/")
      .then((r) => {
        setEmpresas(r.empresas);
        setTemIa(r.tem_ia);
      })
      .catch(() => {});
  }, []);

  // Debounce da busca.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBuscaDebounce(busca.trim()), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busca]);

  const carregarAulas = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtro.tipo === "ia") params.set("origem", "ia");
    else if (filtro.tipo === "empresa") params.set("empresa", filtro.slug);
    if (buscaDebounce) params.set("q", buscaDebounce);
    const qs = params.toString();
    try {
      const r = await apiAuthJson<Pagina<Aula>>(
        `/api/aulas/${qs ? `?${qs}` : ""}`,
      );
      setAulas(r.results);
    } catch {
      setAulas([]);
    } finally {
      setCarregando(false);
    }
  }, [filtro, buscaDebounce]);

  useEffect(() => {
    carregarAulas();
  }, [carregarAulas]);

  function aoCriarAula(aula: Aula) {
    setModalAberto(false);
    setAulas((atual) => [aula, ...atual]);
    // Atualiza os chips (a empresa pode ter ganho sua primeira aula).
    apiAuthJson<EmpresasComAulasResp>("/api/aulas/empresas/")
      .then((r) => {
        setEmpresas(r.empresas);
        setTemIa(r.tem_ia);
      })
      .catch(() => {});
  }

  const podePublicar = me?.empresa_status === "aprovada";

  // Agrupa por seção quando o filtro é "todas"; caso contrário, uma lista só.
  const aulasIa = aulas.filter((a) => a.origem === "ia");
  const porEmpresa = new Map<string, { nome: string; aulas: Aula[] }>();
  for (const a of aulas) {
    if (a.origem === "ia" || !a.empresa_slug) continue;
    const grupo = porEmpresa.get(a.empresa_slug) ?? {
      nome: a.empresa_nome ?? a.empresa_slug,
      aulas: [],
    };
    grupo.aulas.push(a);
    porEmpresa.set(a.empresa_slug, grupo);
  }

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-titulo text-[24px] font-bold text-tinta">Aulas</h1>
          <p className="text-[14px] text-tinta-suave">
            Aprenda sobre o mercado financeiro no seu ritmo.
          </p>
        </div>
        {podePublicar && (
          <Button
            variante="destaque"
            className="h-10 shrink-0 px-4"
            onClick={() => setModalAberto(true)}
          >
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título"
          aria-label="Buscar aulas por título"
          className="h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt pl-10 pr-3.5 text-[15px] text-tinta placeholder:text-tinta-suave/70 focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
        />
      </div>

      {/* Chips */}
      {(empresas.length > 0 || temIa) && (
        <ChipsEmpresas
          empresas={empresas}
          temIa={temIa}
          filtro={filtro}
          onSelecionar={setFiltro}
        />
      )}

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-azul-elas" />
        </div>
      ) : aulas.length === 0 ? (
        <VazioAulas comBusca={!!buscaDebounce} />
      ) : filtro.tipo === "todas" ? (
        <div className="space-y-8">
          {aulasIa.length > 0 && (
            <Secao titulo="Básico com IA" aulas={aulasIa} />
          )}
          {[...porEmpresa.values()].map((g) => (
            <Secao key={g.nome} titulo={g.nome} aulas={g.aulas} />
          ))}
        </div>
      ) : (
        <GradeAulas aulas={aulas} />
      )}

      {modalAberto && (
        <UploadAulaModal
          onFechar={() => setModalAberto(false)}
          onCriada={aoCriarAula}
        />
      )}
    </div>
  );
}

function Secao({ titulo, aulas }: { titulo: string; aulas: Aula[] }) {
  return (
    <section>
      <h2 className="mb-3 font-titulo text-[18px] font-semibold text-tinta">
        {titulo}
      </h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {aulas.map((a) => (
          <LessonCard key={a.id} aula={a} />
        ))}
      </div>
    </section>
  );
}

function GradeAulas({ aulas }: { aulas: Aula[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
      {aulas.map((a) => (
        <div key={a.id} className="[&>a]:w-full">
          <LessonCard aula={a} />
        </div>
      ))}
    </div>
  );
}

function VazioAulas({ comBusca }: { comBusca: boolean }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
      <GraduationCap className="h-10 w-10 text-tinta-suave/60" strokeWidth={1.5} />
      <p className="mt-3 text-[15px] font-semibold text-tinta">
        {comBusca ? "Nenhuma aula encontrada" : "Ainda não há aulas por aqui"}
      </p>
      <p className="mt-1 max-w-xs text-[13px] text-tinta-suave">
        {comBusca
          ? "Tente outro termo de busca."
          : "Em breve as empresas e o Básico com IA trazem conteúdo novo."}
      </p>
    </div>
  );
}
