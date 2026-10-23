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
