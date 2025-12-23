import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Settings, 
  Users, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  X, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  LayoutDashboard,
  LogOut,
  Bell
} from 'lucide-react';
import { Atendente, FetchStatus, SupabaseConfig } from './types';
import * as supabaseService from './services/supabaseService';
import * as geminiService from './services/geminiService';
import { AgentCard } from './components/AgentCard';
import { ConfigModal } from './components/ConfigModal';
import { UserModal } from './components/UserModal';
import { ConfirmationModal } from './components/ConfirmationModal';

/**
 * Robustly extracts a readable error message from any error object.
 * Prevents the dreaded "[object Object]" by inspecting common error shapes.
 */
const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Ocorreu um erro desconhecido.';
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object') {
    // Handle Supabase/Postgrest errors
    const err = error as any;
    if (err.message) return String(err.message);
    if (err.error_description) return String(err.error_description);
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object' && err.error.message) return String(err.error.message);
    }
    
    // Fallback: try stringifying the object
    try {
      const stringified = JSON.stringify(error);
      if (stringified === '{}' && error.toString) {
        const ts = error.toString();
        return ts !== '[object Object]' ? ts : 'Erro estrutural detectado.';
      }
      return stringified;
    } catch {
      return 'Erro não pôde ser processado.';
    }
  }
  
  return String(error);
};

const App: React.FC = () => {
  const [agents, setAgents] = useState<Atendente[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Atendente | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<number | string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const fetchAgents = useCallback(async (isBackground: boolean = false) => {
    if (!isBackground) {
      setStatus('loading');
      setError(null);
    }
    try {
      const data = await supabaseService.getAtendentes();
      setAgents(data);
      if (!isBackground) setStatus('success');
    } catch (err: unknown) {
      console.error(err);
      if (!isBackground) {
        setError(getErrorMessage(err));
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    const storedUrl = localStorage.getItem('sb_url');
    const storedKey = localStorage.getItem('sb_key');
    if (storedUrl && storedKey) {
      const success = supabaseService.initSupabase({ url: storedUrl, key: storedKey });
      setIsConnected(success);
    }
    fetchAgents(false);
  }, [fetchAgents]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAgents(true);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [fetchAgents]);

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            agent.numero.includes(searchTerm);
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'online' && agent.status) || 
                           (filterStatus === 'offline' && !agent.status);
      return matchesSearch && matchesFilter;
    });
  }, [agents, searchTerm, filterStatus]);

  const stats = {
    total: agents.length,
    online: agents.filter(a => a.status).length,
    offline: agents.filter(a => !a.status).length
  };

  const handleToggleStatus = async (id: number | string, currentStatus: boolean) => {
    const originalAgents = [...agents];
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: !currentStatus } : a));
    try {
      await supabaseService.updateAtendenteStatus(id, !currentStatus);
    } catch (err) {
      setAgents(originalAgents);
      setError(`Falha ao atualizar status: ${getErrorMessage(err)}`);
      setStatus('error');
    }
  };

  const handleSaveUser = async (nome: string, numero: string) => {
    try {
      if (editingAgent) {
        await supabaseService.updateAtendenteInfo(editingAgent.id, nome, numero);
        setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, nome, numero } : a));
      } else {
        const newAgent = await supabaseService.addAtendente(nome, numero);
        setAgents(prev => [...prev, newAgent]);
      }
    } catch (err) {
      setError(`Erro ao salvar: ${getErrorMessage(err)}`);
      setStatus('error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;
    const id = agentToDelete;
    const originalAgents = [...agents];
    setAgents(prev => prev.filter(a => a.id !== id));
    try {
      await supabaseService.deleteAtendente(id);
    } catch (err) {
      setError(`Erro ao excluir: ${getErrorMessage(err)}`);
      setStatus('error');
      setAgents(originalAgents);
    }
    setAgentToDelete(null);
  };

  const handleConfigSave = (config: SupabaseConfig) => {
    const success = supabaseService.initSupabase(config);
    setIsConnected(success);
    fetchAgents(false);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingAi(true);
    setAiReport(null);
    try {
      const report = await geminiService.generateTeamReport(agents);
      setAiReport(report);
    } catch (err) {
      setAiReport("Não foi possível gerar os insights da AI. Verifique sua chave API.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Navigation Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#0F172A] flex-col sticky top-0 h-screen shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">AdminPanel</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Menu Principal</p>
          </div>
          <button className="w-full flex items-center gap-4 px-4 py-3.5 bg-blue-600/10 text-blue-400 rounded-2xl font-bold transition-all border border-blue-500/10">
            <Users className="w-5 h-5" />
            Vendedores
          </button>
          <button onClick={() => setIsConfigOpen(true)} className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all">
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="p-8">
          <div className={`p-5 rounded-3xl ${isConnected ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isConnected ? 'text-green-400' : 'text-orange-400'}`}>Cloud Status</p>
            </div>
            <p className="text-white text-xs font-bold leading-tight">{isConnected ? 'Sincronizado com Supabase' : 'Modo Offline Ativo'}</p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div className="lg:hidden flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-xl text-white">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tighter">AdminPanel</span>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
              Dashboard <span className="text-slate-200">/</span> <span className="text-slate-900">Gerenciamento de Vendedores</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 bg-slate-50 text-slate-500 hover:text-blue-600 rounded-2xl transition-all border border-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none">Admin Manager</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Super User</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-md"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 lg:p-12 max-w-screen-2xl mx-auto w-full">
          {/* Welcome & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Painel Operacional</h1>
              <p className="text-slate-500 font-medium">Controle total sobre a disponibilidade da sua força de vendas.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingAi}
                className="group flex items-center gap-2.5 bg-white text-slate-700 px-6 py-3.5 rounded-[1.25rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 font-bold transition-all"
              >
                {isGeneratingAi ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />}
                Insights AI
              </button>
              <button 
                onClick={() => { setEditingAgent(null); setIsUserModalOpen(true); }}
                className="flex items-center gap-2.5 bg-blue-600 text-white px-7 py-3.5 rounded-[1.25rem] shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] font-black transition-all"
              >
                <Plus className="w-6 h-6" />
                Novo Vendedor
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-blue-500 p-3.5 rounded-[1.25rem] text-white w-fit mb-6 shadow-lg shadow-blue-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Total Equipe</p>
                <p className="text-4xl font-black text-slate-900">{stats.total}</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-green-500 p-3.5 rounded-[1.25rem] text-white w-fit mb-6 shadow-lg shadow-green-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Online Agora</p>
                <p className="text-4xl font-black text-green-600">{stats.online}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-slate-400 p-3.5 rounded-[1.25rem] text-white w-fit mb-6 shadow-lg shadow-slate-400/20">
                  <UserX className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Indisponíveis</p>
                <p className="text-4xl font-black text-slate-600">{stats.offline}</p>
              </div>
            </div>
          </div>

          {/* AI Relatório Banner */}
          {aiReport && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
              <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-[0_35px_60px_-15px_rgba(15,23,42,0.3)] relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-blue-400 font-black uppercase tracking-[0.25em] text-xs">Análise Estratégica AI</h3>
                  </div>
                  <p className="text-2xl text-slate-100 leading-snug font-medium max-w-4xl tracking-tight">
                    {aiReport}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters & Content Area */}
          <div className="bg-white rounded-[3rem] p-4 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex flex-col lg:flex-row gap-6 mb-10 p-2">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Pesquisar por nome ou celular..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-700 font-bold shadow-inner"
                />
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] self-start shadow-inner">
                {(['all', 'online', 'offline'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-8 py-3 rounded-[1.25rem] text-sm font-black transition-all ${filterStatus === s ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {s === 'all' ? 'Ver Todos' : s === 'online' ? 'Disponíveis' : 'Indisponíveis'}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="mb-10 bg-red-50 border border-red-100 text-red-600 p-5 rounded-[2rem] flex items-center justify-between gap-4 animate-in zoom-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                  </div>
                  <p className="font-bold text-sm leading-tight">{error}</p>
                </div>
                <button onClick={() => setStatus('idle')} className="p-2 hover:bg-red-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content Grid */}
            {status === 'loading' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <AgentCard 
                      key={agent.id} 
                      agent={agent} 
                      onToggle={handleToggleStatus}
                      onEdit={(a) => { setEditingAgent(a); setIsUserModalOpen(true); }}
                      onDelete={(id) => { setAgentToDelete(id); setIsDeleteModalOpen(true); }}
                      isUpdating={false}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-32 text-center">
                    <div className="bg-slate-50 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Users className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-black text-2xl tracking-tight">Nenhum resultado encontrado</h3>
                    <p className="text-slate-400 font-bold mt-2">Redefina os filtros ou adicione novos vendedores.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        
        <footer className="p-10 text-center">
          <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">
            Admin Panel Dashboard © 2025 • CRM Integado
          </p>
        </footer>
      </div>

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} onSave={handleConfigSave} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} initialData={editingAgent} />
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Remoção" message="Esta ação excluirá permanentemente o vendedor da sua base de dados. Deseja continuar?" />
    </div>
  );
};

export default App;