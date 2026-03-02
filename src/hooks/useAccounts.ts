// ============================================================
// useAccounts — HOOK DE CONTAS BANCÁRIAS
// ============================================================
//
// LÓGICA DE SALDO:
//
// Conta corrente/poupança/carteira:
//   saldo = balance inicial + receitas - despesas (account_id = conta)
//   Compras no cartão NÃO afetam o saldo da conta corrente.
//   Só o pagamento da fatura (que é uma despesa normal) afeta.
//
// Cartão de crédito:
//   NÃO tem saldo. Tem fatura.
//   fatura = soma de transactions onde credit_card_id = cartão
//   limite_disponivel = limit_amount - fatura
//
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Account, CreateAccount } from "@/types";

const QUERY_KEY = ["accounts"];

// ============================================================
// BUSCAR CONTAS
// ============================================================

export function useAccounts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CONTAS COM SALDO DINÂMICO
// ============================================================

export function useAccountsWithBalance() {
  const { data: accounts = [] } = useAccounts();

  return useQuery({
    queryKey: ["accounts-with-balance"],
    enabled: accounts.length > 0,

    queryFn: async () => {
      const now      = new Date();
      const today    = now.toISOString().split("T")[0];
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split("T")[0];
      const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split("T")[0];

      // ── Transações de conta corrente (account_id preenchido) ──
      // Ignora compras no cartão (que têm credit_card_id preenchido
      // e account_id null)
      const { data: accountTx, error: e1 } = await supabase
        .from("transactions")
        .select("account_id, amount, type, date")
        .not("account_id", "is", null)
        .is("credit_card_id", null)
        .lte("date", today);

      if (e1) throw new Error(e1.message);

      // ── Compras no cartão (credit_card_id preenchido) ──────────
      const { data: cardTx, error: e2 } = await supabase
        .from("transactions")
        .select("credit_card_id, amount, purchase_date, date")
        .not("credit_card_id", "is", null);

      if (e2) throw new Error(e2.message);

      // Agrupa gastos por cartão (fatura total acumulada)
      const cardSpending: Record<string, number> = {};
      (cardTx ?? []).forEach((tx) => {
        if (!tx.credit_card_id) return;
        cardSpending[tx.credit_card_id] =
          (cardSpending[tx.credit_card_id] ?? 0) + Number(tx.amount);
      });

      return accounts.map((acc) => {

        // ── CARTÃO DE CRÉDITO ──────────────────────────────────
        if (acc.type === "credit_card") {
          const fatura   = cardSpending[acc.id] ?? 0;
          const limit    = Number(acc.limit_amount ?? 0);
          const available = Math.max(limit - fatura, 0);
          // Retorna fatura em balance e available em limit_available
          return { ...acc, balance: fatura, limit_available: available };
        }

        // ── CONTA NORMAL ───────────────────────────────────────
        const txs = (accountTx ?? []).filter((tx) => tx.account_id === acc.id);

        const relevant = acc.accumulates
          ? txs
          : txs.filter((tx) => tx.date >= firstDay && tx.date <= lastDay);

        const dynamic = relevant.reduce((sum, tx) =>
          tx.type === "income"
            ? sum + Number(tx.amount)
            : sum - Number(tx.amount),
          0
        );

        return {
          ...acc,
          balance: acc.accumulates
            ? Number(acc.balance) + dynamic
            : dynamic,
        };
      });
    },
  });
}

// ============================================================
// SALDO TOTAL (só contas normais, sem cartão)
// ============================================================

export function useTotalBalance() {
  const { data: accounts = [], ...rest } = useAccounts();
  const totalBalance = accounts
    .filter((a) => a.type !== "credit_card")
    .reduce((sum, acc) => sum + Number(acc.balance), 0);
  return { ...rest, totalBalance };
}

// ============================================================
// ATUALIZAR CONTA
// ============================================================

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<Omit<Account, "user_id" | "created_at">> & { id: string }) => {
      const { data, error } = await supabase
        .from("accounts")
        .update(fields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

// ============================================================
// CRIAR CONTA
// ============================================================

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: CreateAccount) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...account, user_id: user.id })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// DELETAR CONTA
// ============================================================

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}