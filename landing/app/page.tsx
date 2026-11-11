import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  Check,
  HeartHandshake,
  Compass,
  GraduationCap,
  House,
  Lightbulb,
  MessageCircleHeart,
  Mic,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { MockJornada } from "@/components/MockJornada";
import { QrCodeApp } from "@/components/QrCodeApp";
import { APP_URL, APP_URL_EXIBICAO } from "@/lib/config";

/* --------------------------------------------------------------------------
   Conteúdo
   -------------------------------------------------------------------------- */

const BARREIRAS: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    Icone: Users,
    titulo: "Poucas referências",
    texto:
      "É difícil se imaginar numa carreira quando quase não se vê mulheres nela, principalmente nos cargos de liderança.",
  },
  {
    Icone: BookOpen,
    titulo: "Conhecimento que parece fechado",
    texto:
      "Siglas, certificações, áreas e caminhos de carreira confundem quem está começando. Por onde começar?",
  },
  {
    Icone: Target,
    titulo: "Pouco acesso a rede e mentoria",
    texto:
      "Muitas oportunidades circulam por indicação. Sem contatos no setor, as portas ficam mais fechadas.",
  },
  {
    Icone: Mic,
    titulo: "Insegurança nos processos seletivos",
    texto:
      "Provas de certificação e entrevistas técnicas assustam quando não existe um lugar seguro para treinar.",
  },
];

const PILARES: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    Icone: GraduationCap,
    titulo: "Aprender",
    texto: "Aulas em vídeo e um guia claro das áreas, certificações e cargos do mercado.",
  },
  {
    Icone: Lightbulb,
    titulo: "Praticar",
    texto: "Simulados e entrevistas com IA, com feedback detalhado para evoluir a cada tentativa.",
  },
  {
    Icone: MessageCircleHeart,
    titulo: "Conectar",
    texto: "Mentorias com profissionais do setor e uma rede de mulheres que se apoiam.",
  },
];

const PASSOS: { titulo: string; texto: string }[] = [
  {
    titulo: "Crie sua conta",
    texto:
      "Entre com e-mail ou Google, escolha seu nome de usuária e diga se quer se capacitar ou se representa uma empresa.",
  },
  {
    titulo: "Aprenda no seu ritmo",
    texto: "Assista às aulas das empresas e ao Básico com IA, com os fundamentos do mercado financeiro.",
  },
  {
    titulo: "Descubra o seu caminho",
    texto: "Explore as áreas do mercado e monte, com a IA de carreira, um plano com passos e prazos.",
  },
  {
    titulo: "Treine para a vaga",
    texto: "Faça simulados por tema e entrevistas simuladas com IA, por voz ou por texto.",
  },
  {
    titulo: "Conecte-se",
    texto: "Agende mentorias com profissionais e participe da Rede: posts, vagas e notícias.",
  },
];

interface Pagina {
  Icone: LucideIcon;
  nome: string;
  resumo: string;
  itens: string[];
}

const PAGINAS: Pagina[] = [
  {
    Icone: House,
    nome: "Início",
    resumo: "O seu painel: tudo o que você já construiu, num só lugar.",
    itens: [
      "Minha Jornada: plano de carreira, mentorias agendadas, simulados e entrevistas",
      "Abra o relatório de qualquer simulado ou entrevista já feita",
      "Novidades em Rede: carrossel com as últimas publicações com imagem",
    ],
  },
  {
    Icone: GraduationCap,
    nome: "Aulas",
    resumo: "Vídeos sobre o mercado financeiro, para assistir quando quiser.",
    itens: [
      "Aulas publicadas pelas empresas do setor e pela Por ELAS",
      "Seção Básico com IA, com os fundamentos para quem está começando",
      "Busca por título e filtro por empresa",
    ],
  },
  {
    Icone: Compass,
    nome: "Carreira",
    resumo: "Entenda o mercado e trace o seu caminho até a primeira vaga.",
    itens: [
      "Guia de 10 áreas: Investment Banking, Asset, Wealth, Tecnologia, Trading, Quant, Research, Risco & Compliance, Crédito e RI",
      "Em cada área: formação, certificações, hard e soft skills, cargos de entrada e mulheres que atuam nela, com LinkedIn",
      "Baixe o guia de cada área em PDF",
      "IA de carreira, por texto ou voz, que monta um plano com passos e prazos para você marcar como concluídos",
    ],
  },
  {
    Icone: MessageCircleHeart,
    nome: "Mentoria",
    resumo: "Conselho de quem já está no mercado, e apoio a qualquer hora.",
    itens: [
      "IA mentora para tirar dúvidas e pedir conselhos, por texto ou voz",
      "Agende uma mentoria por mês com profissionais das empresas parceiras",
      "Convite no Google Agenda com link do Meet",
      "Cancele pelo próprio app quando precisar",
    ],
  },
  {
    Icone: Mic,
    nome: "Prática",
    resumo: "Treine sem pressão antes da prova e da entrevista de verdade.",
    itens: [
      "Simulados em 6 temas: Mercado financeiro, Certificações / CPA, Matemática financeira, Excel, Programação / Python e Inglês",
      "Cronômetro opcional, nota e explicação de cada resposta; compartilhe o resultado",
      "Entrevista simulada com IA: você escolhe a vaga, o tipo, o nível e o idioma (português ou inglês)",
      "Relatório de feedback com nota, pontos fortes, o que melhorar e próximos passos, em PDF",
    ],
  },
  {
    Icone: Users,
    nome: "Rede",
    resumo: "Uma comunidade para trocar, aprender e encontrar oportunidades.",
    itens: [
      "Publique textos e imagens, e veja vagas das empresas",
      "Notícias do mercado explicadas de forma simples pela IA Por ELAS",
      "Curta, comente, compartilhe e siga pessoas e empresas",
    ],
  },
  {
    Icone: UserRound,
    nome: "Perfil",
    resumo: "A sua vitrine na comunidade.",
    itens: [
      "Foto, nome, descrição curta e LinkedIn",
      "Perfil público para outras usuárias conhecerem você",
      "Controle dos seus dados, com opção de excluir a conta",
    ],
  },
];

const BENEFICIOS_EMPRESA: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    Icone: Briefcase,
    titulo: "Vagas e notícias na Rede",
    texto:
      "Divulgue vagas e publique conteúdos em nome da empresa para uma comunidade de mulheres que está se preparando para o mercado financeiro.",
  },
  {
    Icone: GraduationCap,
    titulo: "Sua marca ensinando",
    texto:
      "Publique aulas em vídeo, por upload ou link do YouTube, com o nome da empresa em destaque na seção Aulas.",
  },
  {
    Icone: CalendarCheck,
    titulo: "Mentorias sem burocracia",
    texto:
      "Cadastre horários com profissionais do seu time. O agendamento, o convite no Google Agenda e o link do Meet são automáticos.",
  },
  {
    Icone: Users,
    titulo: "Conheça novos talentos",
    texto:
      "Acompanhe na Rede quem está estudando e treinando, com perfis públicos, descrição e LinkedIn de cada usuária.",
  },
  {
    Icone: BadgeCheck,
    titulo: "Conta verificada",
    texto:
      "O acesso de empresa é confirmado pelo e-mail corporativo, o que dá segurança para as usuárias e para a sua equipe.",
  },
  {
    Icone: HeartHandshake,
    titulo: "Diversidade na prática",
    texto:
      "Contribua de forma concreta para ter mais mulheres no mercado financeiro, com ações que vocês acompanham de perto.",
  },
];

const PASSOS_EMPRESA: { titulo: string; texto: string }[] = [
  {
    titulo: "Crie a conta",
    texto: "No cadastro, escolha a opção “Represento uma empresa”.",
  },
  {
    titulo: "Verifique a empresa",
    texto:
      "Informe nome, site e e-mail corporativo (o CNPJ é opcional) e confirme com o código de 6 dígitos que enviamos.",
  },
  {
    titulo: "Comece a participar",
    texto: "Com a empresa aprovada, publique aulas, vagas e notícias e cadastre horários de mentoria.",
  },
];

const EXTRAS: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  { Icone: Smartphone, titulo: "Instale no celular", texto: "Funciona como app, direto da tela de início." },
  { Icone: Mic, titulo: "Use por voz", texto: "Fale com as IAs e ouça as respostas." },
  { Icone: Moon, titulo: "Modo claro e escuro", texto: "Segue o tema do seu aparelho." },
  { Icone: ShieldCheck, titulo: "Seus dados protegidos", texto: "Tratados conforme a LGPD." },
];

/* --------------------------------------------------------------------------
   Peças de layout
   -------------------------------------------------------------------------- */

function BotaoApp({ texto = "Acessar o app", variante = "primario" }: { texto?: string; variante?: "primario" | "claro" }) {
  return (
    <a
      href={APP_URL}
      className={
        variante === "primario"
          ? "inline-flex h-12 items-center justify-center gap-2 rounded-botao bg-azul-elas px-6 font-titulo text-[15px] font-semibold text-sobre-vinho transition-colors hover:bg-azul-elas-escuro"
          : "inline-flex h-12 items-center justify-center gap-2 rounded-botao bg-sobre-vinho px-6 font-titulo text-[15px] font-semibold text-azul-elas transition-opacity hover:opacity-90"
      }
    >
      {texto} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-titulo text-[13px] font-semibold uppercase tracking-[0.14em] text-rosa-elas-texto">
      {children}
    </p>
  );
}

function TituloSecao({ rotulo, titulo, texto }: { rotulo: string; titulo: string; texto?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Rotulo>{rotulo}</Rotulo>
      <h2 className="mt-2 font-titulo text-[28px] font-bold leading-tight text-tinta sm:text-[34px]">{titulo}</h2>
      {texto && <p className="mt-4 text-[16px] leading-relaxed text-tinta-suave">{texto}</p>}
    </div>
  );
}

function IconeChip({ Icone }: { Icone: LucideIcon }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-azul-elas-suave text-azul-elas">
      <Icone className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

/* --------------------------------------------------------------------------
   Página
   -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-botao focus:bg-fundo focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>

      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-borda bg-topo/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="#topo" aria-label="Por Elas finance — início da página">
            <Logo className="h-9 w-auto" prioridade />
          </a>
          <nav aria-label="Seções" className="hidden items-center gap-6 text-[14px] font-semibold text-tinta-suave md:flex">
            <a href="#desafio" className="hover:text-azul-elas">O desafio</a>
            <a href="#como-funciona" className="hover:text-azul-elas">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-azul-elas">Funcionalidades</a>
            <a href="#empresas" className="hover:text-azul-elas">Para empresas</a>
          </nav>
          <a
            href={APP_URL}
            className="inline-flex h-10 items-center rounded-botao bg-azul-elas px-4 font-titulo text-[14px] font-semibold text-sobre-vinho hover:bg-azul-elas-escuro"
          >
            Acessar o app
          </a>
        </div>
      </header>

      <main id="conteudo">
        {/* Hero */}
        <section id="topo" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-rosa-elas/20 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-azul-elas-suave px-3 py-1 text-[13px] font-semibold text-azul-elas">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Gratuito e feito para mulheres
              </span>
              <h1 className="mt-5 font-titulo text-[38px] font-extrabold leading-[1.08] text-tinta sm:text-[52px]">
                O mercado financeiro também é <span className="text-azul-elas">lugar delas</span>.
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-tinta-suave">
                O Por ELAS finance ajuda mulheres a entrar, voltar ou migrar para o mercado financeiro com aulas,
                prática com inteligência artificial, plano de carreira, mentorias e uma rede de apoio. Tudo em um só app.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BotaoApp />
                <a
                  href="#como-funciona"
                  className="inline-flex h-12 items-center justify-center rounded-botao border border-azul-elas/40 px-6 font-titulo text-[15px] font-semibold text-azul-elas transition-colors hover:bg-azul-elas-suave"
                >
                  Ver como funciona
                </a>
              </div>
            </div>
            <MockJornada />
          </div>
        </section>

        {/* Desafio */}
        <section id="desafio" className="bg-fundo-alt py-20">
          <div className="mx-auto max-w-6xl px-5">
            <TituloSecao
              rotulo="O desafio"
              titulo="Por que é tão difícil entrar?"
              texto="O mercado financeiro ainda é um ambiente majoritariamente masculino. Para muitas mulheres, a barreira não é capacidade: é acesso a conhecimento, a treino e a pessoas."
            />
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BARREIRAS.map(({ Icone, titulo, texto }) => (
                <li key={titulo} className="rounded-card border border-borda bg-fundo p-6 shadow-[var(--sombra-card)]">
                  <IconeChip Icone={Icone} />
                  <h3 className="mt-4 font-titulo text-[17px] font-semibold text-tinta">{titulo}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-tinta-suave">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Solução */}
        <section id="solucao" className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <TituloSecao
              rotulo="A solução"
              titulo="Um app que acompanha a sua jornada, do primeiro passo à primeira vaga"
              texto="O Por ELAS finance junta, num só lugar, o que costuma estar espalhado: conteúdo para aprender, ferramentas para treinar e pessoas para abrir caminhos. A inteligência artificial personaliza cada etapa para o seu objetivo."
            />
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {PILARES.map(({ Icone, titulo, texto }) => (
                <li key={titulo} className="rounded-card bg-azul-elas-suave/60 p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-azul-elas text-sobre-vinho">
                    <Icone className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-titulo text-[20px] font-bold text-tinta">{titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-tinta-suave">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="bg-fundo-alt py-20">
          <div className="mx-auto max-w-4xl px-5">
            <TituloSecao rotulo="Como funciona" titulo="Cinco passos para começar" />
            <ol className="mt-12 space-y-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="flex gap-4 rounded-card border border-borda bg-fundo p-5 shadow-[var(--sombra-card)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-azul-elas font-titulo text-[16px] font-bold text-sobre-vinho">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-titulo text-[17px] font-semibold text-tinta">{p.titulo}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-tinta-suave">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-[15px] text-tinta-suave">
              Tudo o que você faz fica salvo em <strong className="text-tinta">Minha Jornada</strong>, na tela de Início.
            </p>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <TituloSecao
              rotulo="Funcionalidades"
              titulo="Conheça cada página do app"
              texto="Sete áreas pensadas para cada momento da sua preparação."
            />
            <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PAGINAS.map(({ Icone, nome, resumo, itens }) => (
                <li key={nome} className="flex flex-col rounded-card border border-borda bg-fundo p-6 shadow-[var(--sombra-card)]">
                  <div className="flex items-center gap-3">
                    <IconeChip Icone={Icone} />
                    <h3 className="font-titulo text-[20px] font-bold text-tinta">{nome}</h3>
                  </div>
                  <p className="mt-3 text-[15px] font-semibold text-tinta">{resumo}</p>
                  <ul className="mt-3 space-y-2">
                    {itens.map((item) => (
                      <li key={item} className="flex gap-2 text-[14px] leading-relaxed text-tinta-suave">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-rosa-elas-texto" strokeWidth={2.5} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXTRAS.map(({ Icone, titulo, texto }) => (
                <li key={titulo} className="flex items-start gap-3 rounded-card bg-fundo-alt p-4">
                  <Icone className="mt-0.5 h-5 w-5 shrink-0 text-azul-elas" strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <p className="font-titulo text-[14px] font-semibold text-tinta">{titulo}</p>
                    <p className="text-[13px] text-tinta-suave">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Para empresas */}
        <section id="empresas" className="bg-fundo-alt py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-azul-elas text-sobre-vinho">
                <Building2 className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="mt-4">
                <Rotulo>Para empresas</Rotulo>
              </div>
              <h2 className="mt-2 font-titulo text-[28px] font-bold leading-tight text-tinta sm:text-[34px]">
                Abra portas e encontre novos talentos
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-tinta-suave">
                Empresas do mercado financeiro podem ensinar, orientar e contratar mulheres que estão se preparando
                para o setor, tudo dentro do mesmo app.
              </p>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFICIOS_EMPRESA.map(({ Icone, titulo, texto }) => (
                <li key={titulo} className="rounded-card border border-borda bg-fundo p-6 shadow-[var(--sombra-card)]">
                  <IconeChip Icone={Icone} />
                  <h3 className="mt-4 font-titulo text-[17px] font-semibold text-tinta">{titulo}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-tinta-suave">{texto}</p>
                </li>
              ))}
            </ul>

            <div className="mt-12 rounded-[28px] border border-borda bg-fundo p-6 shadow-[var(--sombra-card)] sm:p-10">
              <h3 className="text-center font-titulo text-[22px] font-bold text-tinta">
                Como a sua empresa participa
              </h3>
              <ol className="mt-8 grid gap-6 md:grid-cols-3">
                {PASSOS_EMPRESA.map((p, i) => (
                  <li key={p.titulo} className="text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-pill bg-azul-elas font-titulo text-[16px] font-bold text-sobre-vinho">
                      {i + 1}
                    </span>
                    <p className="mt-3 font-titulo text-[16px] font-semibold text-tinta">{p.titulo}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-tinta-suave">{p.texto}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex justify-center">
                <a
                  href={`${APP_URL}/cadastro`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-botao bg-azul-elas px-6 font-titulo text-[15px] font-semibold text-sobre-vinho transition-colors hover:bg-azul-elas-escuro"
                >
                  Cadastrar minha empresa <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Parceria */}
        <section aria-label="Parceria" className="border-y border-borda bg-topo py-10">
          <p className="mx-auto max-w-3xl px-5 text-center text-[16px] leading-relaxed text-tinta">
            Criado em parceria com a <strong>Galapagos Capital</strong>, para aproximar mulheres das oportunidades do
            mercado financeiro.
          </p>
        </section>

        {/* Convite */}
        <section id="acessar" className="py-20">
          <div className="mx-auto max-w-5xl px-5">
            <div className="grid items-center gap-10 overflow-hidden rounded-[28px] bg-azul-elas p-8 text-sobre-vinho sm:p-12 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-titulo text-[30px] font-bold leading-tight sm:text-[38px]">
                  Sua jornada no mercado financeiro começa agora.
                </h2>
                <p className="mt-4 max-w-lg text-[16px] leading-relaxed opacity-90">
                  É gratuito. Crie sua conta em menos de um minuto e dê o primeiro passo hoje.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <BotaoApp variante="claro" />
                  <a href={APP_URL} className="font-titulo text-[16px] font-semibold underline underline-offset-4">
                    {APP_URL_EXIBICAO}
                  </a>
                </div>
              </div>
              <figure className="mx-auto w-48 rounded-card bg-white p-3 text-center shadow-lg sm:w-56">
                <QrCodeApp url={APP_URL} />
                <figcaption className="mt-1 text-[13px] font-semibold text-[#990521]">
                  Aponte a câmera do celular
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-borda bg-fundo-alt">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-[13px] text-tinta-suave sm:flex-row">
          <Logo className="h-8 w-auto" />
          <nav aria-label="Links legais" className="flex gap-5">
            <a href={`${APP_URL}/privacidade`} className="hover:text-azul-elas">Política de Privacidade</a>
            <a href={`${APP_URL}/termos`} className="hover:text-azul-elas">Termos de Uso</a>
          </nav>
          <p>© 2026 Por ELAS finance</p>
        </div>
      </footer>
    </>
  );
}
