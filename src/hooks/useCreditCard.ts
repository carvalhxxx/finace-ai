// ============================================================
// useCreditCard — HOOK DE CARTÃO DE CRÉDITO
// ============================================================
//
//   useCreditCards()          → lista só contas do tipo credit_card
//   calcDueDate()             → calcula a data de vencimento dado
//                               a data da compra e o cartão
//   useCreditCardBalance()    → gastos da fatura aberta por cartão
//   useCreateCreditCard()     → cria um cartão de crédito
//
// ── LÓGICA DO CICLO DE FATURAMENTO ──────────────────────────
//
// Exemplo: fechamento dia 27, vencimento dia 10
//
//   Compra em 01/03 → antes do fechamento (27/03)
//     → fatura fecha em 27/03
//     → vence em 10/04
//     → date = 10/04
//
//   Compra em 28/03 → depois do fechamento (27/03)
//     → fatura fecha em 27/04
//     → vence em 10/05
//     → date = 10/05
//
// A data calculada (date) é o que aparece nos relatórios e
// afeta o saldo do dashboard — a purchase_date é só o registro
// de quando a compra foi feita.
// ============================================================

import { useQuery }    from "@tanstack/react-query";
import { supabase }    from "@/lib/supabase";
import { Account }     from "@/types";

// ============================================================
// BUSCAR CARTÕES DE CRÉDITO
// ============================================================

export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("type", "credit_card")
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ============================================================
// CALCULAR DATA DE VENCIMENTO DA FATURA
// ============================================================
// Dado uma data de compra e um cartão, retorna:
//   dueDate      → data de vencimento (date da transação)
//   closingDate  → data de fechamento da fatura
//   invoiceLabel → label legível ("Fatura Abril/2025")

export function calcDueDate(
  purchaseDate: string, // YYYY-MM-DD
  card: Account
): {
  dueDate:      string;
  closingDate:  string;
  invoiceLabel: string;
} {
  const closing = card.closing_day ?? 1;
  const due     = card.due_day     ?? 10;

  const purchase = new Date(`${purchaseDate}T12:00:00`);
  const purchaseDay = purchase.getDate();
  const purchaseMonth = purchase.getMonth(); // 0-indexed
  const purchaseYear  = purchase.getFullYear();

  // Determina em qual ciclo a compra cai
  // Se o dia da compra <= dia de fechamento → fatura do mês atual
  // Se o dia da compra >  dia de fechamento → fatura do próximo mês
  let closingMonth = purchaseMonth;
  let closingYear  = purchaseYear;

  if (purchaseDay > closing) {
    // Passou do fechamento → vai para o próximo ciclo
    closingMonth += 1;
    if (closingMonth > 11) { closingMonth = 0; closingYear += 1; }
  }

  // Data de fechamento
  const closingDate = new Date(closingYear, closingMonth, closing);

  // Data de vencimento = mês seguinte ao fechamento, no dia due
  let dueMonth = closingMonth + 1;
  let dueYear  = closingYear;
  if (dueMonth > 11) { dueMonth = 0; dueYear += 1; }

  const dueDate = new Date(dueYear, dueMonth, due);

  // Label da fatura
  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];
  const invoiceLabel = `Fatura ${monthNames[dueMonth]}/${dueYear}`;

  return {
    dueDate:      dueDate.toISOString().split("T")[0],
    closingDate:  closingDate.toISOString().split("T")[0],
    invoiceLabel,
  };
}

// ============================================================
// GASTOS DA FATURA ABERTA POR CARTÃO
// ============================================================
// Retorna quanto foi gasto em cada cartão na fatura atual
// (transações com credit_card_id = cartão e date no futuro
// ou no mês corrente).
// Usado para calcular o limite disponível no carrossel.

export function useCreditCardSpending() {
  return useQuery({
    queryKey: ["credit-card-spending"],
    queryFn: async (): Promise<Record<string, number>> => {
      const today = new Date().toISOString().split("T")[0];

      // Busca todas as transações de crédito ainda não vencidas
      // (fatura aberta = date >= hoje)
      const { data, error } = await supabase
        .from("transactions")
        .select("credit_card_id, amount")
        .not("credit_card_id", "is", null)
        .gte("date", today);

      if (error) throw new Error(error.message);

      // Soma por cartão
      const spending: Record<string, number> = {};
      (data ?? []).forEach((tx) => {
        if (!tx.credit_card_id) return;
        spending[tx.credit_card_id] =
          (spending[tx.credit_card_id] ?? 0) + tx.amount;
      });

      return spending;
    },
  });
}