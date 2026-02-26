// ============================================================
// ALERTS BADGE — SINO DE NOTIFICAÇÕES
// ============================================================
// Substitui o sino estático do Header por um sino funcional.
//
// Comportamento:
// - Badge vermelho aparece quando há alertas disparados
// - Ao clicar, abre um painel com os alertas do mês
// - Cada alerta mostra categoria, valor gasto vs limite
//   e uma barra de progresso colorida
//
// Estados visuais da barra:
//   amarelo  → entre 80% e 99% do limite (atenção)
//   vermelho → 100% ou mais (ultrapassado)
// ============================================================

import { useState, useRef, useEffect }     from "react";
import { Bell, X, AlertTriangle, TrendingUp } from "lucide-react";
import { useTriggeredAlerts }               from "@/hooks/useAlerts";
import { formatCurrency, cn }               from "@/lib/utils";

export function AlertsBadge() {
  const triggered         = useTriggeredAlerts();
  const [open, setOpen]   = useState(false);
  const panelRef          = useRef<HTMLDivElement>(null);

  const hasAlerts = triggered.length > 0;

  // Fecha o painel ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return ()  => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    // relative: ancora o painel absoluto abaixo do botão
    <div className="relative" ref={panelRef}>

      {/* ── BOTÃO DO SINO ──────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center relative text-gray-500 active:text-emerald-500 transition-colors"
        aria-label={`Notificações${hasAlerts ? ` (${triggered.length})` : ""}`}
      >
        <Bell size={20} />

        {/* Badge — só aparece se houver alertas disparados */}
        {hasAlerts && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* ── PAINEL DE NOTIFICAÇÕES ──────────────────────── */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

          {/* Cabeçalho do painel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Alertas do mês</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-gray-400 active:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── SEM ALERTAS ──────────────────────────────── */}
          {triggered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <TrendingUp size={22} className="text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tudo sob controle!</p>
              <p className="text-xs text-gray-400 mt-1">
                Nenhum alerta disparado este mês.
              </p>
            </div>
          )}

          {/* ── LISTA DE ALERTAS DISPARADOS ──────────────── */}
          {triggered.length > 0 && (
            <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {triggered.map(({ alert, spent, percentage, overLimit }) => (
                <li key={alert.id} className="px-4 py-3">

                  {/* Ícone + nome da categoria + status */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{alert.category?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {alert.category?.name}
                      </p>
                    </div>
                    {/* Badge de status */}
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                      overLimit
                        ? "bg-red-100 text-red-500"
                        : "bg-amber-100 text-amber-600"
                    )}>
                      {overLimit ? "Limite excedido" : "Atenção"}
                    </span>
                  </div>

                  {/* Valores: gasto vs limite */}
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Gasto: <strong className="text-gray-700">{formatCurrency(spent)}</strong></span>
                    <span>Limite: <strong className="text-gray-700">{formatCurrency(alert.limit_amount)}</strong></span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        overLimit ? "bg-red-400" : "bg-amber-400"
                      )}
                      // Limita visualmente a 100% mesmo se ultrapassar
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Porcentagem */}
                  <p className={cn(
                    "text-[10px] font-medium mt-1 text-right",
                    overLimit ? "text-red-400" : "text-amber-500"
                  )}>
                    {percentage}% do limite
                  </p>

                </li>
              ))}
            </ul>
          )}

          {/* Rodapé com aviso geral */}
          {triggered.some((t) => t.overLimit) && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-t border-red-100">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-500">
                Você ultrapassou o limite em {triggered.filter((t) => t.overLimit).length} {triggered.filter((t) => t.overLimit).length === 1 ? "categoria" : "categorias"} este mês.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
