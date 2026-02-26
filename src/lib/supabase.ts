// ============================================================
// CLIENTE SUPABASE
// Este arquivo cria a conexão com o seu projeto Supabase.
// Ele é importado em todo lugar que precisar acessar o banco.
//
// As variáveis de ambiente (VITE_SUPABASE_*) ficam no arquivo
// .env.local na raiz do projeto — nunca commite esse arquivo!
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Variáveis do Supabase não encontradas. Crie o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
  );
}

// createClient cria a instância que usamos para:
// - Auth: supabase.auth.signIn(), supabase.auth.signOut()
// - Banco: supabase.from("transactions").select()
// - Realtime: supabase.channel()
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exportamos também os tipos gerados pelo Supabase (quando você rodar
// `supabase gen types` no futuro, os tipos virão daqui)
export type { Session, User } from "@supabase/supabase-js";