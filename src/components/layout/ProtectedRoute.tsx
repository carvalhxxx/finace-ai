// ============================================================
// PROTECTED ROUTE — GUARDA DE ROTAS
// ============================================================
// Componente que protege rotas privadas.
// Envolve o AppShell no App.tsx para que TODAS as telas
// autenticadas sejam protegidas de uma vez só.
//
// Fluxo de decisão:
//
//   Abrindo o app
//        ↓
//   loading = true → mostra tela de carregamento
//        ↓
//   loading = false
//        ↓
//   user existe? ──── sim ──→ renderiza a página normalmente
//        │
//       não
//        ↓
//   redireciona para /login
//
// O "state: { from: location }" guarda qual rota o usuário
// tentou acessar. Após o login, podemos redirecioná-lo de
// volta para lá ao invés de sempre ir para a home.
// ============================================================

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── ESTADO 1: ainda verificando sessão ───────────────────
  // Mostra uma tela de splash enquanto o Supabase checa
  // se existe sessão salva no navegador.
  // Dura apenas uma fração de segundo na prática.
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">

        {/* Logo animado durante o carregamento */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-3xl font-bold">$</span>
        </div>

        <p className="text-sm text-gray-400">Carregando...</p>

      </div>
    );
  }

  // ── ESTADO 2: não está logado ─────────────────────────────
  // Redireciona para /login e guarda a rota atual em "from".
  // Exemplo: usuário tenta acessar /goals sem estar logado
  // → vai para /login
  // → após logar, voltará para /goals automaticamente
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace // replace: não adiciona /goals no histórico antes do /login
      />
    );
  }

  // ── ESTADO 3: está logado ─────────────────────────────────
  // Renderiza normalmente o conteúdo protegido
  return <>{children}</>;
}
