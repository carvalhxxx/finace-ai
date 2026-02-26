// ============================================================
// REPORTS — RELATÓRIOS
// ============================================================
// Placeholder da tela de relatórios.
// Na Fase 2 terá: gráfico de pizza por categoria,
// evolução mensal em linha, e filtros por período.
// ============================================================

export function Reports() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

      <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5">
        <span className="text-4xl">📊</span>
      </div>

      <h2 className="text-lg font-semibold text-gray-800">Relatórios</h2>
      <p className="text-sm text-gray-400 mt-2 max-w-xs">
        Gráficos de gastos por categoria e evolução mensal chegam na Fase 2.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-2">
        {["Gastos por categoria", "Evolução mensal", "Comparativo de meses"].map((item) => (
          <div key={item} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <span className="text-sm text-gray-400">{item}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
