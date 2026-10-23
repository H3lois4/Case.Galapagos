/**
 * Voz pelo navegador (Web Speech API) — Por ELAS finance.
 *
 * Reconhecimento de fala (ditado) e síntese de voz (ouvir a resposta). Sem
 * custo e sem servidor. Quando o navegador não suporta, as funções avisam e a
 * interface mantém o modo texto.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function reconhecimentoDisponivel(): boolean {
  return getRecognitionCtor() !== null;
}

export function sinteseDisponivel(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface Reconhecedor {
  parar: () => void;
}

/** Inicia o ditado. Chama onResultado com o texto (parcial e final) e onFim ao parar. */
export function reconhecer({
  lang = "pt-BR",
  onResultado,
  onFim,
  onErro,
}: {
  lang?: string;
  onResultado: (texto: string, final: boolean) => void;
  onFim?: () => void;
  onErro?: (erro: string) => void;
}): Reconhecedor | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    onErro?.("Seu navegador não suporta reconhecimento de voz.");
    return null;
  }
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;

  rec.onresult = (e: any) => {
    let texto = "";
    let final = false;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      texto += e.results[i][0].transcript;
      if (e.results[i].isFinal) final = true;
    }
    onResultado(texto, final);
  };
  rec.onerror = (e: any) => onErro?.(e?.error ?? "Erro no reconhecimento de voz.");
  rec.onend = () => onFim?.();

  rec.start();
  return { parar: () => rec.stop() };
}

/** Lê o texto em voz alta. Retorna false se não houver suporte. */
export function falar(texto: string, { lang = "pt-BR" }: { lang?: string } = {}): boolean {
  if (!sinteseDisponivel() || !texto.trim()) return false;
  const sintese = window.speechSynthesis;
  sintese.cancel(); // interrompe fala anterior
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = lang;
  sintese.speak(u);
  return true;
}

export function pararFala(): void {
  if (sinteseDisponivel()) window.speechSynthesis.cancel();
}
