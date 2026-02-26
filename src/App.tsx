// ============================================================
// APP.TSX — ROTEADOR PRINCIPAL (atualizado)
// ============================================================
// Mudança em relação à versão anterior:
//
// O AppShell agora está envolvido pelo ProtectedRoute.
// Isso significa que TODAS as rotas filhas (/, /reports,
// /goals, /profile) são automaticamente protegidas.
//
// Fluxo completo:
//   Usuário acessa "/"
//     → ProtectedRoute verifica sessão
//     → sem sessão: redireciona para /login
//     → com sessão: renderiza AppShell → Dashboard
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Layout
import { AppShell }       from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// Páginas
import { Dashboard }    from "@/pages/Dashboard";
import { Reports }      from "@/pages/Reports";
import { Goals }        from "@/pages/Goals";
import { Profile }      from "@/pages/Profile";
import { Login }        from "@/pages/Login";
import { Transactions } from "@/pages/Transactions";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas
              ProtectedRoute envolve o AppShell inteiro —
              qualquer rota filha abaixo já está protegida */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index           element={<Dashboard />}    />
            <Route path="reports"  element={<Reports />}      />
            <Route path="goals"    element={<Goals />}        />
            <Route path="profile"  element={<Profile />}      />
            <Route path="transactions" element={<Transactions />} />
          </Route>

          {/* Rota desconhecida → home */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;