import { StrictMode }    from "react";
import { createRoot }    from "react-dom/client";
import { registerSW }    from "virtual:pwa-register";
import App               from "./App";
import "./index.css";

// ── REGISTRA O SERVICE WORKER ─────────────────────────────
// O vite-plugin-pwa gera o SW automaticamente no build.
// registerSW() o ativa e configura o reload automático
// quando uma nova versão do app estiver disponível.

registerSW({
  onNeedRefresh() {
    // Nova versão disponível — poderíamos mostrar um toast aqui
    // Por enquanto atualiza automaticamente
    console.log("Nova versão disponível, atualizando...");
  },
  onOfflineReady() {
    console.log("App pronto para uso offline!");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);