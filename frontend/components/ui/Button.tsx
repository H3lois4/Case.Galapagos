import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variante = "primary" | "secondary" | "destaque" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  bloco?: boolean;
}

const estilos: Record<Variante, string> = {
  // Primário: azul, texto branco
  primary:
    "bg-azul-elas text-white hover:bg-azul-elas-escuro active:bg-azul-elas-escuro",
  // Secundário: borda 1,5px azul
  secondary:
    "bg-transparent text-azul-elas border-[1.5px] border-azul-elas hover:bg-azul-elas-suave",
  // Destaque: rosa, texto tinta (no máximo um por tela)
  destaque: "bg-rosa-elas text-tinta hover:brightness-95 active:brightness-90",
  // Ghost: texto apenas
  ghost: "bg-transparent text-tinta-suave hover:bg-fundo-alt",
};

export function Button({
  variante = "primary",
  bloco = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-botao px-5 font-corpo text-[15px] font-semibold",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        estilos[variante],
        bloco && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
