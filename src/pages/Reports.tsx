// ============================================================
// REPORTS — TELA DE RELATÓRIOS
// ============================================================
// Duas sub-abas:
//
//   Visão Geral    → gráfico de linha com evolução mensal
//                    receitas vs despesas mês a mês
//
//   Parcelamentos  → lista de compras parceladas ativas
//                    com progresso e opção de cancelar
// ============================================================

import { useState }                    from "react";
import { BarChart2, CreditCard, Trash2, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useDailyBalance }             from "@/hooks/useChartData";
import { useActiveInstallments, useCancelInstallment, installmentEndDate, remainingAmount } from "@/hooks/useInstallments";
import { formatCurrency, cn }          from "@/lib/utils";

type Tab = "overview" | "installments";

export function Reports() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="px-4 py-5 space-y-4">

      {/* ── SUB-ABAS ───────────────────────────────────── */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === "overview"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-400"
          )}
        >
          <BarChart2 size={15} />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("installments")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === "installments"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-400"
          )}
        >
          <CreditCard size={15} />
          Parcelamentos
        </button>
      </div>

      {/* ── CONTEÚDO DA ABA ATIVA ──────────────────────── */}
      {activeTab === "overview"      && <OverviewTab />}
      {activeTab === "installments"  && <InstallmentsTab />}

    </div>
  );
}

// ============================================================
// ABA: VISÃO GERAL
// ============================================================
// Gráfico de linha mostrando receitas e despesas dia a dia
// no mês atual. Usa o hook useDailyBalance que já temos.

function OverviewTab() {
  const { data: dailyData = [], isLoading } = useDailyBalance();

  // Mostra só os dias que já aconteceram para não poluir o gráfico
  const today    = new Date().getDate();
  const filtered = dailyData.slice(0, today);

  return (
    <div className="space-y-4">

      {/* Gráfico de linha */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Evolução do mês
        </h2>

        {isLoading ? (
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-3xl mb-2">📈</span>
            <p className="text-sm text-gray-400">Nenhuma transação este mês ainda</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filtered} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                // Mostra só alguns dias para não poluir
                interval={Math.floor(filtered.length / 5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number | string | undefined) => {
                  const n =
                    typeof value === "number"
                      ? value
                      : typeof value === "string"
                        ? Number(value)
                        : 0;

                  return [formatCurrency(Number.isFinite(n) ? n : 0), ""];
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #f3f4f6",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Receitas"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Despesas"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}

// ============================================================
// ABA: PARCELAMENTOS
// ============================================================
// Lista os parcelamentos ativos com progresso e botão
// para cancelar as parcelas futuras.

function InstallmentsTab() {
  const { data: installments = [], isLoading } = useActiveInstallments();
  const cancelInstallment = useCancelInstallment();

  // Controla qual parcelamento está com confirmação de cancelar aberta
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    await cancelInstallment.mutateAsync(id);
    setConfirmCancel(null);
  };

  // ── LOADING ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  // ── LISTA VAZIA ──────────────────────────────────────
  if (installments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-4">
          <CreditCard size={36} className="text-blue-300" />
        </div>
        <h2 className="text-base font-semibold text-gray-700">
          Nenhum parcelamento ativo
        </h2>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">
          Ao adicionar uma despesa parcelada, ela aparecerá aqui.
        </p>
      </div>
    );
  }

  // ── CARDS ────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Resumo total a pagar */}
      <div className="bg-blue-500 text-white rounded-2xl p-4 shadow-lg shadow-blue-500/20">
        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">
          Total restante a pagar
        </p>
        <p className="text-3xl font-bold tracking-tight">
          {formatCurrency(
            installments.reduce((sum, i) => sum + remainingAmount(i), 0)
          )}
        </p>
        <p className="text-blue-200 text-xs mt-1">
          em {installments.length} {installments.length === 1 ? "parcelamento" : "parcelamentos"} ativos
        </p>
      </div>

      {/* Lista de parcelamentos */}
      {installments.map((installment) => {
        const progress  = (installment.paid_count / installment.installment_count) * 100;
        const remaining = installment.installment_count - installment.paid_count;
        const isConfirming = confirmCancel === installment.id;

        return (
          <div
            key={installment.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-4">

              {/* Cabeçalho: ícone, nome, botão cancelar */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Ícone da categoria */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${installment.category?.color}18` }}
                  >
                    {installment.category?.icon ?? "💳"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {installment.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {installment.account?.name} · até {installmentEndDate(installment)}
                    </p>
                  </div>
                </div>

                {/* Botão cancelar */}
                <button
                  onClick={() => setConfirmCancel(isConfirming ? null : installment.id)}
                  className="p-1.5 text-gray-300 active:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Valores */}
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-blue-600">
                  {formatCurrency(installment.installment_amount)}/mês
                </span>
                <span className="text-xs text-gray-400">
                  {remaining} de {installment.installment_count} parcelas restantes
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Porcentagem paga */}
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{installment.paid_count} pagas</span>
                <span>Total: {formatCurrency(installment.total_amount)}</span>
              </div>
            </div>

            {/* Confirmação de cancelamento */}
            {isConfirming && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-red-50">
                <p className="text-xs text-red-600 mb-3">
                  Cancelar as <strong>{remaining} parcelas futuras</strong>? As já pagas serão mantidas no histórico.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmCancel(null)}
                    className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-medium"
                  >
                    Manter
                  </button>
                  <button
                    onClick={() => handleCancel(installment.id)}
                    disabled={cancelInstallment.isPending}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-medium disabled:opacity-60"
                  >
                    {cancelInstallment.isPending
                      ? <Loader2 size={14} className="animate-spin mx-auto" />
                      : "Cancelar parcelas"
                    }
                  </button>
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
