export interface Atendente {
  id: number | string;
  numero: string;
  nome: string;
  status: boolean;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';
