// ============================================================
// DASHBOARD — TELA PRINCIPAL (Fase 2 — dados reais)
// ============================================================
// Agora conectado ao Supabase via hooks.
// Substituímos os mocks por:
//   - useTotalBalance()      → saldo somado das contas
//   - useFinancialSummary()  → receitas e despesas do mês
//   - useTransactions()      → lista de transações reais
//   - useExpenseByCategory() → dados para o gráfico
// ============================================================

import { useState }                   from "react";
import { TrendingUp, TrendingDown, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate, formatMonthYear, hexToRgba } from "@/lib/utils";
import { useTotalBalance }             from "@/hooks/useAccounts";
import { useFinancialSummary }         from "@/hooks/useTransactions";
import { useTransactions }             from "@/hooks/useTransactions";
import { useExpenseByCategory }        from "@/hooks/useChartData";
import { ExpenseChart }                from "@/components/shared/ExpenseChart";

export function Dashboard() {
  // Mês visualizado — começa no mês atual, mas o usuário
  // pode navegar para meses anteriores
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ── DADOS DO SUPABASE ──────────────────────────────────
  const { totalBalance, isLoading: loadingBalance }    = useTotalBalance();
  const { summary, isLoading: loadingSummary }         = useFinancialSummary(currentMonth);
  const { data: transactions = [], isLoading: loadingTxs } = useTransactions(currentMonth);
  const { data: chartData, isLoading: loadingChart }   = useExpenseByCategory(currentMonth);

  // Mostra só as 5 mais recentes na lista do dashboard
  const recentTransactions = transactions.slice(0, 5);

  // Percentual de gastos vs receitas (para a barra de progresso)
  const spendingPercent = summary.monthlyIncome > 0
    ? Math.min((summary.monthlyExpense / summary.monthlyIncome) * 100, 100)
    : 0;

  // ── NAVEGAÇÃO DE MÊS ──────────────────────────────────
  const prevMonth = () => {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    // Não deixa avançar além do mês atual
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date()) setCurrentMonth(next);
  };
  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="px-4 py-5 space-y-4">

      {/* ── NAVEGADOR DE MÊS ──────────────────────────────
          Permite o usuário consultar meses anteriores     */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm active:bg-gray-50"
        >
          <ChevronLeft size={16} className="text-gray-500" />
        </button>

        <p className="text-sm font-semibold text-gray-700 capitalize">
          {formatMonthYear(currentMonth)}
        </p>

        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm active:bg-gray-50 disabled:opacity-30"
        >
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* ── CARD DE SALDO TOTAL ──────────────────────────── */}
      <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-xl">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
          Saldo total
        </p>

        {loadingBalance ? (
          <div className="h-10 w-40 bg-gray-700 rounded-xl animate-pulse mt-1" />
        ) : (
          <p className="text-4xl font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
        )}

        {/* Barra de progresso: gastos vs receitas */}
        <div className="mt-5 mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Gastos do mês</span>
            <span>{spendingPercent.toFixed(0)}% da receita</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${spendingPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARDS DE RECEITA E DESPESA ─────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-gray-500">Receitas</span>
          </div>
          {loadingSummary ? (
            <div className="h-6 w-24 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-lg font-bold text-gray-800 leading-none">
              {formatCurrency(summary.monthlyIncome)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">este mês</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
              <TrendingDown size={14} className="text-red-400" />
            </div>
            <span className="text-xs font-medium text-gray-500">Despesas</span>
          </div>
          {loadingSummary ? (
            <div className="h-6 w-24 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-lg font-bold text-gray-800 leading-none">
              {formatCurrency(summary.monthlyExpense)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">este mês</p>
        </div>
      </div>

      {/* ── GRÁFICO DE GASTOS POR CATEGORIA ────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Gastos por categoria
        </h2>

        {loadingChart ? (
          // Skeleton do gráfico enquanto carrega
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-40 h-40 rounded-full bg-gray-100 animate-pulse" />
            <div className="w-full space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <ExpenseChart
            data={chartData ?? []}
            totalExpense={summary.monthlyExpense}
          />
        )}
      </div>

      {/* ── ÚLTIMAS TRANSAÇÕES ───────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">
            Últimas transações
          </h2>
          <button className="flex items-center gap-1 text-xs text-emerald-500 font-medium active:opacity-70">
            Ver todas
            <ArrowRight size={12} />
          </button>
        </div>

        {loadingTxs ? (
          // Skeleton da lista enquanto carrega
          <ul className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </li>
            ))}
          </ul>
        ) : recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm text-gray-400">Nenhuma transação este mês</p>
            <p className="text-xs text-gray-300 mt-1">
              Toque no botão + para adicionar
            </p>
          </div>
        ) : (
          <ul>
            {recentTransactions.map((tx, index) => (
              <li
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors ${
                  index < recentTransactions.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(tx.category?.color ?? "#6b7280", 0.12) }}
                >
                  {tx.category?.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tx.category?.name} · {formatDate(tx.date)}
                  </p>
                </div>

                <span className={`text-sm font-semibold flex-shrink-0 ${
                  tx.type === "income" ? "text-emerald-500" : "text-gray-800"
                }`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
