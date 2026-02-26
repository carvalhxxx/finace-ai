// ============================================================
// useAuth — HOOK DE AUTENTICAÇÃO
// ============================================================
// Gerencia todo o estado de autenticação do app.
//
// Retorna:
//   user      → dados do usuário logado (ou null se não logado)
//   loading   → true enquanto verifica se há sessão ativa
//   signIn()  → faz login com email e senha
//   signUp()  → cria nova conta
//   signOut() → faz logout
//
// Como funciona o fluxo de autenticação do Supabase:
//
//   1. Ao abrir o app, verificamos se existe uma sessão salva
//      no navegador (o Supabase salva automaticamente no
//      localStorage após o login)
//
//   2. onAuthStateChange fica "escutando" mudanças — se o
//      usuário logar ou deslogar em qualquer parte do app,
//      este hook atualiza o estado automaticamente
//
//   3. Qualquer componente que usar useAuth() receberá sempre
//      o estado mais atualizado
// ============================================================

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Tipagem do que o hook retorna
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // começa true pois ainda não sabemos se há sessão

  useEffect(() => {
    // ── PASSO 1: verifica se já existe sessão ativa ──────────
    // Quando o app abre, o Supabase checa o localStorage
    // e restaura a sessão automaticamente se ela existir.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false); // terminou de verificar
    });

    // ── PASSO 2: escuta mudanças de autenticação ─────────────
    // Este listener é chamado sempre que:
    // - O usuário faz login
    // - O usuário faz logout
    // - O token de sessão é renovado automaticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup: remove o listener quando o componente desmonta
    // Sem isso, teríamos múltiplos listeners rodando ao mesmo tempo
    return () => subscription.unsubscribe();
  }, []);

  // ── LOGIN ────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // ── CADASTRO ─────────────────────────────────────────────
  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // data extra salvo no perfil do usuário
        data: { name },
      },
    });
    return { error: error?.message ?? null };
  };

  // ── LOGOUT ───────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange já vai setar user para null automaticamente
  };

  return { user, loading, signIn, signUp, signOut };
}
