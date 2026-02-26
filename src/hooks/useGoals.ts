// ============================================================
// useGoals — HOOK DE METAS FINANCEIRAS
// ============================================================
// Gerencia as metas do usuário.
//
//   useGoals()         → lista todas as metas
//   useCreateGoal()    → cria nova meta
//   useUpdateGoal()    → atualiza valor atual da meta
//   useDeleteGoal()    → deleta meta
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Goal, CreateGoal } from "@/types";

const QUERY_KEY = ["goals"];

// ============================================================
// BUSCAR METAS
// ============================================================

export function useGoals() {
  return useQuery({
    queryKey: QUERY_KEY,

    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CRIAR META
// ============================================================

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: CreateGoal) => {
      const { data, error } = await supabase
        .from("goals")
        .insert(goal)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// ATUALIZAR VALOR ATUAL DA META
// ============================================================
// Quando o usuário registra uma contribuição para a meta,
// atualizamos o current_amount somando o novo valor.

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, current_amount }: { id: string; current_amount: number }) => {
      const { data, error } = await supabase
        .from("goals")
        .update({ current_amount })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// DELETAR META
// ============================================================

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// UTILITÁRIO — PROGRESSO DA META
// ============================================================
// Calcula o percentual de progresso de uma meta.
// Limitado a 100% mesmo se current > target.

export function goalProgress(goal: Goal): number {
  if (goal.target_amount <= 0) return 0;
  return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
}

// Retorna quantos dias faltam para o prazo da meta
export function daysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  const today = new Date();
  const end   = new Date(`${deadline}T12:00:00`);
  const diff  = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
