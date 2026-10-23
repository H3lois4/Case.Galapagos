"use client";

import { useState } from "react";
import { X, Loader2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiAuthJson } from "@/lib/api";
import type { MentoriaSlot } from "@/lib/types";

interface Props {
  onFechar: () => void;
  onCriado: (slot: MentoriaSlot) => void;
}

export function SlotForm({ onFechar, onCriado }: Props) {
  const [form, setForm] = useState({
    mentora_nome: "",
    mentora_cargo: "",
    mentora_email: "",
    tema: "",
    data: "",
    hora: "",
    duracao_min: 45,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!form.tema.trim() || !form.mentora_nome.trim() || !form.mentora_email.trim()) {
      setErro("Preencha tema, nome e e-mail da mentora.");
      return;
    }
    if (!form.data || !form.hora) {
      setErro("Escolha data e hora.");
      return;
    }
    const inicio = new Date(`${form.data}T${form.hora}`);
    if (isNaN(inicio.getTime()) || inicio <= new Date()) {
      setErro("A data precisa estar no futuro.");
      return;
    }
    setSalvando(true);
    try {
      const slot = await apiAuthJson<MentoriaSlot>("/api/mentoria/horarios/", {
        method: "POST",
        body: JSON.stringify({
          mentora_nome: form.mentora_nome.trim(),
          mentora_cargo: form.mentora_cargo.trim(),
          mentora_email: form.mentora_email.trim(),
          tema: form.tema.trim(),
          inicio: inicio.toISOString(),
          duracao_min: Number(form.duracao_min) || 45,
        }),
      });
      onCriado(slot);
    } catch (err) {
      const e = err as { corpo?: { detail?: string; inicio?: string[] } };
      setErro(e.corpo?.detail ?? e.corpo?.inicio?.[0] ?? "Não foi possível cadastrar.");
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cadastrar horário de mentoria"
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-fundo p-6 shadow-[var(--sombra-card)] sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titulo text-[20px] font-bold text-tinta">
            Cadastrar horário
          </h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-pill p-1 text-tinta-suave hover:bg-fundo-alt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <Input
            name="tema"
            rotulo="Tema da mentoria"
            placeholder="Ex.: Como entrar em Asset Management"
            value={form.tema}
            maxLength={160}
            onChange={(e) => set("tema", e.target.value)}
          />
          <Input
            name="mentora_nome"
            rotulo="Nome da mentora"
            value={form.mentora_nome}
            onChange={(e) => set("mentora_nome", e.target.value)}
          />
          <Input
            name="mentora_cargo"
            rotulo="Cargo da mentora"
            value={form.mentora_cargo}
            onChange={(e) => set("mentora_cargo", e.target.value)}
          />
          <Input
            name="mentora_email"
            type="email"
            rotulo="E-mail corporativo da mentora"
            value={form.mentora_email}
            onChange={(e) => set("mentora_email", e.target.value)}
          />
          <div className="flex gap-3">
            <Input
              name="data"
              type="date"
              rotulo="Data"
              value={form.data}
              onChange={(e) => set("data", e.target.value)}
            />
            <Input
              name="hora"
              type="time"
              rotulo="Hora"
              value={form.hora}
              onChange={(e) => set("hora", e.target.value)}
            />
          </div>
          <div className="w-full">
            <label htmlFor="duracao" className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Duração (min)
            </label>
            <select
              id="duracao"
              value={form.duracao_min}
              onChange={(e) => set("duracao_min", Number(e.target.value))}
              className="h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 text-[15px] text-tinta focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
            >
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
            </select>
          </div>

          {erro && <p className="text-[13px] text-perigo">{erro}</p>}

          <Button type="submit" bloco disabled={salvando}>
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
            Cadastrar horário
          </Button>
        </form>
      </div>
    </div>
  );
}
