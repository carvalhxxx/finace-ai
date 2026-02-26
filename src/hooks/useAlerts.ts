// ============================================================
// useAlerts — HOOK DE ALERTAS DE GASTOS
// ============================================================
// Gerencia os alertas e detecta quais foram disparados.
//
//   useAlerts()           → lista todos os alertas
//   useTriggeredAlerts()  → alertas que ultrapassaram o limite
//   useCreateAlert()      → cria novo alerta
//   useToggleAlert()      → ativa/desativa alerta
//   useDeleteAlert()      → deleta alerta
//
// Como funciona a detecção:
//   1. Buscamos os alertas ativos do usuário
//   2. Buscamos as transações do mês atual
//   3. Somamos os gastos por categoria
//   4. Comparamos com o limite de cada alerta
//   5. Retornamos os que ultrapassaram o limite
//
// Tudo isso em memória — sem queries extras ao banco.
// ============================================================

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Alert, CreateAlert } from "@/types";
import { useTransactions } from "./useTransactions";

const QUERY_KEY = ["alerts"];

// ============================================================
// BUSCAR ALERTAS
// ============================================================

export function useAlerts() {
  return useQuery({
    queryKey: QUERY_KEY,

    queryFn: async (): Promise<Alert[]> => {
      const { data, error } = await supabase
        .from("alerts")
        .select(`
          *,
          category:categories(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// ALERTAS DISPARADOS
// ============================================================
// Retorna os alertas cujo limite foi atingido ou ultrapassado
// no mês atual. Usado no Header para mostrar o badge.

export interface TriggeredAlert {
  alert:       Alert;
  spent:       number; // quanto foi gasto na categoria
  percentage:  number; // % em relação ao limite
  overLimit:   boolean; // true se ultrapassou, false se está próximo (>80%)
}

export function useTriggeredAlerts() {
  const { data: alerts = [] }       = useAlerts();
  const { data: transactions = [] } = useTransactions(); // mês atual

  const triggered = useMemo(() => {
    // Filtra só alertas ativos
    const activeAlerts = alerts.filter((a) => a.active);

    // Soma gastos por categoria no mês
    const spentByCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const current = spentByCategory.get(tx.category_id) ?? 0;
      spentByCategory.set(tx.category_id, current + tx.amount);
    }

    // Verifica cada alerta ativo
    const result: TriggeredAlert[] = [];
    for (const alert of activeAlerts) {
      const spent      = spentByCategory.get(alert.category_id) ?? 0;
      const percentage = (spent / alert.limit_amount) * 100;

      // Dispara se passou de 80% do limite
      if (percentage >= 80) {
        result.push({
          alert,
          spent,
          percentage: Math.round(percentage),
          overLimit:  percentage >= 100,
        });
      }
    }

    // Ordena: ultrapassados primeiro, depois por porcentagem
    return result.sort((a, b) => {
      if (a.overLimit !== b.overLimit) return a.overLimit ? -1 : 1;
      return b.percentage - a.percentage;
    });
  }, [alerts, transactions]);

  return triggered;
}

// ============================================================
// CRIAR ALERTA
// ============================================================

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: CreateAlert) => {
      const { data, error } = await supabase
        .from("alerts")
        .insert(alert)
        .select(`*, category:categories(*)`)
        .single();

      if (error) throw new Error(error.message);
      return data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// ATIVAR / DESATIVAR ALERTA
// ============================================================
// Toggle simples — inverte o campo active do alerta.

export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("alerts")
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
// DELETAR ALERTA
// ============================================================

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
