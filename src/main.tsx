// ============================================================
// MAIN.TSX — PONTO DE ENTRADA
// ============================================================
// O React começa aqui. Ele "monta" o componente App dentro
// do elemento <div id="root"> que existe no index.html do Vite.
//
// Sem esse arquivo, o React não sabe onde se "encaixar" na página.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // importa o Tailwind e estilos globais
import App from "./App";

// document.getElementById("root") busca o elemento no index.html:
// <div id="root"></div>
//
// O "!" no final diz ao TypeScript: "confie em mim, esse elemento
// existe" — sem ele, o TS reclamaria que pode ser null.
createRoot(document.getElementById("root")!).render(
  // StrictMode é um wrapper especial de desenvolvimento.
  // Ele detecta problemas comuns e avisa no console.
  // Em produção (npm run build), ele não tem nenhum efeito.
  <StrictMode>
    <App />
  </StrictMode>
);
