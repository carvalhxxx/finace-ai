// ============================================================
// HEADER — CABEÇALHO FIXO
// ============================================================
// Aparece no topo de todas as telas autenticadas.
//
// Comportamento:
// - Nas 4 telas principais (/, /reports, /goals, /profile):
//   mostra o logo à esquerda e o ícone de notificações à direita
//
// - Em telas internas (futuras, ex: /transactions/123):
//   mostra botão de voltar à esquerda e título da página
//
// useLocation() → hook do React Router que retorna a rota atual
// useNavigate() → hook do React Router para navegar entre rotas
// ============================================================

import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft }              from "lucide-react";
import { AlertsBadge }              from "@/components/shared/AlertsBadge";

// Mapa de rotas → títulos exibidos no centro do header
const PAGE_TITLES: Record<string, string> = {
  "/":         "Visão Geral",
  "/reports":  "Relatórios",
  "/goals":    "Metas",
  "/profile":  "Perfil",
};

// Rotas raiz = as 4 telas principais da BottomNav
const ROOT_PAGES = Object.keys(PAGE_TITLES);

export function Header() {
  const location = useLocation();
  const navigate  = useNavigate();

  const isRootPage = ROOT_PAGES.includes(location.pathname);
  const title      = PAGE_TITLES[location.pathname] ?? "Voltar";

  return (
    // fixed top-0: fica colado no topo mesmo ao rolar a página
    // backdrop-blur-sm: efeito de vidro fosco quando o conteúdo
    // passa por baixo ao rolar — muito usado em apps iOS
    // max-w-lg + left-0/right-0: alinha com o AppShell centralizado
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100 max-w-lg mx-auto">
      <div className="flex items-center justify-between h-full px-4">

        {/* ── LADO ESQUERDO ──────────────────────────────────
            Telas principais → logo/ícone do app
            Telas internas   → botão de voltar              */}
        <div className="w-10">
          {isRootPage ? (
            // Logo simples — substituir por SVG real futuramente
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">$</span>
            </div>
          ) : (
            <button
              onClick={() => navigate(-1)} // -1 = página anterior
              className="p-1 -ml-1 text-gray-600 active:text-emerald-500 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>

        {/* ── CENTRO ─────────────────────────────────────────
            Título da página atual                           */}
        <h1 className="text-base font-semibold text-gray-800">
          {title}
        </h1>

        {/* ── LADO DIREITO ───────────────────────────────────
            Sino funcional com badge dinâmico de alertas     */}
        <AlertsBadge />

      </div>
    </header>
  );
}
