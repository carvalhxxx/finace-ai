// ============================================================
// BILLS — CONTAS A PAGAR
// ============================================================
// Funcionalidades:
//   - Lista contas pendentes e pagas separadas por seção
//   - Badge de status: vencida / vence hoje / vence em Xd / paga
//   - Botão "Pagar" abre confirmação com data de pagamento
//   - Botão "Desfazer" em contas já pagas
//   - Formulário de nova conta em bottom sheet
//   - Swipe para deletar
// ============================================================

import { useState, useRef }            from "react";
import { Plus, Trash2, Loader2, ChevronDown, Check, X } from "lucide-react";
import { useBills, useCreateBill, usePayBill, useUnpayBill, useDeleteBill, billStatus } from "@/hooks/useBills";
import { useCategories }               from "@/hooks/useCategories";
import { useAccounts }                 from "@/hooks/useAccounts";
import { formatCurrency, cn }          from "@/lib/utils";
import { Bill }                        from "@/types";

export function Bills() {
  // ── DADOS ───────────────────────────────────────────────
  const { data: bills = [], isLoading } = useBills();
  const { data: categories = [] }       = useCategories();
  const { data: accounts = [] }         = useAccounts();
  const createBill = useCreateBill();
  const payBill    = usePayBill();
  const unpayBill  = useUnpayBill();
  const deleteBill = useDeleteBill();

  // ── ESTADOS: FORMULÁRIO ──────────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [desc, setDesc]                 = useState("");
  const [amount, setAmount]             = useState("");
  const [dueDate, setDueDate]           = useState("");
  const [categoryId, setCategoryId]     = useState("");
  const [accountId, setAccountId]       = useState("");
  const [formError, setFormError]       = useState<string | null>(null);

  // ── ESTADOS: PAGAMENTO ───────────────────────────────────
  const [payingId, setPayingId]         = useState<string | null>(null);
  const [payDate, setPayDate]           = useState(
    new Date().toISOString().split("T")[0]
  );

  // ── SEPARAR PENDENTES E PAGAS ────────────────────────────
  const pending = bills.filter((b) => !b.paid);
  const paid    = bills.filter((b) => b.paid);

  // Categorias de despesa
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // ── HANDLERS ─────────────────────────────────────────────

  const handleCreate = async () => {
    setFormError(null);
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!desc.trim())                                 { setFormError("Informe uma descrição."); return; }
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) { setFormError("Informe um valor válido."); return; }
    if (!dueDate)                                     { setFormError("Informe a data de vencimento."); return; }
    if (!categoryId)                                  { setFormError("Selecione uma categoria."); return; }
    if (!accountId)                                   { setFormError("Selecione uma conta."); return; }

    try {
      await createBill.mutateAsync({
        description: desc.trim(),
        amount:      numericAmount,
        due_date:    dueDate,
        category_id: categoryId,
        account_id:  accountId,
      });
      setDesc(""); setAmount(""); setDueDate("");
      setCategoryId(""); setAccountId("");
      setShowForm(false);
    } catch { setFormError("Erro ao criar conta."); }
  };

  const handlePay = async (bill: Bill) => {
    await payBill.mutateAsync({ bill, payDate });
    setPayingId(null);
  };

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">

      {/* ── CABEÇALHO ─────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Contas a pagar</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {pending.length === 0
              ? "Tudo em dia! ✅"
              : `${pending.length} conta${pending.length > 1 ? "s" : ""} pendente${pending.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus size={14} />Nova conta
        </button>
      </div>

      {/* ── RESUMO ────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="mx-4 mb-3 bg-gray-900 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs">Total pendente</p>
            <p className="text-white text-xl font-bold mt-0.5">
              {formatCurrency(pending.reduce((s, b) => s + b.amount, 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Vencidas</p>
            <p className="text-red-400 text-xl font-bold mt-0.5">
              {formatCurrency(
                pending
                  .filter((b) => new Date(`${b.due_date}T12:00:00`) < new Date())
                  .reduce((s, b) => s + b.amount, 0)
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── LISTA ─────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-8 space-y-4">

        {isLoading && (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && bills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-3">🧾</span>
            <p className="text-sm font-medium text-gray-600">Nenhuma conta cadastrada</p>
            <p className="text-xs text-gray-400 mt-1">Toque em "Nova conta" para começar</p>
          </div>
        )}

        {/* Pendentes */}
        {!isLoading && pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pendentes</p>
            <div className="space-y-2">
              {pending.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  isPayingOpen={payingId === bill.id}
                  payDate={payDate}
                  onOpenPay={() => { setPayingId(bill.id); setPayDate(new Date().toISOString().split("T")[0]); }}
                  onClosePay={() => setPayingId(null)}
                  onConfirmPay={() => handlePay(bill)}
                  onPayDateChange={setPayDate}
                  onDelete={() => deleteBill.mutate(bill.id)}
                  isPaying={payBill.isPending}
                  isDeleting={deleteBill.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagas */}
        {!isLoading && paid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pagas</p>
            <div className="space-y-2">
              {paid.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  isPayingOpen={false}
                  payDate={payDate}
                  onOpenPay={() => {}}
                  onClosePay={() => {}}
                  onConfirmPay={() => {}}
                  onPayDateChange={() => {}}
                  onDelete={() => deleteBill.mutate(bill.id)}
                  onUnpay={() => unpayBill.mutate(bill)}
                  isPaying={false}
                  isDeleting={deleteBill.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET: NOVA CONTA ──────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "92vh", touchAction: "pan-y" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <button onClick={() => setShowForm(false)} className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">✕</button>
            </div>

            <div className="overflow-y-auto px-5 pb-8 pt-2 space-y-4">
              <h2 className="text-base font-semibold text-gray-800">Nova conta a pagar</h2>

              {/* Descrição */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Descrição</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ex: Aluguel, Luz, Internet..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
              </div>

              {/* Valor */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input type="text" inputMode="decimal" value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                    placeholder="0,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                </div>
              </div>

              {/* Vencimento */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Data de vencimento</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Categoria</label>
                <div className="grid grid-cols-4 gap-2">
                  {expenseCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all",
                        categoryId === cat.id ? "border-emerald-400 bg-emerald-50" : "border-transparent bg-gray-50")}>
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-[10px] text-gray-500 text-center leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conta bancária */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Conta bancária</label>
                <div className="relative">
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20">
                    <option value="">Selecione a conta</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <p className="text-sm text-red-500">{formError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium">Cancelar</button>
                <button onClick={handleCreate} disabled={createBill.isPending}
                  className="flex-[2] py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-60">
                  {createBill.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Salvar conta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BILL CARD — CARD COM SWIPE PARA DELETAR
// ============================================================

interface BillCardProps {
  bill:           Bill;
  isPayingOpen:   boolean;
  payDate:        string;
  onOpenPay:      () => void;
  onClosePay:     () => void;
  onConfirmPay:   () => void;
  onPayDateChange:(d: string) => void;
  onDelete:       () => void;
  onUnpay?:       () => void;
  isPaying:       boolean;
  isDeleting:     boolean;
}

function BillCard({
  bill, isPayingOpen, payDate,
  onOpenPay, onClosePay, onConfirmPay, onPayDateChange,
  onDelete, onUnpay, isPaying, isDeleting,
}: BillCardProps) {
  const status       = billStatus(bill);
  const [offset, setOffset]   = useState(0);
  const [swiped, setSwiped]   = useState(false);
  const touchStartX           = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove  = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    if (diff > 0) setOffset(Math.min(diff, 72));
  };
  const handleTouchEnd = () => {
    if (offset >= 60) { setOffset(72); setSwiped(true); }
    else              { setOffset(0);  setSwiped(false); }
  };
  const handleClose = () => { setOffset(0); setSwiped(false); };

  return (
    <div className="relative rounded-2xl overflow-hidden">

      {/* Botão deletar */}
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-red-500 rounded-2xl">
        {isDeleting
          ? <Loader2 size={18} className="text-white animate-spin" />
          : <button onClick={onDelete} className="w-full h-full flex items-center justify-center"><Trash2 size={18} className="text-white" /></button>
        }
      </div>

      {/* Card */}
      <div
        className="bg-white border border-gray-100 rounded-2xl transition-transform duration-200"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? handleClose : undefined}
      >
        {/* Linha principal */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-2xl flex-shrink-0">{bill.category?.icon}</span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{bill.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", status.bg, status.color)}>
                {status.icon} {status.label}
              </span>
              <span className="text-[10px] text-gray-400">{bill.account?.name}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={cn("text-sm font-bold", bill.paid ? "text-emerald-500" : "text-gray-800")}>
              {formatCurrency(bill.amount)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {bill.paid
                ? `Pago em ${new Date(`${bill.paid_at}T12:00:00`).toLocaleDateString("pt-BR")}`
                : `Vence ${new Date(`${bill.due_date}T12:00:00`).toLocaleDateString("pt-BR")}`
              }
            </p>
          </div>

          {/* Botão pagar / desfazer */}
          {bill.paid ? (
            <button onClick={onUnpay}
              className="ml-2 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 flex-shrink-0"
              title="Desfazer pagamento">
              <X size={14} className="text-gray-400" />
            </button>
          ) : (
            <button onClick={onOpenPay}
              className="ml-2 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 flex-shrink-0">
              <Check size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Painel de confirmação de pagamento */}
        {isPayingOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
            <p className="text-xs font-medium text-gray-500">Data do pagamento</p>
            <input type="date" value={payDate} onChange={(e) => onPayDateChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
            <div className="flex gap-2">
              <button onClick={onClosePay} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium">Cancelar</button>
              <button onClick={onConfirmPay} disabled={isPaying}
                className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60">
                {isPaying
                  ? <Loader2 size={13} className="animate-spin mx-auto" />
                  : `Confirmar pagamento de ${formatCurrency(bill.amount)}`
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}