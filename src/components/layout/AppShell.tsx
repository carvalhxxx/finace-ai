import { useState, useEffect }         from "react";
import { Outlet }                       from "react-router-dom";
import { BottomNav }                    from "./BottomNav";
import { Header }                       from "./Header";
import { TransactionForm }              from "@/components/shared/TransactionForm";
import { useToast }                     from "@/components/shared/Toast";
import { useProcessRecurring }          from "@/hooks/useRecurring";

export interface AppShellContext {
  openAddTransaction: () => void;
  showToast:          (message: string, type?: "success" | "error" | "warning") => void;
}

export function AppShell() {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const { showToast, ToastContainer } = useToast();
  const processRecurring = useProcessRecurring();

  // Processa recorrências ao abrir o app
  useEffect(() => {
    processRecurring.mutate();
  }, []);

  const openAddTransaction  = () => setIsAddingTransaction(true);
  const closeAddTransaction = () => setIsAddingTransaction(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">

      <Header />

      {/* Toast — fica acima de tudo */}
      <ToastContainer />

      <main className="flex-1 pb-24 overflow-y-auto" style={{ paddingTop: "calc(4rem + env(safe-area-inset-top))" }}>
        <Outlet context={{ openAddTransaction, showToast } satisfies AppShellContext} />
      </main>

      <BottomNav onAddTransaction={openAddTransaction} />

      {isAddingTransaction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={closeAddTransaction}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "92vh", touchAction: "pan-y" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <button onClick={closeAddTransaction} className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200">✕</button>
            </div>
            <div className="overflow-y-auto px-6 pb-8 pt-2">
              <TransactionForm
                onClose={closeAddTransaction}
                onSuccess={() => {
                  closeAddTransaction();
                  showToast("Transação salva com sucesso!");
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}