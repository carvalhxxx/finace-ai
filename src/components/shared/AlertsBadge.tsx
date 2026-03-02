// ============================================================
// ALERTS BADGE — SINO DE NOTIFICAÇÕES
// ============================================================
// Mostra alertas de gastos E contas a pagar próximas do vencimento.
// ============================================================

import { useState, useRef, useEffect }     from "react";
import { Bell, X, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate }                     from "react-router-dom";
import { useTriggeredAlerts }              from "@/hooks/useAlerts";
import { useUpcomingBills, billStatus }    from "@/hooks/useBills";
import { formatCurrency, cn }             from "@/lib/utils";

export function AlertsBadge() {
  const triggered         = useTriggeredAlerts();
  const upcomingBills     = useUpcomingBills();
  const [open, setOpen]   = useState(false);
  const panelRef          = useRef<HTMLDivElement>(null);
  const navigate          = useNavigate();

  const totalAlerts = triggered.length + upcomingBills.length;
  const hasAlerts   = totalAlerts > 0;

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
    <div className="relative" ref={panelRef}>

      {/* Botão do sino */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center relative text-gray-500 active:text-emerald-500 transition-colors"
      >
        <Bell size={20} />
        {hasAlerts && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Painel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">
              Notificações {hasAlerts && <span className="ml-1 text-xs text-white bg-red-500 px-1.5 py-0.5 rounded-full">{totalAlerts}</span>}
            </h3>
            <button onClick={() => setOpen(false)} className="p-1 text-gray-400">
              <X size={16} />
            </button>
          </div>

          {!hasAlerts && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <TrendingUp size={22} className="text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tudo sob controle!</p>
              <p className="text-xs text-gray-400 mt-1">Nenhum alerta no momento.</p>
            </div>
          )}

          <ul className="divide-y divide-gray-50 max-h-96 overflow-y-auto">

            {/* ── CONTAS A PAGAR ─────────────────────── */}
            {upcomingBills.map((bill) => {
              const status = billStatus(bill);
              return (
                <li key={bill.id}
                  className="px-4 py-3 cursor-pointer active:bg-gray-50"
                  onClick={() => { navigate("/bills"); setOpen(false); }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bill.category?.icon ?? "🧾"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{bill.description}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(bill.amount)}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", status.bg, status.color)}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                </li>
              );
            })}

            {/* ── ALERTAS DE GASTOS ──────────────────── */}
            {triggered.map(({ alert, spent, percentage, overLimit }) => (
              <li key={alert.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{alert.category?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{alert.category?.name}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                    overLimit ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600"
                  )}>
                    {overLimit ? "Excedido" : "Atenção"}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Gasto: <strong className="text-gray-700">{formatCurrency(spent)}</strong></span>
                  <span>Limite: <strong className="text-gray-700">{formatCurrency(alert.limit_amount)}</strong></span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", overLimit ? "bg-red-400" : "bg-amber-400")}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className={cn("text-[10px] font-medium mt-1 text-right", overLimit ? "text-red-400" : "text-amber-500")}>
                  {percentage}% do limite
                </p>
              </li>
            ))}
          </ul>

          {triggered.some((t) => t.overLimit) && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-t border-red-100">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-500">
                Limite excedido em {triggered.filter((t) => t.overLimit).length} categoria{triggered.filter((t) => t.overLimit).length > 1 ? "s" : ""}.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}