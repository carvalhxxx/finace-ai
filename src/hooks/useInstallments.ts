// ============================================================
// useInstallments — HOOK DE PARCELAMENTOS
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase }            from "@/lib/supabase";
import { Installment, CreateInstallment } from "@/types";

const QUERY_KEY = ["installments"];

export function useInstallments() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Installment[]> => {
      const { data, error } = await supabase
        .from("installments")
        .select(`*, category:categories(*), account:accounts!account_id(*)`)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useActiveInstallments() {
  const { data: installments = [], ...rest } = useInstallments();
  const active = installments.filter((i) => i.paid_count < i.installment_count);
  return { ...rest, data: active };
}

export function useCreateInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installment: CreateInstallment) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const alreadyPaid    = installment.already_paid ?? 0;
      const remainingCount = installment.installment_count - alreadyPaid;

      if (remainingCount <= 0) throw new Error("Todas as parcelas já foram pagas.");

      const { already_paid: _, ...installmentData } = installment;

      const { data: parent, error: parentError } = await supabase
        .from("installments")
        .insert({ ...installmentData, user_id: user.id, paid_count: alreadyPaid })
        .select()
        .single();

      if (parentError) throw new Error(parentError.message);

      const isCard    = !!installment.credit_card_id;
      const startDate = new Date(`${installment.start_date}T12:00:00`);

      const transactions = Array.from({ length: remainingCount }, (_, index) => {
        const parcelDate = new Date(startDate);
        parcelDate.setMonth(parcelDate.getMonth() + index);
        const parcelNumber = alreadyPaid + index + 1;
        const dateStr = parcelDate.toISOString().split("T")[0];

        return {
          user_id:         user.id,
          account_id:      isCard ? null : installment.account_id,
          credit_card_id:  isCard ? installment.credit_card_id : null,
          category_id:     installment.category_id,
          installment_id:  parent.id,
          amount:          installment.installment_amount,
          type:            "expense" as const,
          description:     `${installment.description} (${parcelNumber}/${installment.installment_count})`,
          date:            dateStr,
          purchase_date:   isCard ? dateStr : null,
        };
      });

      const { error: txError } = await supabase
        .from("transactions")
        .insert(transactions);

      if (txError) {
        await supabase.from("installments").delete().eq("id", parent.id);
        throw new Error(txError.message);
      }

      return parent as Installment;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"], exact: false });
    },
  });
}

export function useCancelInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installmentId: string) => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("installment_id", installmentId)
        .gt("date", today);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

export function useSyncPaidCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const { data: installments } = await supabase
        .from("installments")
        .select("id")
        .eq("user_id", user.id);

      if (!installments?.length) return;

      await Promise.all(
        installments.map(async ({ id }) => {
          const { count } = await supabase
            .from("transactions")
            .select("*", { count: "exact", head: true })
            .eq("installment_id", id)
            .lte("date", today);

          if (count !== null) {
            await supabase
              .from("installments")
              .update({ paid_count: count })
              .eq("id", id);
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["accounts-with-balance"] });
    },
  });
}

export function remainingAmount(installment: Installment): number {
  return (installment.installment_count - installment.paid_count) * installment.installment_amount;
}

export function installmentEndDate(installment: Installment): string {
  const start = new Date(`${installment.start_date}T12:00:00`);
  start.setMonth(start.getMonth() + installment.installment_count - 1);
  return start.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}