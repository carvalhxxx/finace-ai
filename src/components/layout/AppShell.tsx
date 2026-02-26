// ============================================================
// APP SHELL — LAYOUT BASE
// ============================================================
// Wrapper de todas as telas autenticadas do app.
// Qualquer página dentro da rota "/" passa por aqui.
//
// Estrutura visual:
//
//  ┌─────────────────────┐  ← fixo no topo (Header)
//  │       Header        │
//  ├─────────────────────┤
//  │                     │
//  │   <Outlet />        │  ← conteúdo da página atual
//  │   (página atual)    │
//  │                     │
//  ├─────────────────────┤
//  │     BottomNav       │  ← fixo na parte de baixo
//  └─────────────────────┘
//
// O <Outlet /> é do React Router — ele é substituído
// automaticamente pelo componente da rota filha ativa.
// Ex: se o usuário está em "/reports", o Outlet vira <Reports />
// ============================================================

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { TransactionForm } from "@/components/shared/TransactionForm";

// Contexto passado para as páginas filhas via Outlet.
// Qualquer página pode chamar openAddTransaction() para
// abrir o modal de nova transação — sem precisar passar
// props manualmente por vários níveis de componentes.
export interface AppShellContext {
  openAddTransaction: () => void;
}

export function AppShell() {
  // Controla se o modal de nova transação está visível.
  // Fica aqui pois tanto o FAB da BottomNav quanto botões
  // dentro das páginas podem precisar abrir esse modal.
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const openAddTransaction  = () => setIsAddingTransaction(true);
  const closeAddTransaction = () => setIsAddingTransaction(false);

  return (
    // max-w-lg + mx-auto: limita a largura em telas grandes
    // para o app não ficar esticado demais no desktop,
    // mantendo a aparência de app mobile centralizado.
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">

      {/* Header fixo no topo */}
      <Header />

      {/* Conteúdo da página atual
          pt-16 → empurra o conteúdo para baixo do Header (h-16)
          pb-24 → empurra o conteúdo para cima da BottomNav (h-16)
                  com folga extra para o FAB que sobe acima da nav */}
      <main className="flex-1 pb-24 overflow-y-auto" style={{ paddingTop: "calc(4rem + env(safe-area-inset-top))" }}>
        {/* context passa dados e funções para as páginas filhas
            sem precisar de prop drilling ou Context API separado */}
        <Outlet context={{ openAddTransaction } satisfies AppShellContext} />
      </main>

      {/* Navegação inferior com o FAB central */}
      <BottomNav onAddTransaction={openAddTransaction} />

      {/* Bottom sheet — formulário de nova transação
          O overflow-y-auto permite scroll dentro do painel
          caso o conteúdo seja maior que a tela (ex: iPhone SE) */}
      {isAddingTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={closeAddTransaction}
        >
          {/* Fundo escurecido */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Painel */}
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "92vh", touchAction: "pan-y" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do painel: indicador + botão fechar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <button
                onClick={closeAddTransaction}
                className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Área com scroll — o formulário fica aqui */}
            <div className="overflow-y-auto px-6 pb-8 pt-2">
              <TransactionForm onClose={closeAddTransaction} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}