// ============================================================
// useBills — HOOK DE CONTAS A PAGAR
// ============================================================
//
//   useBills()        → lista todas as contas
//   useUpcomingBills() → contas pendentes próximas (para o sino)
//   useCreateBill()   → cria nova conta a pagar
//   usePayBill()      → marca como paga e cria transação
//   useDeleteBill()   → remove a conta
//
// Fluxo do usePayBill:
//   1. Marca a bill como paid = true, paid_at = hoje
//   2. Cria uma transação de despesa na conta bancária
//   3. Invalida bills + transactions + accounts-with-balance
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase }         from "@/lib/supabase";
import { Bill, CreateBill } from "@/types";

const QUERY_KEY = ["bills"];

// ============================================================
// BUSCAR TODAS AS CONTAS
// ============================================================

export function useBills() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Bill[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select(`*, category:categories(*), account:accounts!account_id(*)`)
        .order("due_date", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CONTAS PRÓXIMAS DO VENCIMENTO (para o sino de alertas)
// ============================================================
// Retorna contas pendentes que vencem nos próximos 3 dias
// ou que já venceram e não foram pagas.

export function useUpcomingBills() {
  const { data: bills = [] } = useBills();

  const today   = new Date();
  today.setHours(0, 0, 0, 0);

  const in3days = new Date(today);
  in3days.setDate(today.getDate() + 3);

  return bills.filter((bill) => {
    if (bill.paid) return false;
    const due = new Date(`${bill.due_date}T12:00:00`);
    return due <= in3days; // vence em até 3 dias ou já venceu
  });
}

// ============================================================
// CRIAR CONTA A PAGAR
// ============================================================

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: CreateBill) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      const { data, error } = await supabase
        .from("bills")
        .insert({ ...bill, user_id: user.id })
        .select(`*, category:categories(*), account:accounts!account_id(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// PAGAR CONTA
// ============================================================
// Marca como paga E cria a transação de despesa na conta,
// descontando do saldo automaticamente.

export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bill, payDate }: { bill: Bill; payDate: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      // ── PASSO 1: marca a bill como paga ──────────────────
      const { error: billError } = await supabase
        .from("bills")
        .update({ paid: true, paid_at: payDate })
        .eq("id", bill.id);

      if (billError) throw new Error(billError.message);

      // ── PASSO 2: cria a transação de despesa ─────────────
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id:     user.id,
          account_id:  bill.account_id,
          category_id: bill.category_id,
          description: bill.description,
          amount:      bill.amount,
          type:        "expense",
          date:        payDate,
        });

      if (txError) {
        // Rollback: desmarca como paga se a transação falhar
        await supabase
          .from("bills")
          .update({ paid: false, paid_at: null })
          .eq("id", bill.id);
        throw new Error(txError.message);
      }
    },

    onSuccess: () => {
      // exact: false invalida TODAS as queries que começam com
      // ["transactions"] independente dos filtros de data em cache
      queryClient.invalidateQueries({ queryKey: ["transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

// ============================================================
// DESMARCAR COMO PAGA
// ============================================================
// Remove o pagamento — deleta a transação gerada e volta
// a bill para pendente.

export function useUnpayBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Bill) => {
      // Deleta a transação gerada no mesmo dia do pagamento
      await supabase
        .from("transactions")
        .delete()
        .eq("account_id",  bill.account_id)
        .eq("description", bill.description)
        .eq("amount",      bill.amount)
        .eq("date",        bill.paid_at!);

      // Volta bill para pendente
      const { error } = await supabase
        .from("bills")
        .update({ paid: false, paid_at: null })
        .eq("id", bill.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

// ============================================================
// DELETAR CONTA
// ============================================================

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bills")
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
// UTILITÁRIOS
// ============================================================

// Retorna o status da bill com cor e label
export function billStatus(bill: Bill): {
  label: string;
  color: string;
  bg:    string;
  icon:  string;
} {
  if (bill.paid) return {
    label: "Paga",
    color: "text-emerald-600",
    bg:    "bg-emerald-50",
    icon:  "✅",
  };

  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  const due    = new Date(`${bill.due_date}T12:00:00`);
  const diff   = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return {
    label: `Vencida há ${Math.abs(diff)}d`,
    color: "text-red-600",
    bg:    "bg-red-50",
    icon:  "⚠️",
  };

  if (diff === 0) return {
    label: "Vence hoje",
    color: "text-orange-600",
    bg:    "bg-orange-50",
    icon:  "🔔",
  };

  if (diff <= 3) return {
    label: `Vence em ${diff}d`,
    color: "text-amber-600",
    bg:    "bg-amber-50",
    icon:  "⏰",
  };

  return {
    label: `Vence em ${diff}d`,
    color: "text-gray-500",
    bg:    "bg-gray-50",
    icon:  "📋",
  };
}