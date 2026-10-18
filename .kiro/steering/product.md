# Produto — Por ELAS finance

## Visão geral

**Por ELAS finance** é um webapp criado para o hackathon da Galapagos Capital, respondendo ao case "Iniciativas para incluir mulheres no mercado financeiro com o uso de IA".

- **Foco:** educação e capacitação de mulheres que querem entrar, voltar ou migrar para o mercado financeiro, conectando-as a empresas do setor.
- **Prazo final:** 14/11/2026 (meta interna: tudo funcionando até 07/11/2026 para testes).
- **Entrega:** webapp com deploy público (frontend na Vercel), instalável no celular como **PWA**. A banca "baixa" o app pelo navegador no celular.
- **Nível de acabamento:** todas as funcionalidades precisam funcionar de forma básica, ponta a ponta. **Prefira simples e funcionando a completo e quebrado.**
- **Idioma da interface:** português do Brasil.
- **Custo:** tudo em planos gratuitos.

## Tipos de usuário

| Tipo | Quem é | Pode fazer |
| --- | --- | --- |
| `pessoal` | Mulheres que querem se capacitar | Ver aulas, usar as IAs, agendar mentoria (1 por mês), fazer simulados, postar/curtir/comentar/seguir na Rede, editar perfil |
| `empresa` | Representante verificado de uma empresa do mercado financeiro | Tudo do pessoal (exceto agendar mentoria) **+** publicar aulas em vídeo, publicar notícias e vagas, cadastrar horários de mentoria |
| `admin` | Equipe do app | Aprovar empresas, moderar/remover posts e comentários (via Django Admin) |

## Regras de autenticação

- A autenticação é feita pelo **Supabase Auth**: ele cuida de Google, e-mail + senha, confirmação de e-mail e "esqueci minha senha". O Django **não guarda senhas**; ele só valida o token do Supabase e mantém o perfil da usuária.
- Uma **única tela de login** para todos. Login com **Google** ou **e-mail + senha**.
- **Nome de usuário (`username`) obrigatório e único** — é o nome que aparece nos posts. Quem entra pelo Google pela primeira vez cai numa tela "Escolha seu nome de usuário" antes de acessar o app.
- No cadastro, a pessoa escolhe: "Quero me capacitar" (`pessoal`) ou "Represento uma empresa" (`empresa`).
- Checkbox obrigatório de aceite de termos e privacidade (LGPD) no cadastro.

### Fluxo de verificação de empresa

1. Informa nome da empresa, CNPJ (opcional no MVP), site e **e-mail corporativo**.
2. Bloquear domínios de e-mail gratuitos (gmail.com, hotmail.com, outlook.com, yahoo.com, icloud.com, bol.com.br, uol.com.br etc.).
3. O app envia um **código de 6 dígitos** para o e-mail corporativo (expira em 15 min, máx. 5 tentativas).
4. Código confirmado → empresa fica com status `pendente`.
5. Admin aprova no Django Admin → status `aprovada` e as funções de empresa são liberadas. Enquanto `pendente`, a conta funciona como pessoal e mostra o aviso "Sua empresa está em análise".
6. Lista opcional de domínios pré-aprovados (ex.: `galapagoscapital.com`) que aprovam automaticamente após o código.

### Modelo de contas

- `Company` (nome, slug, logo, descrição, site, domínio, status) e `User` com `account_type` e FK opcional para `Company`.
- Várias pessoas da mesma empresa podem estar ligadas à mesma `Company`; o conteúdo é publicado **em nome da empresa**.

## Funcionalidades por tela

Navegação principal: **barra inferior fixa no celular** com Aulas, Carreira, Mentoria, Prática e Rede; avatar no topo leva ao Perfil. No desktop, menu lateral.

### Login / Cadastro
- Login com Google e com e-mail/senha; "esqueci minha senha" por e-mail (tudo pelo Supabase Auth, com as telas no visual do app).
- Cadastro com escolha do tipo de conta, `username` obrigatório e aceite de termos.
- Fluxo de verificação de empresa.
- Splash/onboarding curto com a logo e uma frase de boas-vindas.

### Aulas
- **Topo:** chips horizontais com todas as empresas (com logo) + chip "IA Por ELAS" + busca por título.
- **Seção "Básico com IA":** vídeos produzidos com IA sobre fundamentos, publicados pelo admin em nome da conta "Por ELAS".
- **Seção por empresa:** um container (card/carrossel) por empresa com seus vídeos. Visível para todos.
- **Empresa aprovada:** botão "Adicionar conteúdo" → título, descrição, thumbnail (opcional; gerar a partir do vídeo se não houver) e upload do vídeo.
- **Regras de upload:** apenas MP4 (H.264) ou WebM; **duração máx. 10 min; tamanho máx. 200 MB**; resolução recomendada 720p. Validar duração no frontend (via elemento `<video>`) e tamanho/tipo no backend (na geração da URL pré-assinada). Barra de progresso. A empresa edita e exclui os próprios vídeos.
- Player com controles nativos, título, descrição, nome da empresa e data.

### Carreira
- **IA de planejamento de carreira** (voz e texto): define próximos passos — temas, certificações, cargos de entrada. Pode gerar um "Plano de carreira" salvo no perfil (lista de passos com prazos).
- **Áreas do mercado financeiro:** grade de containers. Mínimo: Investment Banking (DCM, ECM, M&A), Asset Management, Wealth Management/Private, Tecnologia, Trading/Sales & Trading, Quant, Research/Análise, Risco & Compliance, Crédito, Relações com Investidores.
- Tocar numa área → **modal** com: descrição, formação comum, cursos e certificações (CPA-20, CEA, CFP, CGA, CFA, FRM), hard skills, soft skills, cargos de entrada e **lista de mulheres que atuam na área com link para o LinkedIn**.
- Botão **"Baixar PDF"** no modal, com a identidade visual.
- Conteúdo das áreas vem de arquivo de seed editável (JSON/YAML). Links de LinkedIn como placeholders.

### Mentoria
- **IA mentora** (voz e texto): conselhos profissionais, apoio para insegurança e síndrome da impostora.
- **Agenda com empresas:**
  - Empresa aprovada cadastra horários: data, hora, duração, tema, nome da mentora, cargo e **e-mail corporativo da mentora** (obrigatório).
  - Usuárias veem a lista/calendário e tocam em "Agendar".
  - **Ordem de chegada:** a primeira que agendar leva. Transação com `select_for_update` e restrição única no slot.
  - **Limite: 1 mentoria por usuária por mês** (mês da data da mentoria). Mensagem clara ao atingir o limite.
  - Ao confirmar: evento no **Google Agenda** da plataforma com usuária e mentora como convidadas, link do Meet e `sendUpdates=all`. Enviar também e-mail de confirmação próprio do app.
  - Cancelamento até 24 h antes → libera o horário e cancela o evento. "Minhas mentorias" no perfil.

### Prática
- **Simulador de entrevista com IA** (voz e texto): antes de começar, a usuária preenche vaga/empresa, papel do entrevistador, tipo de entrevista, nível e (opcional) descrição da vaga. A IA conduz 6–10 perguntas, uma por vez. "Encerrar entrevista" → **relatório de feedback** estruturado, salvo no histórico e exportável em PDF. Entrevistas em inglês usam voz `en-US`.
- **Simulados escritos:** múltipla escolha por tema (Mercado financeiro, Certificações/CPA, Matemática financeira, Excel, Programação/Python, Inglês). 10 questões, cronômetro opcional, nota e explicação por resposta. Banco de questões em seed. Histórico de notas no perfil.

### Rede
- **Topo:** carrossel horizontal de notícias (imagem + manchete, troca a cada **6 s**, pausa ao tocar, indicadores e swipe). Tocar abre a notícia completa.
- **Notícias:** dois tipos de autor com selo visual — **IA Por ELAS** (posts diários automáticos) e **Empresa** (empresas aprovadas, tipo `noticia`).
- **Feed de posts** de empresas e usuárias. Tipos: `post` (comum), `vaga` (empresas; cargo, local/modelo, link de candidatura) e `noticia` (empresas e IA, aparece no carrossel).
- Post: texto (até 2.000 caracteres) e imagem opcional (comprimir no navegador; máx. 5 MB; upload direto para o R2).
- Interações: **curtir, comentar, compartilhar para fora** (Web Share API com fallback "copiar link"; página pública `/post/[id]` com Open Graph) e **seguir** usuárias e empresas.
- Filtro do feed: "Todos" / "Quem eu sigo" / "Vagas".
- Autor exclui o próprio post e comentário. Botão "denunciar" para o admin.

### Perfil
- **Dados privados** (só a própria usuária vê): e-mail, tipo de conta, status da empresa, plano de carreira, minhas mentorias, histórico de entrevistas e simulados, configurações, sair, excluir conta.
- **Perfil público** `/u/[username]`: foto, nome, `username`, descrição, link do LinkedIn, contadores de seguidores/seguindo, botão seguir e posts da pessoa.
- Empresa tem perfil público com logo, descrição, site, aulas e posts.

## Critérios de pronto

- Pela plateia, no celular: abrir o link, instalar o app, criar conta (Google ou e-mail), escolher `username`, assistir uma aula, conversar por voz e texto com as três IAs, agendar uma mentoria e receber o convite no e-mail, fazer um simulado e postar/curtir/comentar na Rede.
- Conta empresa aprovada consegue publicar vídeo, notícia e vaga, e cadastrar horário de mentoria.
- Suporta ~50 cadastros e uso simultâneo durante a apresentação sem erro.
- Nenhum segredo no repositório. README atualizado. Tudo commitado e com push na `main`.

## Tom de voz

Próximo, encorajador e sem jargão, como uma amiga que entende do mercado. Nada de culpa ou alarme.
