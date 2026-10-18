import { Compass } from "lucide-react";
import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export const metadata = { title: "Carreira" };

export default function CarreiraPage() {
  return (
    <PlaceholderScreen
      Icone={Compass}
      titulo="Carreira"
      descricao="A IA de planejamento de carreira e as áreas do mercado financeiro, com certificações e mulheres de referência. Construída na etapa 04-carreira."
    />
  );
}
