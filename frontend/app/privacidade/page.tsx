import { PaginaLegal } from "@/components/legal/PaginaLegal";

export const metadata = { title: "Política de Privacidade" };

const CONTATO = "helomatheus05@gmail.com";

export default function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm="22 de outubro de 2026">
      <p>
        O Por ELAS finance é uma plataforma de capacitação de mulheres para o
        mercado financeiro, desenvolvida em parceria com a Galapagos Capital.
        Esta política explica quais dados coletamos, para que usamos e quais
        são os seus direitos, de acordo com a Lei Geral de Proteção de Dados
        (LGPD — Lei nº 13.709/2018).
      </p>

      <section>
        <h2>1. Dados que coletamos</h2>
        <ul>
          <li>
            <strong>Conta:</strong> e-mail e senha (a senha é guardada pelo nosso
            provedor de autenticação, o Supabase, e nunca fica visível para nós).
            Se você entrar com o Google, recebemos nome, e-mail e foto do perfil
            Google.
          </li>
          <li>
            <strong>Perfil:</strong> nome de usuário, nome de exibição, foto,
            descrição e LinkedIn que você decidir informar.
          </li>
          <li>
            <strong>Conteúdo:</strong> posts, comentários, curtidas e imagens que
            você publica na Rede, e seu progresso em aulas, práticas e plano de
            carreira.
          </li>
          <li>
            <strong>Conversas com a IA:</strong> as mensagens que você troca com
            a assistente e a IA mentora.
          </li>
          <li>
            <strong>Mentorias:</strong> os horários que você agenda e o e-mail
            usado no convite.
          </li>
          <li>
            <strong>Empresas:</strong> para contas de empresa, nome, site, CNPJ
            (opcional) e e-mail corporativo usado na verificação.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Para que usamos</h2>
        <ul>
          <li>Criar e manter sua conta e o seu perfil público.</li>
          <li>Mostrar seus posts e interações na Rede.</li>
          <li>Gerar respostas da IA e o seu plano de carreira.</li>
          <li>Agendar mentorias e enviar o convite com o link da reunião.</li>
          <li>Verificar que uma conta de empresa realmente representa a empresa.</li>
          <li>Manter a plataforma segura e evitar abuso (por exemplo, limite de mensagens).</li>
        </ul>
        <p className="mt-2">Não vendemos seus dados e não os usamos para publicidade.</p>
      </section>

      <section>
        <h2>3. Com quem compartilhamos</h2>
        <p>Usamos serviços de terceiros para fazer o app funcionar:</p>
        <ul>
          <li><strong>Supabase:</strong> autenticação e banco de dados.</li>
          <li><strong>Vercel:</strong> hospedagem do app.</li>
          <li><strong>Cloudflare R2:</strong> armazenamento de imagens e vídeos.</li>
          <li>
            <strong>Google Gemini:</strong> processamento das mensagens enviadas à
            IA para gerar as respostas.
          </li>
          <li>
            <strong>Google Agenda:</strong> criação do evento de mentoria, com o
            seu e-mail e o da mentora como convidadas.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Uso de dados do Google</h2>
        <p>
          Quando você entra com o Google, usamos apenas nome, e-mail e foto para
          criar sua conta. A integração com o Google Agenda é feita pela conta
          da própria plataforma, apenas para criar e cancelar eventos de
          mentoria — não acessamos a sua agenda pessoal. O uso de informações
          recebidas das APIs do Google segue a{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="text-azul-elas underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de Uso Limitado.
        </p>
      </section>

      <section>
        <h2>5. O que é público</h2>
        <p>
          Seu nome de usuário, nome de exibição, foto, descrição e os posts da
          Rede são públicos e podem ser vistos por quem tiver o link. Suas
          conversas com a IA, seus agendamentos e seu e-mail não são públicos.
        </p>
      </section>

      <section>
        <h2>6. Seus direitos</h2>
        <p>Pela LGPD, você pode a qualquer momento:</p>
        <ul>
          <li>Acessar e corrigir seus dados (pela tela de Perfil).</li>
          <li>Excluir sua conta e seus dados (Perfil → Excluir conta).</li>
          <li>Pedir informações sobre o tratamento dos seus dados.</li>
          <li>Revogar o consentimento.</li>
        </ul>
      </section>

      <section>
        <h2>7. Retenção e segurança</h2>
        <p>
          Guardamos os dados enquanto sua conta existir. Ao excluir a conta,
          removemos seu perfil e o conteúdo ligado a ele. As conexões usam HTTPS
          e o acesso aos dados é restrito.
        </p>
      </section>

      <section>
        <h2>8. Contato</h2>
        <p>
          Dúvidas ou pedidos sobre seus dados:{" "}
          <a href={`mailto:${CONTATO}`} className="text-azul-elas underline">
            {CONTATO}
          </a>
          .
        </p>
      </section>
    </PaginaLegal>
  );
}
