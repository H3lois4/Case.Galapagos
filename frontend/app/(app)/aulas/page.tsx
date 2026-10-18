import { GraduationCap } from "lucide-react";
import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export const metadata = { title: "Aulas" };

export default function AulasPage() {
  return (
    <PlaceholderScreen
      Icone={GraduationCap}
      titulo="Aulas"
      descricao="Aqui vão as aulas em vídeo das empresas e o 'Básico com IA' sobre fundamentos do mercado financeiro. Construída na etapa 02-aulas."
    />
  );
}
