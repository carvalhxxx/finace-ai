// ============================================================
// useCategories — HOOK DE CATEGORIAS
// ============================================================
// Busca as categorias do usuário e oferece utilitários
// para filtrar por tipo (income/expense).
//
//   useCategories()          → todas as categorias
//   useCategoriesByType()    → filtradas por income ou expense
//
// Lembra que na migration criamos um trigger que insere
// 12 categorias padrão automaticamente para cada novo usuário.
// Este hook busca essas categorias (e quaisquer outras que
// o usuário criar no futuro).
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Category, CreateCategory, CategoryType } from "@/types";

const QUERY_KEY = ["categories"];

// ============================================================
// BUSCAR CATEGORIAS
// ============================================================

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEY,

    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true }); // ordem alfabética

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CATEGORIAS POR TIPO
// ============================================================
// Retorna apenas as categorias de um tipo específico.
// Usado no formulário de transação para mostrar só categorias
// de despesa quando o tipo selecionado for "expense", e
// só receitas quando for "income".
//
// Exemplo:
//   useCategoriesByType("expense") →
//   [Alimentação, Transporte, Moradia, Saúde, ...]
//
//   useCategoriesByType("income") →
//   [Salário, Freelance, Investimentos, ...]

export function useCategoriesByType(type: CategoryType) {
  const { data: categories = [], ...rest } = useCategories();

  // filter() roda em memória — sem query extra ao banco
  const filtered = categories.filter((cat) => cat.type === type);

  return { ...rest, data: filtered };
}

// ============================================================
// CRIAR CATEGORIA
// ============================================================

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: CreateCategory) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Category;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ============================================================
// DELETAR CATEGORIA
// ============================================================
// Atenção: não é possível deletar uma categoria que tenha
// transações vinculadas (ON DELETE RESTRICT no banco).
// O componente deve avisar o usuário sobre isso.

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      // Erro específico de restrição de chave estrangeira
      if (error?.code === "23503") {
        throw new Error(
          "Não é possível excluir uma categoria que possui transações vinculadas."
        );
      }

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
