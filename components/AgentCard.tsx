import React from 'react';
import { Atendente } from '../types';
import { Phone, Edit2, Trash2, MessageSquare, ExternalLink } from 'lucide-react';

interface AgentCardProps {
  agent: Atendente;
  onToggle: (id: number | string, currentStatus: boolean) => void;
  onEdit: (agent: Atendente) => void;
  onDelete: (id: number | string) => void;
  isUpdating: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onToggle, onEdit, onDelete, isUpdating }) => {
  return (
    <div className={`
      relative bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm transition-all duration-500 group
      hover:shadow-[0_40px_80px_-15px_rgba(15,23,42,0.1)] hover:-translate-y-2
      ${!agent.status ? 'bg-slate-50/50' : ''}
    `}>
      {/* Decorative Gradient Bar */}
      <div className={`
        absolute top-0 left-10 right-10 h-1.5 rounded-b-full transition-all duration-500
        ${agent.status ? 'bg-green-500 shadow-[0_5px_15px_-5px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}
      `} />

      <div className="flex items-start justify-between mb-8 pt-4">
        <div className="flex items-center gap-5">
          <div className={`
            w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl transition-all duration-500
            ${agent.status 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-700 rotate-3 group-hover:rotate-0' 
              : 'bg-gradient-to-br from-slate-300 to-slate-400 rotate-0'
            }
          `}>
            {agent.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-tight mb-2 group-hover:text-blue-600 transition-colors">{agent.nome}</h3>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-sm tracking-wide">{agent.numero}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={() => !isUpdating && onToggle(agent.id, agent.status)}
            disabled={isUpdating}
            className={`
              relative h-9 w-16 rounded-full transition-all duration-500 shadow-inner
              ${agent.status ? 'bg-green-500' : 'bg-slate-200'}
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className={`
              absolute top-1.5 left-1.5 bg-white w-6 h-6 rounded-full shadow-lg transition-all duration-500
              ${agent.status ? 'translate-x-7' : 'translate-x-0'}
            `} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${agent.status ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${agent.status ? 'text-green-600' : 'text-slate-400'}`}>
              {agent.status ? 'Disponível' : 'Indisponível'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-10">
        <button 
          onClick={() => window.open(`https://wa.me/${agent.numero.replace(/\D/g, '')}`, '_blank')}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] text-sm font-black hover:bg-blue-600 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-slate-900/10"
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </button>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(agent)}
            className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[1.5rem] transition-all group/btn"
            title="Editar Perfil"
          >
            <Edit2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => onDelete(agent.id)}
            className="p-4 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[1.5rem] transition-all group/btn"
            title="Remover"
          >
            <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Modern Badge Decoration */}
      {agent.status && (
        <div className="absolute -bottom-2 right-12 px-4 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-green-500/30 transform translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500">
          Atendimento Ativo
        </div>
      )}
    </div>
  );
};