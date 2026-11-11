import Image from "next/image";

import logoClaro from "@/public/brand/logo-claro.png";
import logoEscuro from "@/public/brand/logo-escuro.png";

/**
 * Logo oficial (fundo transparente). Igual ao app: renderiza as duas versões e
 * o CSS mostra só a do tema ativo (claro/escuro do aparelho).
 */
export function Logo({ className = "h-9 w-auto", prioridade = false }: { className?: string; prioridade?: boolean }) {
  return (
    <>
      <Image
        src={logoClaro}
        alt="Por Elas finance"
        priority={prioridade}
        className={`logo-tema-claro ${className}`}
      />
      <Image
        src={logoEscuro}
        alt="Por Elas finance"
        priority={prioridade}
        className={`logo-tema-escuro ${className}`}
      />
    </>
  );
}
