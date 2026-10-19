/**
 * Cliente da API do backend (por-elas-api).
 * A URL base vem de NEXT_PUBLIC_API_URL. Já preparado para enviar o token
 * Bearer do Supabase quando o fluxo de auth entrar (etapa 01-auth-perfis).
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch(
  path: string,
  { token, headers, ...rest }: ApiOptions = {},
): Promise<Response> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}

export interface HealthResponse {
  status: "ok" | "degraded";
  db: "ok" | "error";
  time: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await apiFetch("/api/health/", { cache: "no-store" });
  if (!res.ok && res.status !== 503) {
    throw new Error(`Health check falhou: ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}

/**
 * Chamada autenticada: busca o token da sessão Supabase e envia como Bearer.
 * Importa o supabase de forma dinâmica para manter este módulo utilizável no server.
 */
export async function apiAuth(
  path: string,
  opts: RequestInit = {},
): Promise<Response> {
  const { supabase } = await import("@/lib/supabase");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? null;
  return apiFetch(path, { ...opts, token });
}

/** Helper que já devolve JSON e lança em erro != 2xx (com corpo). */
export async function apiAuthJson<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await apiAuth(path, opts);
  const texto = await res.text();
  const corpo = texto ? JSON.parse(texto) : null;
  if (!res.ok) {
    const erro = new Error(`API ${res.status}`) as Error & {
      status?: number;
      corpo?: unknown;
    };
    erro.status = res.status;
    erro.corpo = corpo;
    throw erro;
  }
  return corpo as T;
}
