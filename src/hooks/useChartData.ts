// ============================================================
// useChartData — HOOK DE DADOS PARA GRÁFICOS
// ============================================================
// Transforma as transações brutas em estruturas prontas
// para o Recharts renderizar.
//
// Não faz nenhuma requisição ao banco — apenas processa
// os dados que useTransactions() já trouxe em cache.
//
// Retorna:
//   expenseByCategory → gastos agrupados por categoria
//                        usado no gráfico de pizza
//   dailyBalance      → evolução do saldo dia a dia
//                        usado no gráfico de linha (Fase 3)
// ============================================================

import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { Transaction } from "@/types";

// Formato esperado pelo Recharts para o gráfico de pizza
export interface ChartCategory {
  name:       string;
  value:      number; // total gasto
  color:      string;
  icon:       string;
  percentage: number; // % em relação ao total de despesas
}

// Formato para o gráfico de linha (saldo diário)
export interface DailyBalance {
  date:    string; // "26/02"
  income:  number;
  expense: number;
  balance: number;
}

// ============================================================
// GASTOS POR CATEGORIA
// ============================================================

export function useExpenseByCategory(month?: Date) {
  const { data: transactions = [], isLoading, error } = useTransactions(month);

  // useMemo: só recalcula quando transactions mudar
  // Evita reprocessar todos os dados em cada re-render
  const data = useMemo(() => {
    return groupByCategory(transactions);
  }, [transactions]);

  return { data, isLoading, error };
}

// ============================================================
// SALDO DIÁRIO
// ============================================================

export function useDailyBalance(month?: Date) {
  const { data: transactions = [], isLoading, error } = useTransactions(month);

  const data = useMemo(() => {
    return buildDailyBalance(transactions, month ?? new Date());
  }, [transactions, month]);

  return { data, isLoading, error };
}

// ============================================================
// FUNÇÕES AUXILIARES (lógica pura, sem hooks)
// ============================================================

function groupByCategory(transactions: Transaction[]): ChartCategory[] {
  // 1. Filtra só despesas
  const expenses = transactions.filter((tx) => tx.type === "expense");

  // 2. Soma por categoria usando um Map
  //    Map<categoryId, { total, category }>
  const map = new Map<string, { total: number; tx: Transaction }>();

  for (const tx of expenses) {
    const existing = map.get(tx.category_id);
    if (existing) {
      existing.total += tx.amount;
    } else {
      map.set(tx.category_id, { total: tx.amount, tx });
    }
  }

  // 3. Total geral de despesas (para calcular porcentagem)
  const totalExpenses = Array.from(map.values())
    .reduce((sum, { total }) => sum + total, 0);

  // 4. Converte para array e ordena do maior para o menor
  return Array.from(map.values())
    .map(({ total, tx }) => ({
      name:       tx.category?.name  ?? "Outros",
      color:      tx.category?.color ?? "#6b7280",
      icon:       tx.category?.icon  ?? "📦",
      value:      total,
      percentage: totalExpenses > 0
        ? Math.round((total / totalExpenses) * 100)
        : 0,
    }))
    .sort((a, b) => b.value - a.value); // maior primeiro
}

function buildDailyBalance(transactions: Transaction[], month: Date): DailyBalance[] {
  // Quantos dias tem o mês
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();

  // Cria um registro para cada dia do mês
  const days: DailyBalance[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      date:    `${String(day).padStart(2, "0")}/${String(month.getMonth() + 1).padStart(2, "0")}`,
      income:  0,
      expense: 0,
      balance: 0,
    };
  });

  // Distribui cada transação no dia correspondente
  for (const tx of transactions) {
    const day = new Date(`${tx.date}T12:00:00`).getDate();
    const index = day - 1;
    if (index >= 0 && index < days.length) {
      if (tx.type === "income")  days[index].income  += tx.amount;
      if (tx.type === "expense") days[index].expense += tx.amount;
    }
  }

  // Calcula o saldo acumulado dia a dia
  let accumulated = 0;
  for (const day of days) {
    accumulated += day.income - day.expense;
    day.balance = accumulated;
  }

  return days;
}
