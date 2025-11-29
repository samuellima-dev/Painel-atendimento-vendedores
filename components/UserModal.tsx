import React, { useState, useEffect } from 'react';
import { Atendente } from '../types';
import { UserPlus, Save, X, User, Phone } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nome: string, numero: string) => void;
  initialData?: Atendente | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNome(initialData.nome);
        setNumero(initialData.numero);
      } else {
        setNome('');
        setNumero('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome && numero) {
      onSave(nome, numero);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            {initialData ? <User className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            {initialData ? 'Editar Atendente' : 'Novo Atendente'}
          </h2>
          <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wide">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 placeholder-slate-400 font-medium"
                placeholder="Ex: Samuel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wide">Número (WhatsApp)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 placeholder-slate-400 font-mono font-medium"
                placeholder="Ex: 8199644682"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-xl mt-4 text-sm uppercase tracking-wide"
          >
            <Save className="w-5 h-5" />
            {initialData ? 'Salvar Alterações' : 'Adicionar Atendente'}
          </button>
        </form>
      </div>
    </div>
  );
};
