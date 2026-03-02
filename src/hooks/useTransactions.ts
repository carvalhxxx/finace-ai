// ============================================================
// useTransactions — HOOK DE TRANSAÇÕES
// ============================================================
//
// TIPOS DE TRANSAÇÃO:
//
// 1. Transação normal (conta corrente):
//    account_id = conta, credit_card_id = null
//    Afeta saldo da conta.
//
// 2. Compra no cartão:
//    account_id = null, credit_card_id = cartão
//    purchase_date = data da compra
//    date = data do vencimento da fatura
//    NÃO afeta saldo da conta corrente.
//    Aumenta a fatura do cartão.
//
// 3. Pagamento de fatura:
//    account_id = conta corrente, credit_card_id = null
//    type = "expense", description = "Fatura [cartão]"
//    Afeta saldo da conta. Reduz fatura (via zerar as compras).
//
// RESUMO FINANCEIRO:
//   Receitas  = transactions income com account_id do mês
//   Despesas  = transactions expense com account_id do mês
//             + compras no cartão pela purchase_date do mês
//             + bills não pagas com due_date no mês
//
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Transaction, CreateTransaction } from "@/types";

const QUERY_KEY = ["transactions"];

// ============================================================
// BUSCAR TRANSAÇÕES DO MÊS
// ============================================================
// Retorna transações normais (by date) + compras no cartão
// (by purchase_date) sem duplicatas.

export function useTransactions(month?: Date) {
  const targetDate = month ?? new Date();

  const from = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    .toISOString().split("T")[0];
  const to = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
    .toISOString().split("T")[0];

  return useQuery({
    queryKey: [...QUERY_KEY, from, to],

    queryFn: async (): Promise<Transaction[]> => {
      // Transações normais (conta corrente) pelo date
      const { data: normal, error: e1 } = await supabase
        .from("transactions")
        .select(`*, category:categories(*), account:accounts!account_id(*)`)
        .not("account_id", "is", null)
        .is("credit_card_id", null)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (e1) throw new Error(e1.message);

      // Compras no cartão pela purchase_date
      const { data: cardTx, error: e2 } = await supabase
        .from("transactions")
        .select(`*, category:categories(*), card:accounts!credit_card_id(*)`)
        .not("credit_card_id", "is", null)
        .gte("purchase_date", from)
        .lte("purchase_date", to)
        .order("purchase_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (e2) throw new Error(e2.message);

      // Combina e ordena pela data mais relevante
      const all = [
        ...(normal ?? []),
        ...(cardTx ?? []).map((tx) => ({
          ...tx,
          // Normaliza: usa purchase_date como data de exibição
          _displayDate: tx.purchase_date ?? tx.date,
        })),
      ];

      return all.sort((a, b) => {
        const dateA = (a as any)._displayDate ?? a.date;
        const dateB = (b as any)._displayDate ?? b.date;
        return dateB.localeCompare(dateA);
      });
    },
  });
}

// ============================================================
// CRIAR TRANSAÇÃO NORMAL
// ============================================================

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: CreateTransaction) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...transaction, user_id: user.id })
        .select(`*, category:categories(*), account:accounts!account_id(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data as Transaction;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

// ============================================================
// CRIAR COMPRA NO CARTÃO
// ============================================================
// Salva com credit_card_id, account_id = null.
// purchase_date = data da compra, date = vencimento da fatura.

export function useCreateCardTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: {
      credit_card_id: string;
      category_id: string;
      description: string;
      amount: number;
      purchase_date: string; // data da compra
      date: string;          // vencimento da fatura
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          ...transaction,
          user_id: user.id,
          account_id: null,
          type: "expense",
        })
        .select(`*, category:categories(*), card:accounts!credit_card_id(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
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
        .select(`*, category:categories(*), account:accounts!account_id(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data as Transaction;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
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
        .eq("id", id);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

// ============================================================
// MÊS MAIS FUTURO COM TRANSAÇÃO
// ============================================================

export function useLatestTransactionMonth() {
  return useQuery({
    queryKey: [...QUERY_KEY, "latest"],
    queryFn: async (): Promise<Date> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("date")
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return new Date();
      return new Date(`${data.date}T12:00:00`);
    },
  });
}

// ============================================================
// RESUMO FINANCEIRO DO MÊS
// ============================================================
// Receitas  = transactions income (account_id) no mês
// Despesas  = transactions expense (account_id) no mês
//           + compras no cartão (credit_card_id) pela purchase_date
//           + bills não pagas com due_date no mês

export function useFinancialSummary(month?: Date) {
  const targetDate = month ?? new Date();
  const from = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    .toISOString().split("T")[0];
  const to = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
    .toISOString().split("T")[0];

  return useQuery({
    queryKey: [...QUERY_KEY, "summary", from, to],
    queryFn: async () => {

      // ── 1. Transações normais (conta corrente) ─────────────
      const { data: normal, error: e1 } = await supabase
        .from("transactions")
        .select("amount, type")
        .not("account_id", "is", null)
        .is("credit_card_id", null)
        .gte("date", from)
        .lte("date", to);

      if (e1) throw new Error(e1.message);

      const monthlyIncome = (normal ?? [])
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0);

      const accountExpense = (normal ?? [])
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);

      // ── 2. Compras no cartão pela purchase_date ────────────
      const { data: cardTx, error: e2 } = await supabase
        .from("transactions")
        .select("amount")
        .not("credit_card_id", "is", null)
        .gte("purchase_date", from)
        .lte("purchase_date", to);

      const cardExpense = e2
        ? 0
        : (cardTx ?? []).reduce((s, t) => s + Number(t.amount), 0);

      // ── 3. Bills não pagas com vencimento no mês ───────────
      const { data: unpaidBills, error: e3 } = await supabase
        .from("bills")
        .select("amount")
        .eq("paid", false)
        .gte("due_date", from)
        .lte("due_date", to);

      const billsExpense = e3
        ? 0
        : (unpaidBills ?? []).reduce((s, b) => s + Number(b.amount), 0);

      const monthlyExpense = accountExpense + cardExpense + billsExpense;

      return {
        monthlyIncome,
        monthlyExpense,
        monthlyNet: monthlyIncome - monthlyExpense,
      };
    },
  });
}