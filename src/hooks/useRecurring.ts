// ============================================================
// useRecurring — HOOK DE TRANSAÇÕES RECORRENTES
// ============================================================
//
//   useRecurring()         → lista todas as recorrências
//   useCreateRecurring()   → cria nova recorrência
//   useToggleRecurring()   → ativa/desativa
//   useDeleteRecurring()   → remove
//   useProcessRecurring()  → gera as transações do mês atual
//                            se ainda não foram geradas
//
// Fluxo do useProcessRecurring:
//   1. Busca todas as recorrências ativas
//   2. Para cada uma, verifica se já existe uma transação
//      neste mês com o mesmo recurring_id
//   3. Se não existe → cria a transação automaticamente
//   4. Chamado ao abrir o app (no AppShell)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase }              from "@/lib/supabase";
import { RecurringTransaction, CreateRecurring } from "@/types";

const QUERY_KEY = ["recurring"];

// ============================================================
// BUSCAR RECORRÊNCIAS
// ============================================================

export function useRecurring() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select(`*, category:categories(*), account:accounts(*)`)
        .order("day_of_month", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CRIAR RECORRÊNCIA
// ============================================================

export function useCreateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recurring: CreateRecurring) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      const { data, error } = await supabase
        .from("recurring_transactions")
        .insert({ ...recurring, user_id: user.id })
        .select(`*, category:categories(*), account:accounts(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data as RecurringTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// TOGGLE ATIVO/INATIVO
// ============================================================

export function useToggleRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ active })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// DELETAR RECORRÊNCIA
// ============================================================

export function useDeleteRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurring_transactions")
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
// PROCESSAR RECORRÊNCIAS DO MÊS
// ============================================================
// Chamado uma vez ao abrir o app.
// Para cada recorrência ativa cujo dia já passou no mês atual,
// verifica se a transação já foi gerada. Se não, cria.
//
// Usa a coluna `recurring_id` em transactions para rastrear
// quais transações foram geradas automaticamente.

export function useProcessRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today     = new Date();
      const todayDay  = today.getDate();
      const year      = today.getFullYear();
      const month     = today.getMonth(); // 0-indexed

      // Busca todas as recorrências ativas do usuário
      const { data: recurrings, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true);

      if (error || !recurrings?.length) return;

      // Para cada recorrência cujo dia já chegou este mês
      for (const rec of recurrings) {
        const targetDay = Math.min(rec.day_of_month, new Date(year, month + 1, 0).getDate());

        // Só processa se o dia já passou ou é hoje
        if (targetDay > todayDay) continue;

        // Monta a data da transação deste mês
        const txDate = new Date(year, month, targetDay)
          .toISOString()
          .split("T")[0];

        // Verifica se já foi gerada este mês
        const { count } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("recurring_id", rec.id)
          .eq("date", txDate);

        // Se já existe, pula
        if (count && count > 0) continue;

        // Cria a transação automaticamente
        await supabase.from("transactions").insert({
          user_id:      user.id,
          account_id:   rec.account_id,
          category_id:  rec.category_id,
          description:  rec.description,
          amount:       rec.amount,
          type:         rec.type,
          date:         txDate,
          recurring_id: rec.id, // marca como gerada por recorrência
        });
      }
    },

    onSuccess: () => {
      // Invalida transações e contas para refletir os novos lançamentos
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}