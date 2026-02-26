// ============================================================
// TRANSACTION FORM — FORMULÁRIO DE NOVA TRANSAÇÃO
// ============================================================
// Formulário completo para registrar receitas e despesas.
// Renderizado dentro do bottom sheet do AppShell.
//
// Campos:
//   - Tipo: Despesa / Receita (alterna as categorias)
//   - Valor: teclado numérico amigável
//   - Descrição: texto livre
//   - Categoria: grade de ícones filtrada pelo tipo
//   - Conta: lista das contas do usuário
//   - Data: input de data (padrão = hoje)
//
// Fluxo:
//   usuário preenche → submit → useCreateTransaction()
//   → onSuccess: fecha o form e mostra feedback
// ============================================================

import { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { cn, formatCurrency } from "@/lib/utils";
import { TransactionType, CategoryType } from "@/types";

interface TransactionFormProps {
  onClose: () => void; // chamado após sucesso ou cancelamento
}

export function TransactionForm({ onClose }: TransactionFormProps) {
  const createTransaction = useCreateTransaction();

  // ── ESTADOS DO FORMULÁRIO ────────────────────────────────
  const [type, setType]               = useState<CategoryType>("expense");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId]   = useState("");
  const [accountId, setAccountId]     = useState("");
  const [date, setDate]               = useState(
    new Date().toISOString().split("T")[0] // hoje no formato "YYYY-MM-DD"
  );
  const [error, setError] = useState<string | null>(null);

  // ── DADOS DOS HOOKS ──────────────────────────────────────
  const { data: categories = [], isLoading: loadingCats } = useCategoriesByType(type);
  const { data: accounts   = [], isLoading: loadingAccs } = useAccounts();

  // ── SUBMIT ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);

    // Validações
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Informe um valor válido."); return;
    }
    if (!categoryId) { setError("Selecione uma categoria."); return; }
    if (!accountId)  { setError("Selecione uma conta."); return; }
    if (!description.trim()) { setError("Informe uma descrição."); return; }

    try {
      await createTransaction.mutateAsync({
        amount:      numericAmount,
        type:        type as TransactionType,
        description: description.trim(),
        category_id: categoryId,
        account_id:  accountId,
        date,
      });
      onClose(); // fecha o bottom sheet após sucesso
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar transação.");
    }
  };

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Título */}
      <h2 className="text-base font-semibold text-gray-800">Nova transação</h2>

      {/* ── TIPO: Despesa / Receita ──────────────────────── */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {(["expense", "income"] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setCategoryId(""); }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              type === t
                ? t === "expense"
                  ? "bg-white text-red-500 shadow-sm"
                  : "bg-white text-emerald-500 shadow-sm"
                : "text-gray-400"
            )}
          >
            {t === "expense" ? "💸 Despesa" : "💰 Receita"}
          </button>
        ))}
      </div>

      {/* ── VALOR ───────────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          Valor
        </label>
        {/* inputMode="decimal" abre o teclado numérico no mobile */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              // Permite apenas números e vírgula/ponto
              const val = e.target.value.replace(/[^0-9.,]/g, "");
              setAmount(val);
            }}
            placeholder="0,00"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>
      </div>

      {/* ── DESCRIÇÃO ───────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          Descrição
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === "expense" ? "Ex: Almoço, Uber, Netflix..." : "Ex: Salário, Freelance..."}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* ── CATEGORIAS ──────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">
          Categoria
        </label>

        {loadingCats ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
          // Grade de ícones de categoria — mais visual que um select
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all",
                  categoryId === cat.id
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-transparent bg-gray-50"
                )}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[10px] text-gray-500 text-center leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTA ───────────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          Conta
        </label>

        {loadingAccs ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : accounts.length === 0 ? (
          // Caso o usuário não tenha nenhuma conta cadastrada ainda
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-amber-600">
              Você ainda não tem contas cadastradas. Crie uma na tela de Perfil.
            </p>
          </div>
        ) : (
          <div className="relative">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            >
              <option value="">Selecione a conta</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
            {/* Ícone customizado para o select (o padrão é feio) */}
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* ── DATA ────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          Data
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* ── ERRO ────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* ── BOTÕES ──────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium active:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          disabled={createTransaction.isPending}
          className={cn(
            "flex-2 flex-grow-[2] py-3.5 rounded-2xl text-sm font-semibold transition-all",
            "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
            "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {createTransaction.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar"
          )}
        </button>
      </div>

    </div>
  );
}
