// ============================================================
// TRANSACTION FORM — FORMULÁRIO DE NOVA TRANSAÇÃO
// ============================================================
//
// FLUXOS:
//
// 1. Despesa/Receita normal:
//    → seleciona conta corrente
//    → salva: account_id = conta, credit_card_id = null
//
// 2. Compra no cartão (toggle ativo):
//    → seleciona cartão de crédito
//    → NÃO seleciona conta corrente (não afeta saldo)
//    → salva: account_id = null, credit_card_id = cartão
//             purchase_date = data da compra
//             date = vencimento da fatura (calculado)
//
// 3. Parcelamento:
//    → igual ao fluxo normal, mas cria via useCreateInstallment
//    → pode ser no cartão também
//
// ============================================================

import { useState }                      from "react";
import { Loader2, ChevronDown, CreditCard } from "lucide-react";
import { useCreateTransaction, useCreateCardTransaction } from "@/hooks/useTransactions";
import { useCreateInstallment }          from "@/hooks/useInstallments";
import { useCategoriesByType }           from "@/hooks/useCategories";
import { useAccounts }                   from "@/hooks/useAccounts";
import { cn, formatCurrency }            from "@/lib/utils";
import { TransactionType, CategoryType } from "@/types";

interface TransactionFormProps {
  onClose:    () => void;
  onSuccess?: () => void;
}

const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];



export function TransactionForm({ onClose, onSuccess }: TransactionFormProps) {
  const createTransaction     = useCreateTransaction();
  const createCardTransaction = useCreateCardTransaction();
  const createInstallment     = useCreateInstallment();

  // ── ESTADOS ────────────────────────────────────────────
  const [type, setType]               = useState<CategoryType>("expense");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId]   = useState("");
  const [accountId, setAccountId]     = useState("");   // conta corrente
  const [cardId, setCardId]           = useState("");   // cartão de crédito
  const [date, setDate]               = useState(
    new Date().toISOString().split("T")[0]
  );
  // Data de vencimento da fatura (mês escolhido pelo usuário)
  // Inicializa no primeiro dia do mês atual
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [error, setError] = useState<string | null>(null);

  // Toggle de cartão e parcelamento
  const [isCard, setIsCard]                   = useState(false);
  const [isInstallment, setIsInstallment]     = useState(false);
  const [installmentCount, setInstallmentCount] = useState(12);
  const [alreadyPaid, setAlreadyPaid]         = useState(0);

  // ── DADOS ──────────────────────────────────────────────
  const { data: categories = [], isLoading: loadingCats } = useCategoriesByType(type);
  const { data: accounts   = [], isLoading: loadingAccs } = useAccounts();

  // Separa contas normais dos cartões
  const normalAccounts = accounts.filter((a) => a.type !== "credit_card");
  const creditCards    = accounts.filter((a) => a.type === "credit_card");

  // Valor por parcela
  const numericAmount  = parseFloat(amount.replace(",", ".")) || 0;
  const perInstallment = isInstallment && installmentCount > 0
    ? numericAmount / installmentCount
    : 0;

  // ── SUBMIT ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Informe um valor válido."); return;
    }
    if (!categoryId)         { setError("Selecione uma categoria."); return; }
    if (!description.trim()) { setError("Informe uma descrição."); return; }

    // Validação específica por fluxo
    if (isCard) {
      if (!cardId) { setError("Selecione o cartão de crédito."); return; }
    } else {
      if (!accountId) { setError("Selecione uma conta."); return; }
    }

    try {
      if (isInstallment) {
        // ── PARCELAMENTO ─────────────────────────────────
        if (alreadyPaid >= installmentCount) {
          setError("Parcelas já pagas não pode ser maior ou igual ao total."); return;
        }
        await createInstallment.mutateAsync({
          description:        description.trim(),
          total_amount:       numericAmount,
          installment_amount: parseFloat(perInstallment.toFixed(2)),
          installment_count:  installmentCount,
          already_paid:       alreadyPaid,
          category_id:        categoryId,
          account_id:         isCard ? null : accountId,
          credit_card_id:     isCard ? cardId : undefined,
          start_date:         date,
        });
      } else if (isCard) {
        // ── COMPRA NO CARTÃO ──────────────────────────────
        // date = primeiro dia do mês da fatura escolhido pelo usuário
        const faturaDate = `${billingMonth}-01`;
        await createCardTransaction.mutateAsync({
          credit_card_id: cardId,
          category_id:    categoryId,
          description:    description.trim(),
          amount:         numericAmount,
          purchase_date:  date,
          date:           faturaDate,
        });
      } else {
        // ── TRANSAÇÃO NORMAL ──────────────────────────────
        await createTransaction.mutateAsync({
          amount:      numericAmount,
          type:        type as TransactionType,
          description: description.trim(),
          category_id: categoryId,
          account_id:  accountId,
          date,
        });
      }

      onSuccess ? onSuccess() : onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  const isLoading = createTransaction.isPending
    || createCardTransaction.isPending
    || createInstallment.isPending;

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
              if (t === "income") {
                setIsInstallment(false);
                setIsCard(false);
              }
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

      {/* ── TOGGLES (só para despesas) ───────────────── */}
      {type === "expense" && (
        <div className="flex gap-2">

          {/* Toggle Cartão */}
          <button
            onClick={() => {
              setIsCard(!isCard);
              if (isCard) setCardId("");
            }}
            className={cn(
              "flex-1 flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all",
              isCard ? "border-violet-400 bg-violet-50" : "border-gray-100 bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <CreditCard size={16} className={isCard ? "text-violet-500" : "text-gray-400"} />
              <span className={cn("text-xs font-medium", isCard ? "text-violet-600" : "text-gray-500")}>
                Cartão
              </span>
            </div>
            <div className={cn("w-9 h-5 rounded-full relative transition-colors", isCard ? "bg-violet-500" : "bg-gray-200")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", isCard ? "left-4" : "left-0.5")} />
            </div>
          </button>

          {/* Toggle Parcelar */}
          <button
            onClick={() => setIsInstallment(!isInstallment)}
            className={cn(
              "flex-1 flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all",
              isInstallment ? "border-blue-400 bg-blue-50" : "border-gray-100 bg-gray-50"
            )}
          >
            <span className={cn("text-xs font-medium", isInstallment ? "text-blue-600" : "text-gray-500")}>
              Parcelar
            </span>
            <div className={cn("w-9 h-5 rounded-full relative transition-colors", isInstallment ? "bg-blue-500" : "bg-gray-200")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", isInstallment ? "left-4" : "left-0.5")} />
            </div>
          </button>

        </div>
      )}

      {/* ── VALOR ───────────────────────────────────── */}
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
          placeholder="Ex: Almoço, Uber, Netflix..."
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

      {/* ── SELETOR DE CARTÃO (quando isCard = true) ── */}
      {isCard && (
        <div>
          <label className="text-xs font-medium text-violet-500 mb-1.5 block">Cartão de crédito</label>
          {creditCards.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <p className="text-sm text-amber-600">Você não tem cartões cadastrados. Adicione um em Perfil → Contas.</p>
            </div>
          ) : (
            <div className="relative">
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full appearance-none bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
              >
                <option value="">Selecione o cartão</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

        </div>
      )}

      {/* ── SELETOR DE CONTA NORMAL (quando isCard = false) ── */}
      {!isCard && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Conta</label>
          {loadingAccs ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : normalAccounts.length === 0 ? (
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
                {normalAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatCurrency(Number(acc.balance))}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* ── DATA ─────────────────────────────────────── */}
      {isCard ? (
        // Cartão: data da compra + mês da fatura
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Data da compra</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-500 mb-1.5 block">
              Mês da fatura
            </label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
            />
            <p className="text-[11px] text-violet-400 mt-1 px-1">
              Em qual fatura essa compra vai aparecer?
            </p>
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {isInstallment ? "Mês da próxima parcela" : "Data"}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>
      )}

      {/* ── PARCELAMENTO ─────────────────────────────── */}
      {isInstallment && (
        <div className="bg-blue-50 rounded-2xl p-4 space-y-3 border border-blue-100">
          <div>
            <label className="text-xs font-medium text-blue-600 mb-1.5 block">Número de parcelas</label>
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

          {numericAmount > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
              <span className="text-xs text-gray-500">Valor por parcela</span>
              <span className="text-sm font-bold text-blue-600">
                {installmentCount}x de {formatCurrency(perInstallment)}
              </span>
            </div>
          )}

          {/* Parcelas já pagas */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 space-y-2">
            <p className="text-xs font-semibold text-amber-800">Compra já em andamento?</p>
            <div className="relative">
              <select
                value={alreadyPaid}
                onChange={(e) => setAlreadyPaid(parseInt(e.target.value))}
                className="w-full appearance-none bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-amber-400"
              >
                <option value={0}>Nenhuma — começando agora</option>
                {Array.from({ length: installmentCount - 1 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} paga{n > 1 ? "s" : ""} — restam {installmentCount - n}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
            </div>
            {alreadyPaid > 0 && (
              <p className="text-[11px] text-amber-700 font-medium">
                ✓ Serão criadas {installmentCount - alreadyPaid} parcelas a partir do mês informado
              </p>
            )}
          </div>
        </div>
      )}

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
            "flex-[2] py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60",
            isCard
              ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
              : isInstallment
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </span>
          ) : isCard ? "Lançar no cartão"
            : isInstallment
              ? alreadyPaid > 0
                ? `Cadastrar ${installmentCount - alreadyPaid}x restantes`
                : `Parcelar em ${installmentCount}x`
              : "Salvar"
          }
        </button>
      </div>

    </div>
  );
}