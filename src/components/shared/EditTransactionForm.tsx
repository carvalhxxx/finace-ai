// ============================================================
// EDIT TRANSACTION FORM — FORMULÁRIO DE EDIÇÃO
// ============================================================
// Igual ao TransactionForm mas pré-preenchido com os dados
// da transação existente.
//
// Campos editáveis:
//   - Valor, Descrição, Categoria, Conta, Data
//
// Campos NÃO editáveis:
//   - Tipo (income/expense) — mudaria toda a lógica de saldo
//   - Parcelamento — editar parcelas individualmente pode
//     quebrar a consistência do parcelamento pai
// ============================================================

import { useState }                from "react";
import { Loader2, ChevronDown }    from "lucide-react";
import { useUpdateTransaction }    from "@/hooks/useTransactions";
import { useCategoriesByType }     from "@/hooks/useCategories";
import { useAccounts }             from "@/hooks/useAccounts";
import { cn, formatCurrency }      from "@/lib/utils";
import { Transaction }             from "@/types";

interface EditTransactionFormProps {
  transaction: Transaction;
  onClose:     () => void;
  onSuccess?:  () => void;
}

export function EditTransactionForm({
  transaction,
  onClose,
  onSuccess,
}: EditTransactionFormProps) {
  const updateTransaction = useUpdateTransaction();

  // Pré-preenche com os dados existentes
  const [amount,      setAmount]      = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [categoryId,  setCategoryId]  = useState(transaction.category_id);
  const [accountId,   setAccountId]   = useState(transaction.account_id);
  const [date,        setDate]        = useState(transaction.date);
  const [error,       setError]       = useState<string | null>(null);

  const { data: categories = [], isLoading: loadingCats } =
    useCategoriesByType(transaction.type === "income" ? "income" : "expense");
  const { data: accounts = [], isLoading: loadingAccs } = useAccounts();

  const handleSubmit = async () => {
    setError(null);
    const numericAmount = parseFloat(amount.replace(",", "."));

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Informe um valor válido."); return;
    }
    if (!categoryId)         { setError("Selecione uma categoria."); return; }
    if (!accountId)          { setError("Selecione uma conta."); return; }
    if (!description.trim()) { setError("Informe uma descrição."); return; }

    try {
      await updateTransaction.mutateAsync({
        id:          transaction.id,
        amount:      numericAmount,
        description: description.trim(),
        category_id: categoryId,
        account_id:  accountId,
        date,
      });
      onSuccess ? onSuccess() : onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Editar transação</h2>
        {/* Badge mostrando o tipo — não editável */}
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          transaction.type === "income"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-500"
        )}>
          {transaction.type === "income" ? "💰 Receita" : "💸 Despesa"}
        </span>
      </div>

      {/* Aviso para parcelas */}
      {transaction.installment_id && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-600">
            Esta é uma parcela de um parcelamento. Apenas esta parcela será alterada.
          </p>
        </div>
      )}

      {/* Valor */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Valor</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Descrição</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* Categorias */}
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

      {/* Conta */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Conta</label>
        {loadingAccs ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="relative">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            >
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

      {/* Data */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Data</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium active:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={updateTransaction.isPending}
          className="flex-[2] py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-60"
        >
          {updateTransaction.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar alterações"
          )}
        </button>
      </div>

    </div>
  );
}