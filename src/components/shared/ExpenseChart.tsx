// ============================================================
// EXPENSE CHART — GRÁFICO DE DESPESAS POR CATEGORIA
// ============================================================
// Gráfico de pizza (donut) mostrando quanto foi gasto
// em cada categoria no mês.
//
// Biblioteca: Recharts
// Tipo: PieChart com innerRadius (donut) — mais moderno
//       que o pizza sólido e deixa espaço para o total
//       no centro.
//
// Estrutura visual:
//
//        [  gráfico donut  ]
//           total no centro
//
//   🛒 Alimentação   R$234  34%
//   🚗 Transporte    R$89   13%
//   🎬 Lazer         R$55    8%
//   ...
// ============================================================

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCategory } from "@/hooks/useChartData";
import { formatCurrency } from "@/lib/utils";

interface ExpenseChartProps {
  data:         ChartCategory[];
  totalExpense: number;
}

export function ExpenseChart({ data, totalExpense }: ExpenseChartProps) {
  // Sem dados — estado vazio
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm text-gray-400">
          Nenhuma despesa registrada este mês
        </p>
      </div>
    );
  }

  return (
    <div>

      {/* ── GRÁFICO DONUT ──────────────────────────────────── */}
      <div className="relative">
        {/* ResponsiveContainer: adapta o gráfico à largura do pai */}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"          // centro horizontal
              cy="50%"          // centro vertical
              innerRadius={70}  // buraco interno = donut
              outerRadius={100} // raio externo
              paddingAngle={2}  // espaço entre fatias
              dataKey="value"
              strokeWidth={0}   // sem borda branca entre fatias
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>

            {/* Tooltip ao tocar numa fatia */}
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), ""]}
              contentStyle={{
                borderRadius: "12px",
                border:       "1px solid #f3f4f6",
                fontSize:     "12px",
                boxShadow:    "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total no centro do donut — posicionado em cima do gráfico */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-400 font-medium">total</p>
          <p className="text-lg font-bold text-gray-800 leading-tight">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* ── LEGENDA PERSONALIZADA ──────────────────────────── */}
      {/* A legenda padrão do Recharts é feia — fazemos a nossa */}
      <ul className="mt-2 space-y-2">
        {data.map((item) => (
          <li key={item.name} className="flex items-center gap-3">

            {/* Ícone com cor de fundo da categoria */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: `${item.color}20` }}
            >
              {item.icon}
            </div>

            {/* Nome da categoria */}
            <span className="flex-1 text-sm text-gray-600 truncate">
              {item.name}
            </span>

            {/* Barra de progresso proporcional */}
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width:           `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Valor e porcentagem */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-gray-700">
                {formatCurrency(item.value)}
              </p>
              <p className="text-[10px] text-gray-400">{item.percentage}%</p>
            </div>

          </li>
        ))}
      </ul>

    </div>
  );
}
