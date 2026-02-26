// ============================================================
// useProfile — HOOK DE PERFIL DO USUÁRIO
// ============================================================
//   useProfile()        → busca dados do perfil
//   useUpdateProfile()  → atualiza nome
//   useChangePassword() → troca senha via Supabase Auth
//   useSignOut()        → logout
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Profile }  from "@/types";

const QUERY_KEY = ["profile"];

// ============================================================
// BUSCAR PERFIL
// ============================================================

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEY,

    queryFn: async (): Promise<Profile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw new Error(error.message);
      return data as Profile;
    },
  });
}

// ============================================================
// ATUALIZAR NOME
// ============================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      const { error } = await supabase
        .from("profiles")
        .update({ name })
        .eq("id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// TROCAR SENHA
// ============================================================
// O Supabase Auth cuida da troca — não precisamos mexer
// no banco diretamente.

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      // Reautentica com a senha atual para confirmar identidade
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuário não encontrado.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error("Senha atual incorreta.");

      // Troca para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw new Error(error.message);
    },
  });
}

// ============================================================
// LOGOUT
// ============================================================

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Limpa todo o cache ao fazer logout
      // Sem isso, dados do usuário anterior ficariam em memória
      queryClient.clear();
    },
  });
}