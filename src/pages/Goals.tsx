// ============================================================
// GOALS — METAS FINANCEIRAS
// ============================================================
// Placeholder da tela de metas.
// Na Fase 3 terá: criação de metas, barra de progresso,
// histórico de contribuições e alertas de prazo.
// ============================================================

// ============================================================
// GOALS — TELA DE METAS FINANCEIRAS
// ============================================================

import { useState }          from "react";
import { Plus, Trash2, Target, Loader2, ChevronDown } from "lucide-react";
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  goalProgress,
  daysUntilDeadline,
} from "@/hooks/useGoals";
import { formatCurrency, cn } from "@/lib/utils";
import { CreateGoal }         from "@/types";

const GOAL_ICONS  = ["🎯","✈️","🏠","🚗","📱","💻","🎓","💍","🏋️","🌴","💰","🏦"];
const GOAL_COLORS = [
  "#22c55e","#3b82f6","#f97316","#a855f7",
  "#ef4444","#f59e0b","#0ea5e9","#ec4899",
];

export function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal  = useCreateGoal();
  const updateGoal  = useUpdateGoal();
  const deleteGoal  = useDeleteGoal();

  const [showForm, setShowForm]               = useState(false);
  const [contributeId, setContributeId]       = useState<string | null>(null);
  const [contributeValue, setContributeValue] = useState("");
  const [name, setName]         = useState("");
  const [target, setTarget]     = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon]         = useState("🎯");
  const [color, setColor]       = useState("#22c55e");
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async () => {
    setFormError(null);
    const targetNum = parseFloat(target.replace(",", "."));
    if (!name.trim())                                      { setFormError("Informe o nome da meta."); return; }
    if (!target || isNaN(targetNum) || targetNum <= 0)    { setFormError("Informe um valor válido."); return; }
    try {
      await createGoal.mutateAsync({ name: name.trim(), target_amount: targetNum, current_amount: 0, deadline: deadline || undefined, icon, color } as CreateGoal);
      setName(""); setTarget(""); setDeadline(""); setIcon("🎯"); setColor("#22c55e");
      setShowForm(false);
    } catch { setFormError("Erro ao criar meta. Tente novamente."); }
  };

  const handleContribute = async (goalId: string, currentAmount: number) => {
    const value = parseFloat(contributeValue.replace(",", "."));
    if (!contributeValue || isNaN(value) || value <= 0) return;
    await updateGoal.mutateAsync({ id: goalId, current_amount: currentAmount + value });
    setContributeId(null);
    setContributeValue("");
  };

  return (
    <div className="px-4 py-5 space-y-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Metas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{goals.length} {goals.length === 1 ? "meta ativa" : "metas ativas"}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md shadow-emerald-500/20 active:scale-95 transition-transform">
          <Plus size={16} />Nova meta
        </button>
      </div>

      {/* Loading */}
      {isLoading && [1,2].map((i) => <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}

      {/* Lista vazia */}
      {!isLoading && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <Target size={36} className="text-emerald-300" />
          </div>
          <h2 className="text-base font-semibold text-gray-700">Nenhuma meta ainda</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">Crie sua primeira meta e acompanhe seu progresso financeiro!</p>
          <button onClick={() => setShowForm(true)} className="mt-5 bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-emerald-500/20">Criar primeira meta</button>
        </div>
      )}

      {/* Cards de metas */}
      {!isLoading && goals.map((goal) => {
        const progress   = goalProgress(goal);
        const days       = daysUntilDeadline(goal.deadline);
        const isExpanded = contributeId === goal.id;
        return (
          <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${goal.color}18` }}>{goal.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{goal.name}</p>
                    {days !== null && (
                      <p className={cn("text-xs mt-0.5", days < 0 ? "text-red-400" : days < 30 ? "text-amber-500" : "text-gray-400")}>
                        {days < 0 ? "Prazo encerrado" : days === 0 ? "Vence hoje!" : `${days} dias restantes`}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteGoal.mutate(goal.id)} className="p-1.5 text-gray-300 active:text-red-400 transition-colors"><Trash2 size={16} /></button>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-lg font-bold text-gray-800">{formatCurrency(goal.current_amount)}</span>
                <span className="text-xs text-gray-400">de {formatCurrency(goal.target_amount)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{progress.toFixed(0)}% concluído</span>
                {progress >= 100 && <span className="text-xs font-semibold text-emerald-500">🎉 Meta atingida!</span>}
              </div>
            </div>
            <button onClick={() => setContributeId(isExpanded ? null : goal.id)} className="w-full flex items-center justify-between px-4 py-3 border-t border-gray-50 text-sm text-emerald-500 font-medium active:bg-emerald-50 transition-colors">
              <span>+ Adicionar valor</span>
              <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input type="text" inputMode="decimal" value={contributeValue} onChange={(e) => setContributeValue(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" autoFocus />
                </div>
                <button onClick={() => handleContribute(goal.id, goal.current_amount)} disabled={updateGoal.isPending} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                  {updateGoal.isPending ? <Loader2 size={16} className="animate-spin" /> : "OK"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom sheet: nova meta */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: "92vh", touchAction: "pan-y" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <button onClick={() => setShowForm(false)} className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200">✕</button>
            </div>
            <div className="overflow-y-auto px-6 pb-8 pt-3 space-y-5">
              <h2 className="text-base font-semibold text-gray-800">Nova meta</h2>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nome da meta</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem para Europa" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Valor alvo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input type="text" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Prazo <span className="text-gray-300">(opcional)</span></label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {GOAL_ICONS.map((i) => (
                    <button key={i} onClick={() => setIcon(i)} className={cn("h-11 rounded-2xl text-xl border-2 transition-all", icon === i ? "border-emerald-400 bg-emerald-50" : "border-transparent bg-gray-50")}>{i}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={cn("w-9 h-9 rounded-full border-4 transition-all", color === c ? "border-gray-400 scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              {formError && <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3"><p className="text-sm text-red-500">{formError}</p></div>}
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium">Cancelar</button>
                <button onClick={handleCreate} disabled={createGoal.isPending} className="flex-[2] py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-60">
                  {createGoal.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Salvando...</span> : "Criar meta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
