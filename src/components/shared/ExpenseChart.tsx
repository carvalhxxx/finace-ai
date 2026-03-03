// ============================================================
// EXPENSE CHART — GRÁFICO DE DESPESAS POR CATEGORIA
// ============================================================

import { useState }          from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine
} from "recharts";
import { ChartCategory }     from "@/hooks/useChartData";
import { DailyBalance }      from "@/hooks/useChartData";
import { formatCurrency }    from "@/lib/utils";

interface ExpenseChartProps {
  data:         ChartCategory[];
  dailyBalance: DailyBalance[];
  totalExpense: number;
}

export function ExpenseChart({ data, dailyBalance, totalExpense }: ExpenseChartProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<"donut" | "line">("donut");
  const hasNegative  = dailyBalance.some((d) => d.balance < 0);
  const minBalance   = Math.min(...dailyBalance.map((d) => d.balance));
  const maxBalance   = Math.max(...dailyBalance.map((d) => d.balance));
  const zeroPercent  = hasNegative && maxBalance !== minBalance
    ? Math.round((maxBalance / (maxBalance - minBalance)) * 100) + "%"
    : "0%";

  // Sem dados — estado vazio
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm text-gray-400">Nenhuma despesa registrada este mês</p>
      </div>
    );
  }

  // Filtra dados do donut se uma categoria estiver selecionada
  const filteredData = activeCategory
    ? data.map((d) => ({
        ...d,
        // Esmaece categorias não selecionadas
        color: d.name === activeCategory ? d.color : `${d.color}40`,
      }))
    : data;

  const selectedItem = activeCategory ? data.find((d) => d.name === activeCategory) : null;

  return (
    <div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("donut")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "donut"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          Por categoria
        </button>
        <button
          onClick={() => setActiveTab("line")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "line"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          Evolução do saldo
        </button>
      </div>

      {/* ── GRÁFICO DONUT ─────────────────────────────────── */}
      {activeTab === "donut" && (
        <div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {filteredData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setActiveCategory(
                          activeCategory === entry.name ? null : entry.name
                        )
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => {
                    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
                    return [formatCurrency(Number.isFinite(n) ? n : 0), ""];
                  }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f3f4f6",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro do donut — muda se tiver categoria selecionada */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {selectedItem ? (
                <>
                  <span className="text-2xl mb-0.5">{selectedItem.icon}</span>
                  <p className="text-xs text-gray-400 font-medium leading-tight">{selectedItem.name}</p>
                  <p className="text-base font-bold text-gray-800 leading-tight">
                    {formatCurrency(selectedItem.value)}
                  </p>
                  <p className="text-[10px] text-gray-400">{selectedItem.percentage}%</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 font-medium">total</p>
                  <p className="text-lg font-bold text-gray-800 leading-tight">
                    {formatCurrency(totalExpense)}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Dica de interação */}
          <p className="text-center text-[10px] text-gray-300 mb-3 -mt-1">
            toque numa fatia para filtrar
          </p>

          {/* ── LEGENDA ───────────────────────────────────── */}
          <ul className="mt-1 space-y-2">
            {data.map((item) => {
              const isActive   = activeCategory === item.name;
              const isDimmed   = activeCategory !== null && !isActive;

              return (
                <li
                  key={item.name}
                  onClick={() => setActiveCategory(isActive ? null : item.name)}
                  className={`flex items-center gap-3 rounded-2xl p-2 -mx-2 transition-all cursor-pointer ${
                    isActive  ? "bg-gray-50"  : ""
                  } ${isDimmed ? "opacity-40" : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    {item.icon}
                  </div>

                  <span className="flex-1 text-sm text-gray-600 truncate">{item.name}</span>

                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-700">{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-gray-400">{item.percentage}%</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── GRÁFICO DE LINHA — EVOLUÇÃO DO SALDO ─────────── */}
      {activeTab === "line" && (
        <div>
          {dailyBalance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl mb-2">📈</span>
              <p className="text-sm text-gray-400">Nenhum dado disponível</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyBalance} margin={{ top: 5, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"          stopColor="#10b981" />
                      <stop offset={zeroPercent} stopColor="#10b981" />
                      <stop offset={zeroPercent} stopColor="#ef4444" />
                      <stop offset="100%"        stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    // Mostra só o dia (remove o /mês)
                    tickFormatter={(v) => v.split("/")[0]}
                    interval={4}
                  />
                  <YAxis hide />
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
                  {hasNegative && (
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1}
                      label={{ value: "R$ 0", position: "insideTopRight", fontSize: 9, fill: "#ef4444", dy: -4 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke={hasNegative ? "url(#lineColor)" : "#10b981"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const color = payload.balance < 0 ? "#ef4444" : "#10b981";
                      return <circle key={cx} cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />;
                    }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Mini resumo abaixo do gráfico de linha */}
              <div className="flex justify-between mt-3 px-1">
                <div>
                  <p className="text-[10px] text-gray-400">Pior dia</p>
                  <p className="text-xs font-semibold text-red-500">
                    {formatCurrency(Math.min(...dailyBalance.map((d) => d.balance)))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400">Saldo atual</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {formatCurrency(dailyBalance[dailyBalance.length - 1]?.balance ?? 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Melhor dia</p>
                  <p className="text-xs font-semibold text-emerald-500">
                    {formatCurrency(Math.max(...dailyBalance.map((d) => d.balance)))}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}