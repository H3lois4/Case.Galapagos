import Link from "next/link";
import { PaginaLegal } from "@/components/legal/PaginaLegal";

export const metadata = { title: "Termos de Uso" };

const CONTATO = "helomatheus05@gmail.com";

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="22 de outubro de 2026">
      <p>
        Ao criar uma conta no Por ELAS finance, você concorda com estes termos.
        Leia também a nossa{" "}
        <Link href="/privacidade" className="text-azul-elas underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <section>
        <h2>1. O que é o Por ELAS</h2>
        <p>
          Uma plataforma gratuita de capacitação de mulheres para o mercado
          financeiro, com aulas, prática, orientação de carreira, mentorias, uma
          rede social e uma assistente com inteligência artificial.
        </p>
      </section>

      <section>
        <h2>2. Sua conta</h2>
        <ul>
          <li>Você é responsável pelas informações que informa e por manter sua senha segura.</li>
          <li>O nome de usuário é público e deve ser único.</li>
          <li>
            Contas de empresa só podem ser criadas por quem representa a empresa,
            com verificação por e-mail corporativo.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Conteúdo que você publica</h2>
        <ul>
          <li>Você continua dona do conteúdo que publica e é responsável por ele.</li>
          <li>
            Não é permitido publicar conteúdo ofensivo, discriminatório, ilegal,
            spam, ou que viole direitos de terceiros.
          </li>
          <li>
            A equipe do Por ELAS pode remover conteúdos que violem estes termos e
            suspender contas em caso de abuso.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Inteligência artificial</h2>
        <p>
          As respostas da IA são geradas automaticamente e podem conter erros.
          Elas têm caráter educativo e não são recomendação de investimento,
          aconselhamento financeiro, jurídico ou profissional.
        </p>
      </section>

      <section>
        <h2>5. Mentorias</h2>
        <p>
          As mentorias são oferecidas por profissionais de empresas parceiras.
          Pedimos que você compareça no horário agendado ou cancele com
          antecedência pelo app.
        </p>
      </section>

      <section>
        <h2>6. Disponibilidade</h2>
        <p>
          Trabalhamos para manter a plataforma no ar, mas ela pode ficar
          indisponível em alguns momentos e as funcionalidades podem mudar.
        </p>
      </section>

      <section>
        <h2>7. Encerramento</h2>
        <p>
          Você pode excluir sua conta a qualquer momento pela tela de Perfil.
        </p>
      </section>

      <section>
        <h2>8. Contato</h2>
        <p>
          <a href={`mailto:${CONTATO}`} className="text-azul-elas underline">
            {CONTATO}
          </a>
        </p>
      </section>
    </PaginaLegal>
  );
}
