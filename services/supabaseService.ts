import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Atendente, SupabaseConfig } from '../types';

let supabase: SupabaseClient | null = null;

// Mock data to show when no credentials are provided
const MOCK_DATA: Atendente[] = [
  { id: 1, nome: 'Samuel', numero: '8199644682', status: false },
  { id: 2, nome: 'Ana Costa', numero: '81988887777', status: true },
  { id: 3, nome: 'Carlos Silva', numero: '81977776666', status: true },
  { id: 4, nome: 'Beatriz Lima', numero: '81955554444', status: false },
];

export const initSupabase = (config: SupabaseConfig) => {
  try {
    supabase = createClient(config.url, config.key);
    return true;
  } catch (error) {
    console.error("Failed to init supabase", error);
    return false;
  }
};

export const getAtendentes = async (): Promise<Atendente[]> => {
  if (!supabase) {
    // Return mock data if not connected
    // Simulate delay
    await new Promise(r => setTimeout(r, 800));
    return [...MOCK_DATA];
  }

  const { data, error } = await supabase
    .from('atendimento')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Atendente[];
};

export const updateAtendenteStatus = async (id: number | string, newStatus: boolean): Promise<void> => {
  if (!supabase) {
    // Update mock data in memory
    const index = MOCK_DATA.findIndex(a => a.id === id);
    if (index !== -1) {
      MOCK_DATA[index].status = newStatus;
    }
    await new Promise(r => setTimeout(r, 300));
    return;
  }

  const { error } = await supabase
    .from('atendimento')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const addAtendente = async (nome: string, numero: string): Promise<Atendente> => {
  const newAgent = {
    nome,
    numero,
    status: false
  };

  if (!supabase) {
    const mockAgent = { ...newAgent, id: Date.now() };
    MOCK_DATA.push(mockAgent);
    await new Promise(r => setTimeout(r, 500));
    return mockAgent;
  }

  const { data, error } = await supabase
    .from('atendimento')
    .insert([newAgent])
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Could not add agent. Check your database permissions (RLS).");
  
  return data as Atendente;
};

export const updateAtendenteInfo = async (id: number | string, nome: string, numero: string): Promise<void> => {
  if (!supabase) {
    const index = MOCK_DATA.findIndex(a => a.id === id);
    if (index !== -1) {
      MOCK_DATA[index].nome = nome;
      MOCK_DATA[index].numero = numero;
    }
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  const { error } = await supabase
    .from('atendimento')
    .update({ nome, numero })
    .eq('id', id);

  if (error) throw error;
};

export const deleteAtendente = async (id: number | string): Promise<void> => {
  if (!id) throw new Error("ID is required for deletion");

  if (!supabase) {
    const index = MOCK_DATA.findIndex(a => a.id === id);
    if (index !== -1) {
      MOCK_DATA.splice(index, 1);
    }
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  const { error } = await supabase
    .from('atendimento')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
