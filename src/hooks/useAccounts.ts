// ============================================================
// useAccounts — HOOK DE CONTAS BANCÁRIAS
// ============================================================
// Gerencia as contas do usuário (Nubank, Carteira, etc).
//
//   useAccounts()       → lista todas as contas
//   useCreateAccount()  → cria nova conta
//   useDeleteAccount()  → deleta conta por id
//
// As contas são necessárias em vários lugares:
//   - Formulário de transação (selecionar a conta)
//   - Dashboard (saldo total = soma de todas as contas)
//   - Tela de perfil (gerenciar contas)
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
        .order("created_at", { ascending: true }); // mais antigas primeiro

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CONTAS COM SALDO DINÂMICO
// ============================================================
// Retorna cada conta com o saldo ajustado pelas transações.
//
// accumulates: true  → saldo = inicial + TODAS as transações
// accumulates: false → saldo = inicial + transações do MÊS ATUAL
//                      (zera a cada mês — ex: VR que não acumula)

export function useAccountsWithBalance() {
  const { data: accounts = [], isLoading } = useAccounts();

  return useQuery({
    queryKey: ["accounts-with-balance"],
    enabled:  accounts.length > 0,

    queryFn: async () => {
      const now       = new Date();
      const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split("T")[0];
      const lastDay   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split("T")[0];

      // Busca todas as transações de todos os tempos
      const { data: allTx, error } = await supabase
        .from("transactions")
        .select("account_id, amount, type, date");

      if (error) throw new Error(error.message);

      return accounts.map((acc) => {
        const txs = (allTx ?? []).filter((tx) => tx.account_id === acc.id);

        // Para contas que não acumulam, só considera transações do mês atual
        const relevant = acc.accumulates
          ? txs
          : txs.filter((tx) => tx.date >= firstDay && tx.date <= lastDay);

        // Saldo = balance inicial + receitas - despesas
        const dynamic = relevant.reduce((sum, tx) =>
          tx.type === "income" ? sum + tx.amount : sum - tx.amount, 0
        );

        return {
          ...acc,
          // Para contas que não acumulam: só o dinâmico do mês
          // Para contas que acumulam: saldo inicial + todo o histórico
          balance: acc.accumulates
            ? acc.balance + dynamic
            : dynamic,
        };
      });
    },
  });
}

// ============================================================
// SALDO TOTAL
// ============================================================
// Soma o saldo de todas as contas do usuário.
// Reutiliza useAccounts() — sem query extra ao banco.
//
// Exemplo: Nubank (R$1.200) + Carteira (R$350) = R$1.550

export function useTotalBalance() {
  const { data: accounts = [], ...rest } = useAccounts();

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

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
// Atenção: deletar uma conta também deleta todas as
// transações ligadas a ela (ON DELETE CASCADE no banco).
// O componente que chamar isso deve confirmar com o usuário.

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
      // Invalida contas E transações, pois as transações
      // da conta deletada também sumirão do banco
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}