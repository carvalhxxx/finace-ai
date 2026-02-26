// ============================================================
// useInstallments — HOOK DE PARCELAMENTOS
// ============================================================
// Gerencia compras parceladas.
//
//   useInstallments()        → lista todos os parcelamentos
//   useCreateInstallment()   → cria parcelamento + parcelas
//   useCancelInstallment()   → cancela parcelas futuras
//
// A lógica mais importante está no useCreateInstallment:
// ao criar um parcelamento de 12x, ele gera 12 transações
// automaticamente — uma para cada mês — todas de uma vez
// usando um único insert em batch no Supabase.
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase }            from "@/lib/supabase";
import { Installment, CreateInstallment } from "@/types";

const QUERY_KEY = ["installments"];

// ============================================================
// BUSCAR PARCELAMENTOS
// ============================================================

export function useInstallments() {
  return useQuery({
    queryKey: QUERY_KEY,

    queryFn: async (): Promise<Installment[]> => {
      const { data, error } = await supabase
        .from("installments")
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// PARCELAMENTOS ATIVOS
// ============================================================
// Filtra só os parcelamentos que ainda têm parcelas a pagar.

export function useActiveInstallments() {
  const { data: installments = [], ...rest } = useInstallments();

  const active = installments.filter(
    (i) => i.paid_count < i.installment_count
  );

  return { ...rest, data: active };
}

// ============================================================
// CRIAR PARCELAMENTO
// ============================================================
// Fluxo:
//   1. Insere o registro pai em installments
//   2. Gera N objetos de transação (uma por parcela)
//   3. Insere todas as transações em batch (um único insert)
//
// Exemplo: iPhone 16 — 12x de R$600 a partir de fev/2025
//   Parcela 1: R$600 em 01/02/2025
//   Parcela 2: R$600 em 01/03/2025
//   ...
//   Parcela 12: R$600 em 01/01/2026

export function useCreateInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installment: CreateInstallment) => {
      // Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // ── PASSO 1: cria o parcelamento pai ─────────────────
      const { data: parent, error: parentError } = await supabase
        .from("installments")
        .insert({ ...installment, user_id: user.id })
        .select()
        .single();

      if (parentError) throw new Error(parentError.message);

      // ── PASSO 2: gera as transações das parcelas ─────────
      const startDate = new Date(`${installment.start_date}T12:00:00`);

      // Array com uma transação por parcela
      const transactions = Array.from(
        { length: installment.installment_count },
        (_, index) => {
          // Calcula a data de cada parcela somando meses
          const parcelDate = new Date(startDate);
          parcelDate.setMonth(parcelDate.getMonth() + index);

          return {
            user_id:        user.id,
            account_id:     installment.account_id,
            category_id:    installment.category_id,
            installment_id: parent.id,
            amount:         installment.installment_amount,
            type:           "expense" as const,
            // Descrição com número da parcela: "iPhone 16 (1/12)"
            description:    `${installment.description} (${index + 1}/${installment.installment_count})`,
            date:           parcelDate.toISOString().split("T")[0],
          };
        }
      );

      // ── PASSO 3: insere todas as parcelas de uma vez ─────
      // Insert em batch é muito mais eficiente que N inserts
      // individuais — uma única requisição ao banco
      const { error: txError } = await supabase
        .from("transactions")
        .insert(transactions);

      if (txError) {
        // Se falhar, deleta o parcelamento pai para não ficar
        // um registro órfão sem parcelas
        await supabase.from("installments").delete().eq("id", parent.id);
        throw new Error(txError.message);
      }

      return parent as Installment;
    },

    onSuccess: () => {
      // Invalida tanto parcelamentos quanto transações
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ============================================================
// CANCELAR PARCELAS FUTURAS
// ============================================================
// Deleta apenas as transações futuras (data > hoje),
// mantendo as já pagas no histórico.
// Não deleta o registro pai — fica como histórico.

export function useCancelInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installmentId: string) => {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("installment_id", installmentId)
        .gt("date", today); // só deleta as futuras (greater than hoje)

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ============================================================
// SINCRONIZAR PAID_COUNT
// ============================================================
// Atualiza o paid_count de todos os parcelamentos ativos
// contando quantas parcelas já venceram (data <= hoje).
// Chamado ao abrir a tela de Relatórios.

export function useSyncPaidCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Busca todos os parcelamentos do usuário
      const { data: installments } = await supabase
        .from("installments")
        .select("id")
        .eq("user_id", user.id);

      if (!installments?.length) return;

      // Para cada parcelamento, conta as parcelas já vencidas
      await Promise.all(
        installments.map(async ({ id }) => {
          const { count } = await supabase
            .from("transactions")
            .select("*", { count: "exact", head: true })
            .eq("installment_id", id)
            .lte("date", today); // parcelas com data <= hoje

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
    },
  });
}

// Calcula o valor restante a pagar de um parcelamento
export function remainingAmount(installment: Installment): number {
  const remaining = installment.installment_count - installment.paid_count;
  return remaining * installment.installment_amount;
}

// Retorna o mês/ano de término do parcelamento
export function installmentEndDate(installment: Installment): string {
  const start = new Date(`${installment.start_date}T12:00:00`);
  start.setMonth(start.getMonth() + installment.installment_count - 1);
  return start.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}