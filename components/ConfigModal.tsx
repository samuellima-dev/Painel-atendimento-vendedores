import React, { useState, useEffect } from 'react';
import { SupabaseConfig } from '../types';
import { Database, Key, Save, X } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SupabaseConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  useEffect(() => {
    const storedUrl = localStorage.getItem('sb_url');
    const storedKey = localStorage.getItem('sb_key');
    if (storedUrl) setUrl(storedUrl);
    if (storedKey) setKey(storedKey);
  }, [isOpen]);

  const handleSave = () => {
    if (url && key) {
      localStorage.setItem('sb_url', url);
      localStorage.setItem('sb_key', key);
      onSave({ url, key });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            Supabase Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-4">
            Enter your Supabase credentials to connect to the <code>atendentes</code> table.
            If left empty, the app uses <b>Demo Mode</b>.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Project URL</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">https://</span>
              <input 
                type="text" 
                value={url.replace('https://', '')}
                onChange={(e) => setUrl(`https://${e.target.value.replace('https://', '')}`)}
                className="w-full pl-16 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                placeholder="your-project.supabase.co"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Anon Public Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-mono text-sm"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all mt-4"
          >
            <Save className="w-4 h-4" />
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};