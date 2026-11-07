import Image from "next/image";
import { cn } from "@/lib/cn";

import logoClaro from "@/public/brand/logo-claro.png";
import logoEscuro from "@/public/brand/logo-escuro.png";

/**
 * Símbolo da marca: dois anéis entrelaçados (um vinho, um rosa).
 * Mantido como SVG para usos em que só o símbolo é necessário (ex.: fallback).
 */
export function LogoMark({
  className,
  corAnel1 = "#990521",
  corAnel2 = "#EB839E",
}: {
  className?: string;
  corAnel1?: string;
  corAnel2?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 44"
      fill="none"
      className={cn("h-6 w-auto", className)}
      aria-hidden="true"
    >
      <circle cx="40" cy="22" r="14" stroke={corAnel2} strokeWidth="6" />
      <circle cx="24" cy="22" r="14" stroke={corAnel1} strokeWidth="6" />
      <path
        d="M40 36a14 14 0 0 0 11.9 -6.6"
        stroke={corAnel2}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Logo oficial "Por Elas Finance" (imagem com fundo transparente). Usada no
 * cabeçalho, no menu lateral e nas telas de login/cadastro.
 *
 * Há uma versão para cada tema: `logo-claro` (vinho/rosa, para fundo claro) e
 * `logo-escuro` (tons claros, para fundo escuro). As duas são renderizadas e o
 * CSS (`.logo-tema-claro` / `.logo-tema-escuro` em globals.css) mostra só a
 * do tema ativo — seguindo a preferência do celular, igual às cores do app.
 * `compacta` reduz um pouco a altura.
 */
export function Logo({
  className,
  compacta = false,
}: {
  className?: string;
  compacta?: boolean;
}) {
  const classes = cn(
    "w-auto object-contain",
    compacta ? "h-7" : "h-9",
    className,
  );
  return (
    <>
      <Image
        src={logoClaro}
        alt="Por Elas finance"
        priority
        className={cn("logo-tema-claro", classes)}
      />
      <Image
        src={logoEscuro}
        alt="Por Elas finance"
        priority
        className={cn("logo-tema-escuro", classes)}
      />
    </>
  );
}
