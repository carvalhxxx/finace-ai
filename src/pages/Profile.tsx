// ============================================================
// PROFILE — PERFIL DO USUÁRIO
// ============================================================
// Placeholder da tela de perfil.
// Na Fase 1 terá: dados do usuário logado via Supabase Auth,
// botão de logout, e configurações de moeda e preferências.
// ============================================================

export function Profile() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

      <div className="w-20 h-20 rounded-3xl bg-purple-50 flex items-center justify-center mb-5">
        <span className="text-4xl">👤</span>
      </div>

      <h2 className="text-lg font-semibold text-gray-800">Perfil</h2>
      <p className="text-sm text-gray-400 mt-2 max-w-xs">
        Configurações de conta e preferências chegam na Fase 1.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-2">
        {["Dados pessoais", "Moeda padrão", "Notificações", "Sair da conta"].map((item) => (
          <div key={item} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <span className="text-sm text-gray-400">{item}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
