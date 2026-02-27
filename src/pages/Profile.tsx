// ============================================================
// PROFILE — TELA DE PERFIL COMPLETA
// ============================================================
// Seções:
//   1. Avatar + nome + email
//   2. Contas bancárias (criar, ver, deletar)
//   3. Alertas de gastos (criar, toggle, deletar)
//   4. Segurança (trocar senha)
//   5. Logout
// ============================================================

import { useState }              from "react";
import { useNavigate }           from "react-router-dom";
import {
  CreditCard, Bell, Lock, LogOut,
  Plus, Trash2, Loader2, ChevronDown,
  Check, X, Eye, EyeOff, Pencil, RefreshCw,
} from "lucide-react";
import { useProfile, useUpdateProfile, useChangePassword, useSignOut } from "@/hooks/useProfile";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/useAccounts";
import { useAlerts, useCreateAlert, useToggleAlert, useDeleteAlert }   from "@/hooks/useAlerts";
import { useRecurring, useCreateRecurring, useToggleRecurring, useDeleteRecurring } from "@/hooks/useRecurring";
import { useCategories }         from "@/hooks/useCategories";
import { formatCurrency, getInitials, cn } from "@/lib/utils";

// Cores disponíveis para contas
const ACCOUNT_COLORS = [
  "#8b5cf6","#3b82f6","#22c55e","#f97316",
  "#ef4444","#f59e0b","#ec4899","#6b7280",
];

// Tipos de conta
const ACCOUNT_TYPES = [
  { value: "checking",   label: "Conta Corrente" },
  { value: "savings",    label: "Poupança"        },
  { value: "investment", label: "Investimentos"   },
  { value: "wallet",     label: "Carteira"        },
];

export function Profile() {
  const navigate             = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: alerts   = [] } = useAlerts();
  const { data: categories = [] } = useCategories();
  const { data: recurrings = [] } = useRecurring();
  const updateProfile   = useUpdateProfile();
  const changePassword  = useChangePassword();
  const signOut         = useSignOut();
  const createAccount   = useCreateAccount();
  const updateAccount   = useUpdateAccount();
  const deleteAccount   = useDeleteAccount();
  const createRecurring = useCreateRecurring();
  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();
  const createAlert     = useCreateAlert();
  const toggleAlert     = useToggleAlert();
  const deleteAlert     = useDeleteAlert();

  // ── ESTADOS: NOME ────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName]         = useState("");
  const [nameError, setNameError]     = useState<string | null>(null);

  // ── ESTADOS: CONTA BANCÁRIA ──────────────────────────────
  const [showAccountForm, setShowAccountForm]   = useState(false);
  const [accountName, setAccountName]           = useState("");
  const [accountType, setAccountType]           = useState("checking");
  const [accountBalance, setAccountBalance]     = useState("");
  const [accountColor, setAccountColor]         = useState("#8b5cf6");
  const [accountAccumulates, setAccountAccumulates] = useState(true);
  const [accountError, setAccountError]         = useState<string | null>(null);

  // Edição inline de conta existente
  const [editingAccountId, setEditingAccountId]         = useState<string | null>(null);
  const [editAccountName, setEditAccountName]           = useState("");
  const [editAccountBalance, setEditAccountBalance]     = useState("");
  const [editAccountColor, setEditAccountColor]         = useState("");
  const [editAccountAccumulates, setEditAccountAccumulates] = useState(true);

  // ── ESTADOS: RECORRÊNCIA ─────────────────────────────────
  const [showRecurringForm, setShowRecurringForm]   = useState(false);
  const [recurringDesc, setRecurringDesc]           = useState("");
  const [recurringAmount, setRecurringAmount]       = useState("");
  const [recurringType, setRecurringType]           = useState<"income" | "expense">("income");
  const [recurringCategoryId, setRecurringCategoryId] = useState("");
  const [recurringAccountId, setRecurringAccountId]   = useState("");
  const [recurringDay, setRecurringDay]               = useState("1");
  const [recurringError, setRecurringError]           = useState<string | null>(null);

  // ── ESTADOS: ALERTA ──────────────────────────────────────
  const [showAlertForm, setShowAlertForm]   = useState(false);
  const [alertCategoryId, setAlertCategoryId] = useState("");
  const [alertLimit, setAlertLimit]           = useState("");
  const [alertPeriod, setAlertPeriod]         = useState<"monthly" | "weekly">("monthly");
  const [alertError, setAlertError]           = useState<string | null>(null);

  // ── ESTADOS: SENHA ───────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [passwordError, setPasswordError]       = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess]   = useState(false);

  // ── HANDLERS ─────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!newName.trim()) { setNameError("Informe um nome."); return; }
    try {
      await updateProfile.mutateAsync({ name: newName.trim() });
      setEditingName(false);
      setNameError(null);
    } catch { setNameError("Erro ao salvar nome."); }
  };

  const handleCreateAccount = async () => {
    setAccountError(null);
    const balance = parseFloat(accountBalance.replace(",", "."));
    if (!accountName.trim())              { setAccountError("Informe o nome da conta."); return; }
    if (accountBalance && isNaN(balance)) { setAccountError("Saldo inválido."); return; }
    try {
      await createAccount.mutateAsync({
        name:        accountName.trim(),
        type:        accountType as "checking" | "savings" | "investment" | "wallet",
        balance:     isNaN(balance) ? 0 : balance,
        color:       accountColor,
        accumulates: accountAccumulates,
      });
      setAccountName(""); setAccountBalance(""); setAccountType("checking");
      setAccountColor("#8b5cf6"); setAccountAccumulates(true);
      setShowAccountForm(false);
    } catch { setAccountError("Erro ao criar conta."); }
  };

  const handleSaveAccount = async (id: string) => {
    const balance = parseFloat(editAccountBalance.replace(",", "."));
    if (!editAccountName.trim()) return;
    await updateAccount.mutateAsync({
      id,
      name:        editAccountName.trim(),
      balance:     isNaN(balance) ? 0 : balance,
      color:       editAccountColor,
      accumulates: editAccountAccumulates,
    });
    setEditingAccountId(null);
  };

  const handleCreateRecurring = async () => {
    setRecurringError(null);
    const amount = parseFloat(recurringAmount.replace(",", "."));
    const day    = parseInt(recurringDay);
    if (!recurringDesc.trim())                    { setRecurringError("Informe uma descrição."); return; }
    if (!recurringAmount || isNaN(amount) || amount <= 0) { setRecurringError("Informe um valor válido."); return; }
    if (!recurringCategoryId)                     { setRecurringError("Selecione uma categoria."); return; }
    if (!recurringAccountId)                      { setRecurringError("Selecione uma conta."); return; }
    if (isNaN(day) || day < 1 || day > 31)        { setRecurringError("Dia inválido (1-31)."); return; }
    try {
      await createRecurring.mutateAsync({
        description:  recurringDesc.trim(),
        amount,
        type:         recurringType,
        category_id:  recurringCategoryId,
        account_id:   recurringAccountId,
        day_of_month: day,
        active:       true,
      });
      setRecurringDesc(""); setRecurringAmount(""); setRecurringCategoryId("");
      setRecurringAccountId(""); setRecurringDay("1"); setRecurringType("income");
      setShowRecurringForm(false);
    } catch { setRecurringError("Erro ao criar recorrência."); }
  };

  const handleCreateAlert = async () => {
    setAlertError(null);
    const limit = parseFloat(alertLimit.replace(",", "."));
    if (!alertCategoryId)               { setAlertError("Selecione uma categoria."); return; }
    if (!alertLimit || isNaN(limit) || limit <= 0) { setAlertError("Informe um limite válido."); return; }
    try {
      await createAlert.mutateAsync({
        category_id:  alertCategoryId,
        limit_amount: limit,
        period:       alertPeriod,
        active:       true,
      });
      setAlertCategoryId(""); setAlertLimit(""); setAlertPeriod("monthly");
      setShowAlertForm(false);
    } catch { setAlertError("Erro ao criar alerta."); }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!currentPassword)                    { setPasswordError("Informe a senha atual."); return; }
    if (newPassword.length < 6)              { setPasswordError("Nova senha deve ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword)     { setPasswordError("As senhas não coincidem."); return; }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(false); }, 2000);
    } catch (e: unknown) {
      setPasswordError(e instanceof Error ? e.message : "Erro ao trocar senha.");
    }
  };

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate("/login", { replace: true });
  };

  // Categorias de despesa para os alertas
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="px-4 py-5 space-y-4 pb-8">

      {/* ══════════════════════════════════════════════════
          SEÇÃO 1 — AVATAR + NOME + EMAIL
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">

          {/* Avatar com iniciais */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <span className="text-white text-xl font-bold">
              {profile ? getInitials(profile.name || profile.email) : "?"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {loadingProfile ? (
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : editingName ? (
              /* Input para editar nome */
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={profile?.name || "Seu nome"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  autoFocus
                />
                {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSaveName} disabled={updateProfile.isPending} className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    {updateProfile.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Salvar
                  </button>
                  <button onClick={() => { setEditingName(false); setNameError(null); }} className="flex items-center gap-1 text-xs text-gray-400">
                    <X size={12} />Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* Exibição normal do nome */
              <div>
                <button
                  onClick={() => { setEditingName(true); setNewName(profile?.name ?? ""); }}
                  className="text-base font-semibold text-gray-800 hover:text-emerald-600 transition-colors text-left"
                >
                  {profile?.name || "Adicionar nome"}
                </button>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{profile?.email}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Toque no nome para editar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SEÇÃO 2 — CONTAS BANCÁRIAS
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Cabeçalho da seção */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Contas</span>
          </div>
          <button
            onClick={() => setShowAccountForm(!showAccountForm)}
            className="flex items-center gap-1 text-xs text-emerald-500 font-medium active:opacity-70"
          >
            <Plus size={14} />Nova conta
          </button>
        </div>

        {/* Formulário de nova conta */}
        {showAccountForm && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 space-y-3">

            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nome da conta (ex: Nubank)"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />

            {/* Tipo de conta */}
            <div className="relative">
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Saldo inicial */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="Saldo inicial (opcional)"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            {/* Cor */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Cor</p>
              <div className="flex gap-2 flex-wrap">
                {ACCOUNT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccountColor(c)}
                    className={cn("w-8 h-8 rounded-full border-4 transition-all", accountColor === c ? "border-gray-400 scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Toggle acumula saldo */}
            <button
              onClick={() => setAccountAccumulates(!accountAccumulates)}
              className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all", accountAccumulates ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white")}
            >
              <div className="text-left">
                <p className={cn("text-xs font-medium", accountAccumulates ? "text-emerald-700" : "text-gray-600")}>
                  Acumula saldo mês a mês
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {accountAccumulates ? "O saldo que sobrar passa pro próximo mês" : "Saldo zera todo mês (ex: VR que expira)"}
                </p>
              </div>
              <div className={cn("w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ml-3", accountAccumulates ? "bg-emerald-500" : "bg-gray-200")}>
                <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", accountAccumulates ? "left-4" : "left-0.5")} />
              </div>
            </button>

            {accountError && <p className="text-xs text-red-500">{accountError}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setShowAccountForm(false); setAccountError(null); }} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-medium">Cancelar</button>
              <button onClick={handleCreateAccount} disabled={createAccount.isPending} className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60">
                {createAccount.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Criar conta"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de contas */}
        {accounts.length === 0 && !showAccountForm ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          <ul>
            {accounts.map((account, index) => (
              <li key={account.id} className={cn("px-4 py-3", index < accounts.length - 1 && "border-b border-gray-50")}>

                {/* Modo visualização */}
                {editingAccountId !== account.id ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ backgroundColor: `${account.color}25` }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{account.name}</p>
                      <p className="text-xs text-gray-400">{ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatCurrency(account.balance)}</p>
                    <button
                      onClick={() => {
                        setEditingAccountId(account.id);
                        setEditAccountName(account.name);
                        setEditAccountBalance(String(account.balance));
                        setEditAccountColor(account.color);
                        setEditAccountAccumulates(account.accumulates ?? true);
                      }}
                      className="p-1.5 text-gray-300 active:text-blue-400 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteAccount.mutate(account.id)} className="p-1.5 text-gray-300 active:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  /* Modo edição inline */
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={editAccountName}
                      onChange={(e) => setEditAccountName(e.target.value)}
                      placeholder="Nome da conta"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      autoFocus
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editAccountBalance}
                        onChange={(e) => setEditAccountBalance(e.target.value.replace(/[^0-9.,]/g, ""))}
                        placeholder="Saldo atual"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                    {/* Cores */}
                    <div className="flex gap-2 flex-wrap">
                      {ACCOUNT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditAccountColor(c)}
                          className={cn("w-7 h-7 rounded-full border-4 transition-all", editAccountColor === c ? "border-gray-400 scale-110" : "border-transparent")}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    {/* Toggle acumula */}
                    <button
                      onClick={() => setEditAccountAccumulates(!editAccountAccumulates)}
                      className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all", editAccountAccumulates ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white")}
                    >
                      <p className={cn("text-xs font-medium", editAccountAccumulates ? "text-emerald-700" : "text-gray-500")}>
                        {editAccountAccumulates ? "Acumula saldo ✓" : "Não acumula (zera todo mês)"}
                      </p>
                      <div className={cn("w-9 h-5 rounded-full transition-colors relative flex-shrink-0", editAccountAccumulates ? "bg-emerald-500" : "bg-gray-200")}>
                        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", editAccountAccumulates ? "left-4" : "left-0.5")} />
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingAccountId(null)}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveAccount(account.id)}
                        disabled={updateAccount.isPending}
                        className="flex-[2] py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60"
                      >
                        {updateAccount.isPending ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Salvar"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          SEÇÃO 3 — ALERTAS DE GASTOS
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Alertas de gastos</span>
          </div>
          <button onClick={() => setShowAlertForm(!showAlertForm)} className="flex items-center gap-1 text-xs text-emerald-500 font-medium active:opacity-70">
            <Plus size={14} />Novo alerta
          </button>
        </div>

        {/* Formulário de novo alerta */}
        {showAlertForm && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 space-y-3">

            {/* Categoria */}
            <div className="relative">
              <select
                value={alertCategoryId}
                onChange={(e) => setAlertCategoryId(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="">Selecione a categoria</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Limite */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={alertLimit}
                onChange={(e) => setAlertLimit(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="Limite de gasto"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            {/* Período */}
            <div className="flex bg-gray-200 rounded-xl p-1">
              {(["monthly", "weekly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setAlertPeriod(p)}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all", alertPeriod === p ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}
                >
                  {p === "monthly" ? "Mensal" : "Semanal"}
                </button>
              ))}
            </div>

            {alertError && <p className="text-xs text-red-500">{alertError}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setShowAlertForm(false); setAlertError(null); }} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-medium">Cancelar</button>
              <button onClick={handleCreateAlert} disabled={createAlert.isPending} className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60">
                {createAlert.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Criar alerta"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de alertas */}
        {alerts.length === 0 && !showAlertForm ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Nenhum alerta configurado</p>
          </div>
        ) : (
          <ul>
            {alerts.map((alert, index) => (
              <li key={alert.id} className={cn("flex items-center gap-3 px-4 py-3", index < alerts.length - 1 && "border-b border-gray-50")}>
                <span className="text-xl flex-shrink-0">{alert.category?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{alert.category?.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(alert.limit_amount)} · {alert.period === "monthly" ? "mensal" : "semanal"}
                  </p>
                </div>

                {/* Toggle ativo/inativo */}
                <button
                  onClick={() => toggleAlert.mutate({ id: alert.id, active: !alert.active })}
                  className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", alert.active ? "bg-emerald-500" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", alert.active ? "left-5" : "left-1")} />
                </button>

                <button onClick={() => deleteAlert.mutate(alert.id)} className="p-1.5 text-gray-300 active:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          SEÇÃO 4 — TRANSAÇÕES RECORRENTES
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Recorrências</span>
          </div>
          <button onClick={() => setShowRecurringForm(!showRecurringForm)} className="flex items-center gap-1 text-xs text-emerald-500 font-medium active:opacity-70">
            <Plus size={14} />Nova
          </button>
        </div>

        {/* Formulário de nova recorrência */}
        {showRecurringForm && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 space-y-3">

            {/* Tipo */}
            <div className="flex bg-gray-200 rounded-xl p-1">
              {(["income", "expense"] as const).map((t) => (
                <button key={t} onClick={() => { setRecurringType(t); setRecurringCategoryId(""); }}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all", recurringType === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500")}>
                  {t === "income" ? "💰 Receita" : "💸 Despesa"}
                </button>
              ))}
            </div>

            {/* Descrição */}
            <input type="text" value={recurringDesc} onChange={(e) => setRecurringDesc(e.target.value)}
              placeholder="Ex: Salário, VR, Academia..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />

            {/* Valor */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input type="text" inputMode="decimal" value={recurringAmount}
                onChange={(e) => setRecurringAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="Valor"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
            </div>

            {/* Dia do mês */}
            <div className="relative">
              <select value={recurringDay} onChange={(e) => setRecurringDay(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Dia {d} de cada mês</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Categoria */}
            <div className="relative">
              <select value={recurringCategoryId} onChange={(e) => setRecurringCategoryId(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20">
                <option value="">Selecione a categoria</option>
                {categories.filter((c) => c.type === recurringType).map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Conta */}
            <div className="relative">
              <select value={recurringAccountId} onChange={(e) => setRecurringAccountId(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20">
                <option value="">Selecione a conta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {recurringError && <p className="text-xs text-red-500">{recurringError}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setShowRecurringForm(false); setRecurringError(null); }} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-medium">Cancelar</button>
              <button onClick={handleCreateRecurring} disabled={createRecurring.isPending} className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60">
                {createRecurring.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Criar recorrência"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de recorrências */}
        {recurrings.length === 0 && !showRecurringForm ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Nenhuma recorrência configurada</p>
          </div>
        ) : (
          <ul>
            {recurrings.map((rec, index) => (
              <li key={rec.id} className={cn("flex items-center gap-3 px-4 py-3", index < recurrings.length - 1 && "border-b border-gray-50")}>
                <span className="text-xl flex-shrink-0">{rec.category?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{rec.description}</p>
                  <p className="text-xs text-gray-400">
                    {rec.type === "income" ? "+" : "-"}{formatCurrency(rec.amount)} · dia {rec.day_of_month} · {rec.account?.name}
                  </p>
                </div>
                {/* Toggle ativo */}
                <button onClick={() => toggleRecurring.mutate({ id: rec.id, active: !rec.active })}
                  className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", rec.active ? "bg-emerald-500" : "bg-gray-200")}>
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", rec.active ? "left-5" : "left-1")} />
                </button>
                <button onClick={() => deleteRecurring.mutate(rec.id)} className="p-1.5 text-gray-300 active:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          SEÇÃO 5 — TROCAR SENHA
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Trocar senha</span>
          </div>
          <ChevronDown size={16} className={cn("text-gray-400 transition-transform", showPasswordForm && "rotate-180")} />
        </button>

        {showPasswordForm && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
            <div className="pt-3" />

            {/* Senha atual */}
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Nova senha */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mínimo 6 caracteres)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirmar nova senha */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />

            {passwordError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                <p className="text-xs text-red-500">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <Check size={14} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 font-medium">Senha alterada com sucesso!</p>
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={changePassword.isPending}
              className="w-full py-3 rounded-xl bg-gray-800 text-white text-sm font-semibold disabled:opacity-60"
            >
              {changePassword.isPending
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Salvando...</span>
                : "Salvar nova senha"
              }
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          SEÇÃO 5 — LOGOUT
      ══════════════════════════════════════════════════ */}
      <button
        onClick={handleSignOut}
        disabled={signOut.isPending}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-sm font-semibold active:bg-red-100 transition-colors disabled:opacity-60"
      >
        {signOut.isPending
          ? <Loader2 size={16} className="animate-spin" />
          : <LogOut size={16} />
        }
        {signOut.isPending ? "Saindo..." : "Sair da conta"}
      </button>

      {/* Versão do app */}
      <p className="text-center text-xs text-gray-300 pb-2">FinanceAI v1.0</p>

    </div>
  );
}