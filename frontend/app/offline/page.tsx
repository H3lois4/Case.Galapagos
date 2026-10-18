import { WifiOff } from "lucide-react";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
        <WifiOff className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h1 className="font-titulo text-[24px] font-bold text-tinta">
        Você está sem conexão
      </h1>
      <p className="mt-3 max-w-sm text-[15px] text-tinta-suave">
        Verifique sua internet e tente de novo. Assim que você voltar a ficar
        online, o Por ELAS carrega normalmente.
      </p>
    </div>
  );
}
