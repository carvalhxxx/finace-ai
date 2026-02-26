// ============================================================
// LOGIN — AUTENTICAÇÃO REAL COM SUPABASE
// ============================================================
// Substitui o placeholder pela tela de login funcional.
//
// Funcionalidades:
// - Alternar entre "Entrar" e "Criar conta"
// - Validação básica dos campos antes de enviar
// - Feedback de erro vindo do Supabase (senha errada, etc)
// - Loading no botão enquanto aguarda resposta
// - Após login bem sucedido, redireciona para onde o usuário
//   tentou ir (ou para "/" se veio direto do /login)
// ============================================================

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

export function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { signIn, signUp } = useAuth();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const [mode, setMode]                 = useState<AuthMode>("signin");
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) { setError("Preencha todos os campos."); return; }
    if (mode === "signup" && !name) { setError("Informe seu nome."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    const { error: authError } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name);
    setLoading(false);

    if (authError) { setError(translateError(authError)); return; }
    navigate(from, { replace: true });
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Hero */}
      <div className="bg-gray-900 flex flex-col items-center justify-center px-8 py-14">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5">
          <span className="text-white text-3xl font-bold">$</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">FinanceAI</h1>
        <p className="text-gray-400 text-sm mt-2">Seu assistente financeiro pessoal</p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-t-3xl -mt-4 flex-1 px-6 py-8">

        {/* Abas */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {(["signin", "signup"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                mode === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              )}
            >
              {m === "signin" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === "signup" && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              autoComplete="email"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 pr-12 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-4 rounded-2xl text-sm font-semibold transition-all mt-2",
              "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
              "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Aguarde...
              </span>
            ) : (
              mode === "signin" ? "Entrar" : "Criar minha conta"
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

function translateError(error: string): string {
  if (error.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (error.includes("Email not confirmed"))        return "Confirme seu e-mail antes de entrar.";
  if (error.includes("User already registered"))    return "Este e-mail já está cadastrado.";
  if (error.includes("Password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (error.includes("Unable to validate email"))   return "E-mail inválido.";
  return "Algo deu errado. Tente novamente.";
}
