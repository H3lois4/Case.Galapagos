import { cn } from "@/lib/cn";

/**
 * Símbolo da marca: barras de gráfico + seta subindo.
 * Placeholder até a logo oficial chegar em public/brand/.
 * `corRosa` controla a cor do símbolo (padrão rosa da marca).
 */
export function LogoMark({
  className,
  corRosa = "currentColor",
}: {
  className?: string;
  corRosa?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={corRosa}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <path d="M4 20V11M10 20V7M16 20v-4" />
      <path d="M14 5h6v6" />
      <path d="M20 5l-9 9" />
    </svg>
  );
}

/**
 * Logo completa: símbolo + "Por ELAS finance".
 * O "finance" é mais leve. Usada sobre bloco azul.
 */
export function Logo({
  className,
  compacta = false,
}: {
  className?: string;
  compacta?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-botao bg-azul-elas px-3 py-1.5 font-titulo text-white",
        className,
      )}
    >
      <LogoMark corRosa="#EB839E" className="h-4 w-4" />
      <span className="text-sm font-extrabold tracking-tight">
        Por ELAS{!compacta && <span className="font-semibold"> finance</span>}
      </span>
    </span>
  );
}
