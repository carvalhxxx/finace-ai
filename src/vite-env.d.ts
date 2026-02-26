/// <reference types="vite/client" />

// ============================================================
// VITE ENV TYPES
// ============================================================
// Este arquivo diz ao TypeScript que import.meta.env existe
// e quais variáveis de ambiente o nosso app usa.
//
// Sem isso, o TS não reconhece import.meta.env e reclama
// com o erro "Property 'env' does not exist on type ImportMeta"
// ============================================================

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // adicione outras variáveis VITE_* aqui no futuro
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
