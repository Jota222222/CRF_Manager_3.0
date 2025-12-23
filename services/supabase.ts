import { createClient } from '@supabase/supabase-js';

// --- ÁREA DE CONFIGURAÇÃO MANUAL ---
// Se não conseguires configurar as variáveis na Vercel, cola as chaves aqui dentro das aspas:
const MANUAL_URL: string = ''; // Ex: 'https://msvfvnxpmetttstsvemm.supabase.co'
const MANUAL_KEY: string = ''; // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdmZ2bnhwbWV0dHRzdHN2ZW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Mzg1MjMsImV4cCI6MjA4MjAxNDUyM30.Xr4uiSvxY9aicvfXhTlKLnJcAdlDlgHd9D2PoG3P54Y'
// -----------------------------------

// 1. Tenta ler do Vite (import.meta.env) ou do Process (Vercel)
const envUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 2. Lógica de Prioridade: 
// Se houver chaves manuais coladas (comprimento > 10), USA ESSAS. 
// Caso contrário, tenta as do ambiente.
const supabaseUrl = (MANUAL_URL.length > 10) ? MANUAL_URL : (envUrl || 'https://placeholder.supabase.co');
const supabaseKey = (MANUAL_KEY.length > 10) ? MANUAL_KEY : (envKey || 'placeholder');

export const supabase = createClient(supabaseUrl, supabaseKey);

export const MATCH_ID = 'live_match';

// Helper para verificar conexão
export const checkConnection = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    if (supabaseUrl === 'https://placeholder.supabase.co') {
        return { success: false, message: "Falta configurar URL/Key do Supabase" };
    }
    
    // Tenta uma query simples para validar as credenciais
    const { data, error } = await supabase.from('match_data').select('id').limit(1);
    
    if (error) {
        // Se a tabela não existir, o erro será 42P01
        if (error.code === '42P01') {
            return { success: false, message: "Falta criar a Tabela (Correr SQL)" };
        }
        if (error.code === 'PGRST301') {
             return { success: false, message: "Erro de Permissões (Row Level Security)" };
        }
        // Erros de autenticação ou URL errado
        return { success: false, message: `Erro de Ligação: ${error.message}` };
    }
    
    return { success: true };
  } catch (e: any) {
    return { success: false, message: `Erro Crítico: ${e.message || e}` };
  }
};