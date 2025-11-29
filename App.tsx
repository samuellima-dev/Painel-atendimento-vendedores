import React, { useEffect, useState, useCallback } from 'react';
import { Settings, Users, Sparkles, RefreshCw, AlertTriangle, Plus, X } from 'lucide-react';
import { Atendente, FetchStatus, SupabaseConfig } from './types';
import * as supabaseService from './services/supabaseService';
import * as geminiService from './services/geminiService';
import { AgentCard } from './components/AgentCard';
import { ConfigModal } from './components/ConfigModal';
import { UserModal } from './components/UserModal';
import { ConfirmationModal } from './components/ConfirmationModal';

// Helper to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return 'An unexpected error occurred';
};

const App: React.FC = () => {
  const [agents, setAgents] = useState<Atendente[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingAgent, setEditingAgent] = useState<Atendente | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<number | string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  
  // AI State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const fetchAgents = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await supabaseService.getAtendentes();
      setAgents(data);
      setStatus('success');
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
      setStatus('error');
    }
  }, []);

  // Initial load: check for stored config
  useEffect(() => {
    const storedUrl = localStorage.getItem('sb_url');
    const storedKey = localStorage.getItem('sb_key');

    if (storedUrl && storedKey) {
      const success = supabaseService.initSupabase({ url: storedUrl, key: storedKey });
      setIsConnected(success);
    }
    // Always fetch (it will mock if not connected)
    fetchAgents();
  }, [fetchAgents]);

  const handleConfigSave = (config: SupabaseConfig) => {
    const success = supabaseService.initSupabase(config);
    setIsConnected(success);
    fetchAgents();
  };

  const handleToggleStatus = async (id: number | string, currentStatus: boolean) => {
    // Optimistic Update
    const originalAgents = [...agents];
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: !currentStatus } : a));

    try {
      await supabaseService.updateAtendenteStatus(id, !currentStatus);
    } catch (err) {
      console.error("Update failed", err);
      // Revert on error
      setAgents(originalAgents);
      setError(`Failed to update status: ${getErrorMessage(err)}`);
      setStatus('error');
    }
  };

  const handleOpenAddUser = () => {
    setEditingAgent(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (agent: Atendente) => {
    setEditingAgent(agent);
    setIsUserModalOpen(true);
  };

  const handleRequestDelete = (id: number | string) => {
    setAgentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;
    const id = agentToDelete;
    
    // Optimistic update
    const originalAgents = [...agents];
    setAgents(prev => prev.filter(a => a.id !== id));

    try {
      await supabaseService.deleteAtendente(id);
    } catch (err) {
      console.error("Failed to delete user", err);
      setError(`Erro ao excluir usuário: ${getErrorMessage(err)}`);
      setStatus('error');
      setAgents(originalAgents);
    }
    setAgentToDelete(null);
  };

  const handleSaveUser = async (nome: string, numero: string) => {
    try {
      if (editingAgent) {
        // Edit mode
        await supabaseService.updateAtendenteInfo(editingAgent.id, nome, numero);
        setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, nome, numero } : a));
      } else {
        // Add mode
        const newAgent = await supabaseService.addAtendente(nome, numero);
        if (newAgent) {
           setAgents(prev => [...prev, newAgent]);
        } else {
           fetchAgents();
        }
      }
    } catch (err) {
      console.error("Failed to save user", err);
      setError(`Erro ao salvar usuário: ${getErrorMessage(err)}`);
      setStatus('error');
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingAi(true);
    setAiReport(null);
    try {
      const report = await geminiService.generateTeamReport(agents);
      setAiReport(report);
    } catch (err) {
      setAiReport("Unable to generate AI report. Please check your API configuration.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const activeCount = agents.filter(a => a.status).length;
  const totalCount = agents.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Painel de Atendimento</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                {isConnected ? 'Supabase Connected' : 'Demo Mode'}
             </div>
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Configure Database"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats & Actions */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Visão Geral</h2>
            <p className="text-slate-500 mt-1">Gerencie a disponibilidade da equipe em tempo real.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[100px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online</span>
              <span className="text-2xl font-bold text-green-600">{activeCount} <span className="text-sm text-slate-300">/ {totalCount}</span></span>
            </div>
            
            <button
               onClick={handleGenerateReport}
               disabled={isGeneratingAi}
               className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl shadow-sm flex items-center gap-2 font-medium transition-all"
            >
              {isGeneratingAi ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-violet-600" />
              )}
              <span>AI Insights</span>
            </button>

            <button
               onClick={handleOpenAddUser}
               className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow-md flex items-center gap-2 font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Atendente</span>
            </button>
          </div>
        </div>

        {/* AI Report Section */}
        {aiReport && (
          <div className="mb-8 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-indigo-600" />
            </div>
            <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Gemini Team Analysis
            </h3>
            <p className="text-indigo-800 leading-relaxed max-w-3xl">
              {aiReport}
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between gap-3 mb-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-bold">Atenção</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <button onClick={() => setStatus('idle')} className="p-1 hover:bg-red-100 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Grid */}
        {status === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {agents.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onToggle={handleToggleStatus}
                onEdit={handleOpenEditUser}
                onDelete={handleRequestDelete}
                isUpdating={false}
              />
            ))}
          </div>
        )}

        {!isConnected && status !== 'loading' && (
          <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm">
              Running in Demo Mode. Changes are local only. 
              <button onClick={() => setIsConfigOpen(true)} className="text-blue-600 hover:underline ml-1 font-medium">Connect Supabase</button>
            </p>
          </div>
        )}
      </main>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={handleConfigSave}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        initialData={editingAgent}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Atendente"
        message="Tem certeza que deseja excluir este atendente? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default App;
