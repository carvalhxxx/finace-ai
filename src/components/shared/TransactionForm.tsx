// ============================================================
// TRANSACTION FORM — FORMULÁRIO DE NOVA TRANSAÇÃO (atualizado)
// ============================================================
// Adicionado: toggle de parcelamento
//
// Quando "Parcelar" está ativo:
//   - O campo de data vira "Mês de início"
//   - Aparece seletor de quantidade de parcelas
//   - O valor exibido é por parcela
//   - O submit chama useCreateInstallment ao invés de
//     useCreateTransaction
//
// Parcelamento só está disponível para Despesas — receitas
// parceladas não fazem sentido no contexto do app.
// ============================================================

import { useState }                from "react";
import { Loader2, ChevronDown, CreditCard } from "lucide-react";
import { useCreateTransaction }    from "@/hooks/useTransactions";
import { useCreateInstallment }    from "@/hooks/useInstallments";
import { useCategoriesByType }     from "@/hooks/useCategories";
import { useAccounts }             from "@/hooks/useAccounts";
import { cn, formatCurrency }      from "@/lib/utils";
import { TransactionType, CategoryType } from "@/types";

interface TransactionFormProps {
  onClose: () => void;
}

// Opções de parcelas disponíveis
const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];

export function TransactionForm({ onClose }: TransactionFormProps) {
  const createTransaction  = useCreateTransaction();
  const createInstallment  = useCreateInstallment();

  // ── ESTADOS ────────────────────────────────────────────
  const [type, setType]               = useState<CategoryType>("expense");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId]   = useState("");
  const [accountId, setAccountId]     = useState("");
  const [date, setDate]               = useState(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError]             = useState<string | null>(null);

  // Estados do parcelamento
  const [isInstallment, setIsInstallment]       = useState(false);
  const [installmentCount, setInstallmentCount] = useState(12);

  // ── DADOS ──────────────────────────────────────────────
  const { data: categories = [], isLoading: loadingCats } = useCategoriesByType(type);
  const { data: accounts   = [], isLoading: loadingAccs } = useAccounts();

  // Valor calculado por parcela (para exibição em tempo real)
  const numericAmount    = parseFloat(amount.replace(",", ".")) || 0;
  const perInstallment   = isInstallment && installmentCount > 0
    ? numericAmount / installmentCount
    : 0;

  // ── SUBMIT ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);

    // Validações comuns
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Informe um valor válido."); return;
    }
    if (!categoryId)        { setError("Selecione uma categoria."); return; }
    if (!accountId)         { setError("Selecione uma conta."); return; }
    if (!description.trim()) { setError("Informe uma descrição."); return; }

    try {
      if (isInstallment) {
        // ── FLUXO PARCELADO ────────────────────────────
        // Cria o parcelamento pai + N transações filhas
        await createInstallment.mutateAsync({
          description:        description.trim(),
          total_amount:       numericAmount,
          installment_amount: parseFloat(perInstallment.toFixed(2)),
          installment_count:  installmentCount,
          category_id:        categoryId,
          account_id:         accountId,
          start_date:         date,
        });
      } else {
        // ── FLUXO NORMAL ───────────────────────────────
        await createTransaction.mutateAsync({
          amount:      numericAmount,
          type:        type as TransactionType,
          description: description.trim(),
          category_id: categoryId,
          account_id:  accountId,
          date,
        });
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  const isLoading = createTransaction.isPending || createInstallment.isPending;

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div className="space-y-5">

      <h2 className="text-base font-semibold text-gray-800">Nova transação</h2>

      {/* ── TIPO: Despesa / Receita ──────────────────── */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {(["expense", "income"] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setCategoryId("");
              // Parcelamento só para despesas
              if (t === "income") setIsInstallment(false);
            }}
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

      {/* ── TOGGLE PARCELAR (só para despesas) ──────── */}
      {type === "expense" && (
        <button
          onClick={() => setIsInstallment(!isInstallment)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all",
            isInstallment
              ? "border-blue-400 bg-blue-50"
              : "border-gray-100 bg-gray-50"
          )}
        >
          <div className="flex items-center gap-2">
            <CreditCard
              size={18}
              className={isInstallment ? "text-blue-500" : "text-gray-400"}
            />
            <span className={cn(
              "text-sm font-medium",
              isInstallment ? "text-blue-600" : "text-gray-500"
            )}>
              Parcelar no cartão
            </span>
          </div>

          {/* Switch visual */}
          <div className={cn(
            "w-10 h-6 rounded-full transition-colors relative",
            isInstallment ? "bg-blue-500" : "bg-gray-200"
          )}>
            <div className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
              isInstallment ? "left-5" : "left-1"
            )} />
          </div>
        </button>
      )}

      {/* ── CAMPOS DE PARCELAMENTO (expande ao ativar) ── */}
      {isInstallment && (
        <div className="bg-blue-50 rounded-2xl p-4 space-y-3 border border-blue-100">

          {/* Quantidade de parcelas */}
          <div>
            <label className="text-xs font-medium text-blue-600 mb-1.5 block">
              Número de parcelas
            </label>
            <div className="relative">
              <select
                value={installmentCount}
                onChange={(e) => setInstallmentCount(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              >
                {INSTALLMENT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Preview do valor por parcela */}
          {numericAmount > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
              <span className="text-xs text-gray-500">Valor por parcela</span>
              <span className="text-sm font-bold text-blue-600">
                {installmentCount}x de {formatCurrency(perInstallment)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── VALOR TOTAL ─────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          {isInstallment ? "Valor total da compra" : "Valor"}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="0,00"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>
      </div>

      {/* ── DESCRIÇÃO ───────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Descrição</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={isInstallment ? "Ex: iPhone 16, Notebook..." : "Ex: Almoço, Uber, Netflix..."}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* ── CATEGORIAS ──────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Categoria</label>
        {loadingCats ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
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
                <span className="text-[10px] text-gray-500 text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTA ───────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Conta</label>
        {loadingAccs ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-amber-600">Você ainda não tem contas cadastradas.</p>
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
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── DATA / MÊS DE INÍCIO ────────────────────── */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          {isInstallment ? "Mês da primeira parcela" : "Data"}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* ── ERRO ────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* ── BOTÕES ──────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium active:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "flex-[2] py-3.5 rounded-2xl text-sm font-semibold transition-all",
            isInstallment
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
            "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </span>
          ) : isInstallment ? (
            `Parcelar em ${installmentCount}x`
          ) : (
            "Salvar"
          )}
        </button>
      </div>

    </div>
  );
}
