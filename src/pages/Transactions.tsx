// ============================================================
// TRANSACTIONS — LISTA COMPLETA DE TRANSAÇÕES
// ============================================================
// Funcionalidades:
//   - Lista todas as transações do mês selecionado
//   - Filtro por tipo: Todas / Receitas / Despesas
//   - Busca por descrição
//   - Swipe para esquerda → botão deletar aparece
//   - Navegação entre meses
// ============================================================

import { useState, useRef }          from "react";
import { useNavigate }                from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Trash2, Loader2 } from "lucide-react";
import { useTransactions, useDeleteTransaction, useLatestTransactionMonth } from "@/hooks/useTransactions";
import { EditTransactionForm }        from "@/components/shared/EditTransactionForm";
import { formatCurrency, formatDate, formatMonthYear, hexToRgba, cn } from "@/lib/utils";
import { Transaction }                from "@/types";

type Filter = "all" | "income" | "expense";

export function Transactions() {
  const navigate = useNavigate();

  // ── ESTADOS ─────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter]             = useState<Filter>("all");
  const [search, setSearch]             = useState("");
  const [editing, setEditing]           = useState<Transaction | null>(null);

  // ── DADOS ───────────────────────────────────────────────
  const { data: transactions = [], isLoading } = useTransactions(currentMonth);
  const deleteTransaction = useDeleteTransaction();
  const { data: latestMonth } = useLatestTransactionMonth();

  // ── FILTROS ─────────────────────────────────────────────
  const filtered = transactions.filter((tx) => {
    const matchType   = filter === "all" || tx.type === filter;
    const matchSearch = !search || tx.description.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Agrupa transações por data para exibir separadores
  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const date = tx.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});

  // Ordena as datas do mais recente para o mais antigo
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // ── NAVEGAÇÃO DE MÊS ────────────────────────────────────
  const prevMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const maxMonth   = latestMonth ?? new Date();
  const isMaxMonth =
    currentMonth.getMonth()    === maxMonth.getMonth() &&
    currentMonth.getFullYear() === maxMonth.getFullYear();

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">

      {/* ── BARRA FIXA DE FILTROS ──────────────────────── */}
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-3 space-y-3">

        {/* Navegador de mês */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm active:bg-gray-50">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <p className="text-sm font-semibold text-gray-700 capitalize">
            {formatMonthYear(currentMonth)}
          </p>
          <button onClick={nextMonth} disabled={isMaxMonth} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm active:bg-gray-50 disabled:opacity-30">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        {/* Filtro por tipo */}
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
          {(["all", "expense", "income"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                filter === f ? "bg-gray-900 text-white shadow-sm" : "text-gray-400"
              )}
            >
              {f === "all" ? "Todas" : f === "expense" ? "💸 Despesas" : "💰 Receitas"}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTA ─────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-6 space-y-4">

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2 pt-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Lista vazia */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm font-medium text-gray-600">
              {search ? "Nenhuma transação encontrada" : "Nenhuma transação este mês"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Tente outro termo de busca" : "Toque no + para adicionar"}
            </p>
          </div>
        )}

        {/* Transações agrupadas por data */}
        {!isLoading && sortedDates.map((date) => (
          <div key={date}>

            {/* Separador de data */}
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-gray-400 capitalize">
                {formatDateLabel(date)}
              </p>
              <div className="flex-1 h-px bg-gray-100" />
              <p className="text-xs text-gray-400">
                {formatDayTotal(grouped[date])}
              </p>
            </div>

            {/* Itens do grupo */}
            <div className="space-y-1.5">
              {grouped[date].map((tx) => (
                <SwipeableTransaction
                  key={tx.id}
                  tx={tx}
                  onDelete={() => deleteTransaction.mutate(tx.id)}
                  onEdit={() => setEditing(tx)}
                  isDeleting={deleteTransaction.isPending}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM SHEET: EDITAR TRANSAÇÃO ────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "92vh", touchAction: "pan-y" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <button onClick={() => setEditing(null)} className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200">✕</button>
            </div>
            <div className="overflow-y-auto px-6 pb-8 pt-2">
              <EditTransactionForm
                transaction={editing}
                onClose={() => setEditing(null)}
                onSuccess={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SWIPEABLE TRANSACTION — ITEM COM SWIPE PARA DELETAR
// ============================================================

interface SwipeableTransactionProps {
  tx:         Transaction;
  onDelete:   () => void;
  onEdit:     () => void;
  isDeleting: boolean;
}

function SwipeableTransaction({ tx, onDelete, onEdit, isDeleting }: SwipeableTransactionProps) {
  const [offset, setOffset]       = useState(0);  // quanto deslocou (px)
  const [swiped, setSwiped]       = useState(false); // se está com o botão visível
  const touchStartX               = useRef<number>(0);
  const SWIPE_THRESHOLD           = 60; // px mínimo para ativar

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    // Só permite arrastar para a esquerda (diff positivo)
    if (diff > 0) setOffset(Math.min(diff, 72));
  };

  const handleTouchEnd = () => {
    if (offset >= SWIPE_THRESHOLD) {
      // Ativou o swipe — trava no botão visível
      setOffset(72);
      setSwiped(true);
    } else {
      // Não chegou no threshold — volta para posição original
      setOffset(0);
      setSwiped(false);
    }
  };

  const handleClose = () => {
    setOffset(0);
    setSwiped(false);
  };

  return (
    // Container relativo para o botão deletar ficar por baixo
    <div className="relative rounded-2xl overflow-hidden">

      {/* Botão deletar — fica atrás do card */}
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-red-500 rounded-2xl">
        {isDeleting ? (
          <Loader2 size={18} className="text-white animate-spin" />
        ) : (
          <button onClick={onDelete} className="w-full h-full flex items-center justify-center">
            <Trash2 size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* Card da transação — desliza sobre o botão */}
      <div
        className="bg-white border border-gray-100 rounded-2xl flex items-center gap-3 px-4 py-3 transition-transform duration-200 active:bg-gray-50"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? handleClose : onEdit}
      >
        {/* Ícone da categoria */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: hexToRgba(tx.category?.color ?? "#6b7280", 0.12) }}
        >
          {tx.category?.icon}
        </div>

        {/* Descrição */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
            {tx.installment_id && (
              <span className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-500">PARC</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{tx.category?.name} · {tx.account?.name}</p>
        </div>

        {/* Valor */}
        <span className={cn("text-sm font-semibold flex-shrink-0", tx.type === "income" ? "text-emerald-500" : "text-gray-800")}>
          {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

// Formata a data do separador: "Hoje", "Ontem" ou "26 fev"
function formatDateLabel(dateStr: string): string {
  const date  = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0])     return "Hoje";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Ontem";

  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

// Calcula o saldo líquido do grupo (receitas - despesas)
function formatDayTotal(transactions: Transaction[]): string {
  const net = transactions.reduce((sum, tx) => {
    return tx.type === "income" ? sum + tx.amount : sum - tx.amount;
  }, 0);

  const prefix = net >= 0 ? "+" : "";
  return `${prefix}${formatCurrency(Math.abs(net))}`;
}