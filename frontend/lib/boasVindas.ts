/**
 * Controle da tela de boas-vindas (splash do primeiro acesso).
 *
 * A marca fica no `user_metadata` da usuária no Supabase Auth — vale para a
 * conta (qualquer aparelho) e não precisa de migration no banco do Django.
 * Também gravamos uma cópia local (por usuária) no instante em que a tela é
 * vista, para não depender do tempo de atualização da sessão (evita voltar
 * para a splash logo depois de clicar em "Ir para a home").
 */
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const CHAVE = "boas_vindas_vistas_em";

function chaveLocal(userId: string): string {
  return `porelas:${CHAVE}:${userId}`;
}

/** A usuária já viu a tela de boas-vindas? */
export function jaViuBoasVindas(session: Session | null): boolean {
  const user = session?.user;
  if (!user) return false;
  if (user.user_metadata?.[CHAVE]) return true;
  try {
    return Boolean(localStorage.getItem(chaveLocal(user.id)));
  } catch {
    return false;
  }
}

/** Marca a tela como vista. Resolve mesmo se falhar (não trava a navegação). */
export async function marcarBoasVindasVistas(session: Session | null): Promise<void> {
  const agora = new Date().toISOString();
  if (session?.user) {
    try {
      localStorage.setItem(chaveLocal(session.user.id), agora);
    } catch {
      /* modo privado sem storage: segue só com o Supabase */
    }
  }
  try {
    await supabase.auth.updateUser({ data: { [CHAVE]: agora } });
  } catch {
    /* sem rede: a cópia local já evita mostrar de novo neste aparelho */
  }
}
