import { MessageCircleHeart } from "lucide-react";
import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export const metadata = { title: "Mentoria" };

export default function MentoriaPage() {
  return (
    <PlaceholderScreen
      Icone={MessageCircleHeart}
      titulo="Mentoria"
      descricao="A IA mentora e a agenda de mentorias com as empresas, com convite no Google Agenda. Construída na etapa 05-mentoria."
    />
  );
}
