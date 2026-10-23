"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { apiAuth } from "@/lib/api";
import { streamChat } from "@/lib/aiChat";
import {
  falar,
  pararFala,
  reconhecer,
  reconhecimentoDisponivel,
  sinteseDisponivel,
  type Reconhecedor,
} from "@/lib/voz";
import type { MensagemIA } from "@/lib/types";

interface Props {
  agente: string;
  titulo?: string;
}

// Mensagem local: id pode ser temporário (negativo) enquanto faz streaming.
interface MsgLocal extends Omit<MensagemIA, "ordem" | "criado_em"> {
  streaming?: boolean;
}

export function ChatIA({ agente, titulo }: Props) {
  const [mensagens, setMensagens] = useState<MsgLocal[]>([]);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [modoVoz, setModoVoz] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<Reconhecedor | null>(null);
  const modoVozRef = useRef(false);

  const temVozEntrada = reconhecimentoDisponivel();
  const temVozSaida = sinteseDisponivel();

  useEffect(() => {
    modoVozRef.current = modoVoz;
  }, [modoVoz]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviar = useCallback(
    async (texto: string) => {
      const conteudo = texto.trim();
      if (!conteudo || enviando) return;
      setErro(null);
      setRascunho("");

      const idUser = -Date.now();
      const idIa = idUser - 1;
      setMensagens((m) => [
        ...m,
        { id: idUser, papel: "user", conteudo, util: null },
        { id: idIa, papel: "assistant", conteudo: "", util: null, streaming: true },
      ]);
      setEnviando(true);

      let textoIa = "";
      await streamChat({
        agente,
        mensagem: conteudo,
        conversaId,
        onMeta: (meta) => setConversaId(meta.conversa_id),
        onToken: (t) => {
          textoIa += t;
          setMensagens((m) =>
            m.map((msg) => (msg.id === idIa ? { ...msg, conteudo: textoIa } : msg)),
          );
        },
        onDone: (done) => {
          setMensagens((m) =>
            m.map((msg) =>
              msg.id === idIa ? { ...msg, id: done.message_id, streaming: false } : msg,
            ),
          );
          if (modoVozRef.current && temVozSaida) falar(textoIa);
        },
        onError: (detail) => {
          setErro(detail);
          setMensagens((m) => m.filter((msg) => msg.id !== idIa && msg.id !== idUser));
        },
      }).catch((e) => setErro(e?.message ?? "Erro ao enviar."));

      setEnviando(false);
    },
    [agente, conversaId, enviando, temVozSaida],
  );

  function alternarGravacao() {
    if (gravando) {
      recRef.current?.parar();
      return;
    }
    setErro(null);
    const rec = reconhecer({
      onResultado: (texto, final) => {
        setRascunho(texto);
        if (final) {
          recRef.current?.parar();
          if (modoVozRef.current) enviar(texto);
        }
      },
      onFim: () => setGravando(false),
      onErro: (e) => {
        setErro(e);
        setGravando(false);
      },
    });
    if (rec) {
      recRef.current = rec;
      setGravando(true);
    }
  }

  async function novaConversa() {
    pararFala();
    setMensagens([]);
    setConversaId(null);
    setErro(null);
    setRascunho("");
  }

  async function darFeedback(id: number, util: boolean) {
    if (id < 0) return;
    setMensagens((m) => m.map((msg) => (msg.id === id ? { ...msg, util } : msg)));
    await apiAuth(`/api/ai/mensagens/${id}/feedback/`, {
      method: "POST",
      body: JSON.stringify({ util }),
    }).catch(() => {});
  }

  return (
    <div className="flex min-h-[60dvh] flex-col">
      {/* Cabeçalho */}
      <div className="mb-3 flex items-center justify-between">
        <h1 className="inline-flex items-center gap-2 font-titulo text-[20px] font-bold text-tinta">
          <Sparkles className="h-5 w-5 text-azul-elas" strokeWidth={1.75} />
          {titulo ?? "Assistente"}
        </h1>
        <button
          onClick={novaConversa}
          className="inline-flex items-center gap-1.5 rounded-pill border border-borda px-3 py-1.5 text-[13px] font-semibold text-tinta-suave hover:border-azul-elas hover:text-tinta"
        >
          <Plus className="h-4 w-4" /> Nova conversa
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-card border border-borda bg-fundo-alt p-4">
        {mensagens.length === 0 && (
          <p className="py-10 text-center text-[14px] text-tinta-suave">
            Comece a conversa. Você pode digitar ou usar o microfone.
          </p>
        )}
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.papel === "user" ? "justify-end" : "justify-start")}
          >
            <div className="max-w-[85%]">
              <div
                className={cn(
                  "whitespace-pre-line rounded-card px-4 py-2.5 text-[15px] leading-relaxed",
                  msg.papel === "user"
                    ? "bg-azul-elas text-white"
                    : "border border-borda bg-fundo text-tinta",
                )}
              >
                {msg.conteudo || (msg.streaming ? "…" : "")}
              </div>
              {msg.papel === "assistant" && !msg.streaming && msg.conteudo && (
                <div className="mt-1 flex items-center gap-2 text-tinta-suave">
                  {temVozSaida && (
                    <button
                      onClick={() => falar(msg.conteudo)}
                      aria-label="Ouvir resposta"
                      className="rounded-pill p-1 hover:bg-fundo-alt hover:text-tinta"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => darFeedback(msg.id, true)}
                    aria-label="Resposta útil"
                    className={cn(
                      "rounded-pill p-1 hover:bg-fundo-alt",
                      msg.util === true && "text-sucesso",
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => darFeedback(msg.id, false)}
                    aria-label="Resposta não útil"
                    className={cn(
                      "rounded-pill p-1 hover:bg-fundo-alt",
                      msg.util === false && "text-perigo",
                    )}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      {erro && (
        <p className="mt-2 rounded-chip bg-perigo/10 px-3 py-2 text-[13px] text-perigo">
          {erro}
        </p>
      )}

      {/* Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(rascunho);
        }}
        className="mt-3 flex items-end gap-2"
      >
        {temVozEntrada && (
          <button
            type="button"
            onClick={alternarGravacao}
            aria-label={gravando ? "Parar gravação" : "Falar"}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border transition-colors",
              gravando
                ? "border-perigo bg-perigo/10 text-perigo"
                : "border-borda text-tinta-suave hover:border-azul-elas hover:text-azul-elas",
            )}
          >
            {gravando ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <textarea
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(rascunho);
            }
          }}
          rows={1}
          placeholder={gravando ? "Ouvindo…" : "Escreva sua mensagem"}
          className="max-h-32 min-h-12 flex-1 resize-none rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 py-3 text-[15px] text-tinta placeholder:text-tinta-suave/70 focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30"
        />
        <button
          type="submit"
          disabled={enviando || !rascunho.trim()}
          aria-label="Enviar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-azul-elas text-white transition-colors hover:bg-azul-elas-escuro disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Modo conversa por voz */}
      {temVozEntrada && temVozSaida && (
        <label className="mt-2 flex items-center gap-2 text-[13px] text-tinta-suave">
          <input
            type="checkbox"
            checked={modoVoz}
            onChange={(e) => setModoVoz(e.target.checked)}
            className="h-4 w-4 accent-azul-elas"
          />
          Modo conversa por voz (fala, envia e lê a resposta automaticamente)
        </label>
      )}
      {!temVozEntrada && (
        <p className="mt-2 text-[12px] text-tinta-suave">
          Seu navegador não suporta voz. Use o modo texto normalmente.
        </p>
      )}
    </div>
  );
}
