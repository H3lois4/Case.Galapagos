import { Card } from "@/components/ui/Card";
import { ApiStatusBadge } from "@/components/diagnostico/ApiStatusBadge";

export const metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-gradient-to-br from-rosa-elas to-azul-elas text-xl font-bold text-white">
          H
        </span>
        <div>
          <h1 className="font-titulo text-[22px] font-bold text-tinta">
            Seu perfil
          </h1>
          <p className="text-[14px] text-tinta-suave">
            Login, dados e configurações chegam na etapa 01-auth-perfis.
          </p>
        </div>
      </div>

      <Card>
        <h2 className="font-titulo text-[18px] font-semibold text-tinta">
          Diagnóstico
        </h2>
        <p className="mt-1 text-[14px] text-tinta-suave">
          Comunicação entre o app e o backend.
        </p>
        <div className="mt-4">
          <ApiStatusBadge />
        </div>
      </Card>
    </div>
  );
}
