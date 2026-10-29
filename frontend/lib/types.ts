export type AccountType = "pessoal" | "empresa";
export type EmpresaStatus = "pendente" | "aprovada" | "rejeitada" | null;

export interface EmpresaPublica {
  nome: string;
  slug: string;
  logo: string;
  descricao: string;
  site: string;
  status: EmpresaStatus;
}

export interface Me {
  email: string;
  username: string | null;
  account_type: AccountType;
  empresa: EmpresaPublica | null;
  empresa_status: EmpresaStatus;
  nome_exibicao: string;
  foto: string;
  descricao: string;
  linkedin: string;
  precisa_username: boolean;
  termos_aceitos_em: string | null;
  total_seguidores: number;
  total_seguindo: number;
  criado_em: string;
}

export interface PerfilPublico {
  username: string;
  nome_exibicao: string;
  foto: string;
  descricao: string;
  linkedin: string;
  account_type: AccountType;
  empresa: EmpresaPublica | null;
  total_seguidores: number;
  total_seguindo: number;
  seguindo: boolean;
}

// ---------------------------------------------------------------------------
// Aulas (etapa 02-aulas)
// ---------------------------------------------------------------------------

export type OrigemAula = "empresa" | "ia";

export interface Aula {
  id: number;
  titulo: string;
  descricao: string;
  origem: OrigemAula;
  empresa_nome: string | null;
  empresa_slug: string | null;
  empresa_logo: string;
  autor_nome: string;
  video_url: string;
  thumb_url: string;
  duracao_seg: number;
  tamanho_bytes: number;
  publicado_em: string;
  /** Presente só no detalhe: indica se a usuária atual pode editar/excluir. */
  pode_editar?: boolean;
}

export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EmpresaComAulas {
  nome: string;
  slug: string;
  logo: string;
  total_aulas: number;
}

export interface EmpresasComAulasResp {
  empresas: EmpresaComAulas[];
  tem_ia: boolean;
}

export interface UploadUrlResp {
  url: string;
  key: string;
  content_type: string;
  metodo: "PUT";
}

// ---------------------------------------------------------------------------
// IA (etapa 03-ia-base)
// ---------------------------------------------------------------------------

export type PapelMensagem = "user" | "assistant";

export interface MensagemIA {
  id: number;
  papel: PapelMensagem;
  conteudo: string;
  ordem: number;
  criado_em: string;
  util: boolean | null;
}

export interface ConversaIA {
  id: number;
  agente: string;
  titulo: string;
  resumo: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ConversaIADetalhe extends ConversaIA {
  mensagens: MensagemIA[];
}

export interface AgenteIA {
  chave: string;
  nome: string;
}

// ---------------------------------------------------------------------------
// Carreira (etapa 04-carreira)
// ---------------------------------------------------------------------------

export interface MulherReferencia {
  nome: string;
  cargo: string;
  linkedin: string;
}

export interface AreaResumo {
  slug: string;
  nome: string;
  resumo: string;
  ordem: number;
}

export interface AreaDetalhe {
  slug: string;
  nome: string;
  resumo: string;
  descricao: string;
  formacao: string;
  certificacoes: string[];
  hard_skills: string[];
  soft_skills: string[];
  cargos_entrada: string[];
  mulheres: MulherReferencia[];
}

export interface PassoPlano {
  id: number;
  titulo: string;
  descricao: string;
  prazo: string;
  concluido: boolean;
}

export interface PlanoCarreira {
  titulo: string;
  passos: PassoPlano[];
  total_passos: number;
  concluidos: number;
  criado_em: string;
  atualizado_em: string;
}

/** Rascunho vindo de /plano/gerar/ (ainda não salvo). */
export interface PlanoRascunho {
  titulo: string;
  passos: PassoPlano[];
}

// ---------------------------------------------------------------------------
// Mentoria (etapa 05-mentoria)
// ---------------------------------------------------------------------------

export interface MentoriaSlot {
  id: number;
  empresa_nome: string;
  empresa_slug: string;
  mentora_nome: string;
  mentora_cargo: string;
  tema: string;
  inicio: string;
  duracao_min: number;
  reservado: boolean;
}

export type StatusMentoria = "ativa" | "cancelada";

export interface Mentoria {
  id: number;
  slot: MentoriaSlot;
  status: StatusMentoria;
  meet_link: string;
  criado_em: string;
  passada: boolean;
  pode_cancelar: boolean;
}

// ---------------------------------------------------------------------------
// Prática (etapa 06-pratica)
// ---------------------------------------------------------------------------

export interface TemaSimulado {
  slug: string;
  nome: string;
  questoes: number;
}

export interface QuestaoPublica {
  id: number;
  enunciado: string;
  alternativas: string[];
}

export interface SimuladoIniciado {
  attempt_id: number;
  tema: string;
  tema_nome: string;
  questoes: QuestaoPublica[];
}

export interface RevisaoQuestao {
  id: number;
  enunciado: string;
  alternativas: string[];
  escolhida: number | null;
  correta: number;
  acertou: boolean;
  explicacao: string;
}

export interface ResultadoSimulado {
  attempt_id: number;
  tema: string;
  nota: number;
  total: number;
  revisao: RevisaoQuestao[];
  /** Presente ao rever um simulado salvo (Minha jornada). */
  tema_nome?: string;
}

export interface SimuladoHistorico {
  id: number;
  tema: string;
  nota: number;
  total: number;
  finalizado: boolean;
  criado_em: string;
}

export interface RelatorioPorPergunta {
  pergunta: string;
  resumo_resposta: string;
  avaliacao: string;
  sugestao: string;
}

export interface RelatorioEntrevista {
  nota_geral: number;
  pontos_fortes: string[];
  melhorias: string[];
  por_pergunta: RelatorioPorPergunta[];
  proximos_passos: string[];
}

export interface Entrevista {
  id: number;
  vaga: string;
  papel_entrevistador: string;
  tipo: string;
  nivel: string;
  idioma: "pt" | "en";
  descricao: string;
  conversa_id: number | null;
  relatorio: RelatorioEntrevista | null;
  nota_geral: number | null;
  criado_em: string;
  finalizado_em: string | null;
}

export interface EntrevistaHistorico {
  id: number;
  vaga: string;
  nota_geral: number | null;
  criado_em: string;
  finalizado_em: string | null;
}

// ---------------------------------------------------------------------------
// Rede (etapa 07-rede)
// ---------------------------------------------------------------------------

export type TipoPost = "post" | "vaga" | "noticia";
export type TipoAutor = "usuaria" | "empresa" | "ia";

export interface AutorPost {
  tipo: TipoAutor;
  nome: string;
  username: string | null;
  slug: string | null;
  foto: string;
}

export interface Post {
  id: number;
  tipo: TipoPost;
  origem_ia: boolean;
  autor: AutorPost;
  texto: string;
  imagem_url: string;
  vaga_cargo: string;
  vaga_local: string;
  vaga_link: string;
  titulo: string;
  categoria: string;
  fonte_url: string;
  curtidas_count: number;
  comentarios_count: number;
  curtiu: boolean;
  pode_excluir: boolean;
  criado_em: string;
}

export interface ComentarioPost {
  id: number;
  texto: string;
  autor_username: string | null;
  autor_nome: string;
  criado_em: string;
  pode_excluir: boolean;
}

export type FiltroFeed = "todos" | "seguindo" | "vagas";
