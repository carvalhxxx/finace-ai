// ============================================================
// useTransactions — HOOK DE TRANSAÇÕES
// ============================================================
// Centraliza toda a lógica de acesso às transações:
//
//   useTransactions()   → lista transações do mês atual
//   useCreateTransaction() → cria nova transação
//   useDeleteTransaction() → deleta transação por id
//
// Padrão usado: cada operação é um hook separado.
// Isso mantém os componentes limpos — eles só chamam o hook
// e recebem os dados/funções prontos para usar.
//
// TanStack Query cuida de:
//   - Cache dos dados (não rebusca enquanto estiver fresco)
//   - Estado de loading e error automaticamente
//   - Invalidar o cache após criar/deletar (recarrega a lista)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Transaction, CreateTransaction } from "@/types";

// Chave do cache — qualquer hook que usar essa mesma chave
// compartilha os mesmos dados em cache. Quando invalidamos
// essa chave após um insert, TODOS os componentes que a usam
// recebem os dados atualizados automaticamente.
const QUERY_KEY = ["transactions"];

// ============================================================
// BUSCAR TRANSAÇÕES
// ============================================================
// Busca as transações do mês atual do usuário logado,
// ordenadas da mais recente para a mais antiga.
// Inclui os dados de categoria e conta via join (select *).

export function useTransactions(month?: Date) {
  const targetDate = month ?? new Date();

  // Primeiro e último dia do mês alvo
  const from = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    .toISOString().split("T")[0]; // "2024-02-01"

  const to = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
    .toISOString().split("T")[0]; // "2024-02-29"

  return useQuery({
    // A queryKey inclui o mês — se o usuário navegar para
    // outro mês, o cache é separado (não mistura os dados)
    queryKey: [...QUERY_KEY, from, to],

    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .gte("date", from)  // maior ou igual ao primeiro dia
        .lte("date", to)    // menor ou igual ao último dia
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CRIAR TRANSAÇÃO
// ============================================================
// Insere uma nova transação no banco e invalida o cache,
// forçando a lista a recarregar com o novo dado.

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: CreateTransaction) => {
      // Busca o usuário logado para incluir o user_id explicitamente
      // O RLS do Supabase exige que o user_id venha no payload do INSERT
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...transaction, user_id: user.id })
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .single(); // retorna o objeto criado, não um array

      if (error) throw new Error(error.message);
      return data as Transaction;
    },

    onSuccess: () => {
      // Invalida TODAS as queries de transações (todos os meses
      // em cache) para garantir que os totais ficam corretos
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// ATUALIZAR TRANSAÇÃO
// ============================================================

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<CreateTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(fields)
        .eq("id", id)
        .select(`*, category:categories(*), account:accounts(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data as Transaction;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// DELETAR TRANSAÇÃO
// ============================================================

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id); // deleta só o registro com esse id

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      // Assim como no create, invalida o cache após deletar
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// RESUMO FINANCEIRO DO MÊS
// ============================================================
// Calcula receitas, despesas e saldo líquido a partir
// das transações já carregadas — sem nova requisição ao banco.

export function useFinancialSummary(month?: Date) {
  const { data: transactions = [], ...rest } = useTransactions(month);

  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === "income")  acc.monthlyIncome   += tx.amount;
      if (tx.type === "expense") acc.monthlyExpense  += tx.amount;
      return acc;
    },
    { monthlyIncome: 0, monthlyExpense: 0 }
  );

  return {
    ...rest,
    summary: {
      ...summary,
      monthlyNet: summary.monthlyIncome - summary.monthlyExpense,
    },
  };
}