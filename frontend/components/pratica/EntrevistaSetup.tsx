"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuthJson } from "@/lib/api";
import type { Entrevista } from "@/lib/types";

export function EntrevistaSetup({
  onIniciada,
}: {
  onIniciada: (entrevista: Entrevista) => void;
}) {
  const [form, setForm] = useState({
    vaga: "",
    papel_entrevistador: "",
    tipo: "comportamental",
    nivel: "júnior",
    idioma: "pt" as "pt" | "en",
    descricao: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  function set<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function iniciar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vaga.trim()) {
      setErro("Informe a vaga/empresa.");
      return;
    }
    setCriando(true);
    setErro(null);
    try {
      const entrevista = await apiAuthJson<Entrevista>("/api/pratica/entrevistas/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onIniciada(entrevista);
    } catch {
      setErro("Não foi possível iniciar a entrevista.");
      setCriando(false);
    }
  }

  return (
    <form onSubmit={iniciar} className="space-y-3 rounded-card border border-borda bg-fundo p-4">
      <p className="text-[14px] text-tinta-suave">
        Preencha o contexto e a IA conduzirá uma entrevista de treino.
      </p>
      <Input
        name="vaga"
        rotulo="Vaga / empresa"
        placeholder="Ex.: Analista de Research em um banco"
        value={form.vaga}
        onChange={(e) => set("vaga", e.target.value)}
      />
      <Input
        name="papel_entrevistador"
        rotulo="Papel do entrevistador (opcional)"
        placeholder="Ex.: Gestora de Research"
        value={form.papel_entrevistador}
        onChange={(e) => set("papel_entrevistador", e.target.value)}
      />
      <div className="flex gap-3">
        <div className="w-full">
          <label htmlFor="tipo" className="mb-1.5 block text-[13px] font-semibold text-tinta">
            Tipo
          </label>
          <select
            id="tipo"
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            className="h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 text-[15px] text-tinta focus:border-azul-elas focus:outline-none"
          >
            <option value="comportamental">Comportamental</option>
            <option value="técnica">Técnica</option>
            <option value="fit cultural">Fit cultural</option>
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="nivel" className="mb-1.5 block text-[13px] font-semibold text-tinta">
            Nível
          </label>
          <select
            id="nivel"
            value={form.nivel}
            onChange={(e) => set("nivel", e.target.value)}
            className="h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 text-[15px] text-tinta focus:border-azul-elas focus:outline-none"
          >
            <option value="estágio">Estágio</option>
            <option value="júnior">Júnior</option>
            <option value="pleno">Pleno</option>
            <option value="sênior">Sênior</option>
          </select>
        </div>
      </div>
      <div className="w-full">
        <label htmlFor="idioma" className="mb-1.5 block text-[13px] font-semibold text-tinta">
          Idioma
        </label>
        <select
          id="idioma"
          value={form.idioma}
          onChange={(e) => set("idioma", e.target.value as "pt" | "en")}
          className="h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3 text-[15px] text-tinta focus:border-azul-elas focus:outline-none"
        >
          <option value="pt">Português</option>
          <option value="en">Inglês</option>
        </select>
      </div>
      <div className="w-full">
        <label htmlFor="descricao" className="mb-1.5 block text-[13px] font-semibold text-tinta">
          Descrição da vaga (opcional)
        </label>
        <textarea
          id="descricao"
          rows={3}
          value={form.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          className="w-full resize-none rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 py-2.5 text-[15px] text-tinta focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
        />
      </div>

      {erro && <p className="text-[13px] text-perigo">{erro}</p>}

      <Button type="submit" bloco disabled={criando}>
        {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Iniciar entrevista
      </Button>
    </form>
  );
}
