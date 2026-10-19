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
