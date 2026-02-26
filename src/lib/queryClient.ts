// ============================================================
// TANSTACK QUERY — CLIENTE GLOBAL
// O QueryClient é o "gerenciador de cache" da aplicação.
// Ele controla quanto tempo os dados ficam em cache, quando
// refazer as buscas automaticamente, e muito mais.
//
// staleTime: 1000 * 60 * 5 significa que os dados são
// considerados "frescos" por 5 minutos — nesse período,
// navegar entre telas NÃO refaz a requisição ao banco.
// ============================================================

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutos de cache
      retry: 1,                    // tenta 1x em caso de erro
      refetchOnWindowFocus: false, // não refaz ao trocar de aba
    },
  },
});