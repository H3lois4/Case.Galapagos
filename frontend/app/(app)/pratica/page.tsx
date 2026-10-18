import { Mic } from "lucide-react";
import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export const metadata = { title: "Prática" };

export default function PraticaPage() {
  return (
    <PlaceholderScreen
      Icone={Mic}
      titulo="Prática"
      descricao="O simulador de entrevista com IA e os simulados escritos por tema, com relatório e histórico. Construída na etapa 06-pratica."
    />
  );
}
