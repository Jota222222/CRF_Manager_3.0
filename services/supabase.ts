import { createClient } from '@supabase/supabase-js';

// --- ÁREA DE CONFIGURAÇÃO MANUAL ---
// Se não conseguires configurar as variáveis na Vercel, cola as chaves aqui dentro das aspas:
const MANUAL_URL = ''; // Ex: 'https://xyz.supabase.co'
const MANUAL_KEY = ''; // Ex: 'eyJhbGciOiJIUzI1NiIsInR5...'
// -----------------------------------

// Tenta ler do ambiente (Vercel), se não existir, usa a manual, se não, usa placeholder
const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY;

// Prioridade: Ambiente > Manual > Placeholder
const supabaseUrl = (envUrl && envUrl.length > 5) ? envUrl : (MANUAL_URL || 'https://placeholder.supabase.co');
const supabaseKey = (envKey && envKey.length > 5) ? envKey : (MANUAL_KEY || 'placeholder');

export const supabase = createClient(supabaseUrl, supabaseKey);

export const MATCH_ID = 'live_match';

// Helper para verificar conexão
export const checkConnection = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    if (supabaseUrl === 'https://placeholder.supabase.co') {
        return { success: false, message: "Chaves do Supabase em falta. Cola-as no ficheiro services/supabase.ts" };
    }
    
    // Tenta uma query simples para validar as credenciais
    const { data, error } = await supabase.from('match_data').select('id').limit(1);
    
    if (error) {
        // Se a tabela não existir, o erro será 42P01
        if (error.code === '42P01') {
            return { success: false, message: "A tabela 'match_data' não existe. Corre o SQL no Supabase." };
        }
        return { success: false, message: `Erro Supabase: ${error.message} (${error.code})` };
    }
    
    return { success: true };
  } catch (e: any) {
    return { success: false, message: `Erro Inesperado: ${e.message || e}` };
  }
};