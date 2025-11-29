import React from 'react';
import { Atendente } from '../types';
import { Phone, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';

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
      relative overflow-hidden rounded-2xl p-6 transition-all duration-300 border group
      ${agent.status 
        ? 'bg-white border-green-100 shadow-lg shadow-green-100/50' 
        : 'bg-slate-50 border-slate-200 opacity-90'
      }
    `}>
      {/* Status Indicator Stripe */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${agent.status ? 'bg-green-500' : 'bg-slate-300'}`} />

      {/* Action Buttons (Absolute top-right) - Always visible, higher z-index */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          title="Editar Informações"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(agent.id); }}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          title="Excluir Atendente"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start justify-between pr-20"> {/* Increased padding-right to avoid overlap with buttons */}
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0
            ${agent.status 
              ? 'bg-gradient-to-br from-green-400 to-green-600' 
              : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }
          `}>
            {agent.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{agent.nome}</h3>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono truncate">{agent.numero}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className={`
          px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5
          ${agent.status 
            ? 'bg-green-100 text-green-700' 
            : 'bg-slate-200 text-slate-600'
          }
        `}>
          {agent.status ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {agent.status ? 'Online' : 'Offline'}
        </div>

        <button
          onClick={() => !isUpdating && onToggle(agent.id, agent.status)}
          disabled={isUpdating}
          className={`
            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75
            ${agent.status ? 'bg-green-500' : 'bg-slate-300'}
            ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className="sr-only">Toggle Status</span>
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 
              transition duration-200 ease-in-out
              ${agent.status ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
    </div>
  );
};
