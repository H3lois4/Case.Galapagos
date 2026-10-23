/**
 * Cliente de chat com IA via streaming (SSE) — Por ELAS finance.
 *
 * O endpoint /api/ai/chat/ responde text/event-stream. Usamos fetch + leitura
 * do corpo como stream (e não EventSource, que não permite POST com header
 * Authorization). Parseamos os eventos `meta`, `token`, `done` e `error`.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export interface StreamChatArgs {
  agente: string;
  mensagem: string;
  conversaId?: number | null;
  onMeta?: (meta: { conversa_id: number; user_message_id: number }) => void;
  onToken: (texto: string) => void;
  onDone?: (done: { message_id: number }) => void;
  onError?: (detail: string) => void;
  signal?: AbortSignal;
}

async function getToken(): Promise<string | null> {
  const { supabase } = await import("@/lib/supabase");
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function parseEvento(bloco: string): { evento: string; dados: string } | null {
  let evento = "message";
  const linhasDados: string[] = [];
  for (const linha of bloco.split("\n")) {
    if (linha.startsWith("event:")) evento = linha.slice(6).trim();
    else if (linha.startsWith("data:")) linhasDados.push(linha.slice(5).trim());
  }
  if (!linhasDados.length) return null;
  return { evento, dados: linhasDados.join("\n") };
}

export async function streamChat({
  agente,
  mensagem,
  conversaId,
  onMeta,
  onToken,
  onDone,
  onError,
  signal,
}: StreamChatArgs): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/ai/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      agente,
      mensagem,
      ...(conversaId ? { conversa_id: conversaId } : {}),
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    // Erro antes do stream (ex.: 429 rate limit, 400 agente inválido).
    let detail = `Erro ${res.status}`;
    try {
      const corpo = await res.json();
      detail = corpo.detail ?? detail;
    } catch {
      /* sem corpo JSON */
    }
    onError?.(detail);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const bloco = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const evt = parseEvento(bloco);
      if (!evt) continue;
      try {
        const dados = JSON.parse(evt.dados);
        if (evt.evento === "meta") onMeta?.(dados);
        else if (evt.evento === "token") onToken(dados.t ?? "");
        else if (evt.evento === "done") onDone?.(dados);
        else if (evt.evento === "error") onError?.(dados.detail ?? "Erro na IA.");
      } catch {
        /* bloco incompleto/ignorável */
      }
    }
  }
}
