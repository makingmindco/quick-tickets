export interface User {
  id: number;
  nome: string;
  email: string;
  is_admin: number | boolean;
  cargo?: string;
  trocar_senha_obrigatorio?: number | boolean;
  foto_url?: string | null;
  tema_escuro?: number | boolean;
}

export interface Ticket {
  id: number;
  usuario_id?: number;
  categoria_id?: number;
  titulo: string | null;
  descricao: string;
  status: "pendente" | "em_andamento" | "finalizado";
  prazo: string | null;
  admin_id?: number | null;
  criado_em: string;
  categoria: string;
  cliente?: string;
  cliente_nome?: string;
  cliente_email?: string;
  admin_nome?: string;
}

export interface Message {
  id: number;
  ticket_id: number;
  usuario_id: number;
  mensagem: string | null;
  tipo: "texto" | "imagem" | "audio";
  arquivo_url: string | null;
  criado_em: string;
  usuario_nome?: string;
  usuario_is_admin?: number;
}

export interface Aviso {
  id: number;
  titulo: string;
  mensagem: string;
  admin_id: number | null;
  data_criacao: string;
  autor?: string;
}
