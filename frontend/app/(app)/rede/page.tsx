import { Users } from "lucide-react";
import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export const metadata = { title: "Rede" };

export default function RedePage() {
  return (
    <PlaceholderScreen
      Icone={Users}
      titulo="Rede"
      descricao="O carrossel de notícias e o feed de posts, vagas e notícias, com curtidas, comentários e seguir. Construída na etapa 07-rede."
    />
  );
}
