// ============================================================
// TOAST — NOTIFICAÇÃO TEMPORÁRIA
// ============================================================
// Aparece no topo da tela por 3 segundos e desaparece.
// Usado para feedback de ações como salvar transação,
// criar meta, deletar item, etc.
//
// Uso:
//   const { showToast, ToastContainer } = useToast();
//   showToast("Transação salva!", "success");
//   <ToastContainer />  ← coloca no AppShell
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning";

interface Toast {
  id:      number;
  message: string;
  type:    ToastType;
}

// ── HOOK ─────────────────────────────────────────────────────
// Gerencia a fila de toasts e expõe showToast()

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, message, type }]);

    // Remove automaticamente após 3 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Componente renderizável com todos os toasts ativos
  const ToastContainer = useCallback(() => (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none max-w-lg mx-auto"
      style={{ paddingTop: "calc(4rem + env(safe-area-inset-top) + 8px)" }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  ), [toasts, removeToast]);

  return { showToast, ToastContainer };
}

// ── ITEM DE TOAST ─────────────────────────────────────────────

interface ToastItemProps {
  toast:   Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  // Anima entrada e saída
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para acionar a animação de entrada
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />,
    error:   <XCircle     size={16} className="text-red-500 flex-shrink-0"     />,
    warning: <AlertCircle size={16} className="text-amber-500 flex-shrink-0"   />,
  };

  const styles = {
    success: "bg-white border-emerald-100",
    error:   "bg-white border-red-100",
    warning: "bg-white border-amber-100",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg shadow-black/5 transition-all duration-300 mx-4",
        styles[toast.type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-gray-700 font-medium flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-gray-300 active:text-gray-500 ml-1">
        <X size={14} />
      </button>
    </div>
  );
}