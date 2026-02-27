// ============================================================
// TIPOS GLOBAIS DA APLICAÇÃO
// ============================================================

// --- USUÁRIO ---
export interface Profile {
  id: string;
  name: string;
  email: string;
  currency: string; // ex: "BRL"
  avatar_url?: string;
  created_at: string;
}

// --- CONTA BANCÁRIA ---
// Representa uma conta real do usuário (Nubank, Carteira, etc)
export type AccountType = "checking" | "savings" | "investment" | "wallet";

export interface Account {
  id:          string;
  user_id:     string;
  name:        string;
  type:        AccountType;
  balance:     number;
  color:       string;
  icon?:       string;
  accumulates: boolean; // true = saldo acumula mês a mês
  created_at:  string;
}

// --- TRANSAÇÃO RECORRENTE ---
// Representa uma transação que se repete todo mês automaticamente.
// Ex: Salário, VR, Aluguel, Academia.

export interface RecurringTransaction {
  id:           string;
  user_id:      string;
  account_id:   string;
  category_id:  string;
  description:  string;
  amount:       number;
  type:         TransactionType;
  day_of_month: number; // dia do mês que entra (1-31)
  active:       boolean;
  created_at:   string;
  // Joins opcionais
  category?: Category;
  account?:  Account;
}

export type CreateRecurring = Omit<RecurringTransaction, "id" | "user_id" | "created_at" | "category" | "account">;

// --- CATEGORIA ---
// Agrupa transações: Alimentação, Transporte, Salário, etc
export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;   // emoji
  color: string;
  type: CategoryType;
}

// --- TRANSAÇÃO ---
// O coração do app. Cada gasto ou receita registrado.
export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  created_at: string;
  installment_id?: string; // presente se for uma parcela
  recurring_id?:   string; // presente se foi gerada por recorrência
  // Joins opcionais
  account?: Account;
  category?: Category;
}

// --- META FINANCEIRA ---
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  color: string;
  icon: string;
  created_at: string;
}

// --- ALERTA ---
// Ex: "Me avise quando gastar mais de R$500 em restaurantes"
export type AlertPeriod = "weekly" | "monthly";

export interface Alert {
  id: string;
  user_id: string;
  category_id: string;
  limit_amount: number;
  period: AlertPeriod;
  active: boolean;
  created_at: string;
  category?: Category;
}

// --- PARCELAMENTO ---
// Representa uma compra parcelada no cartão.
// As parcelas individuais ficam em transactions com installment_id.

export interface Installment {
  id:                 string;
  user_id:            string;
  description:        string;
  total_amount:       number; // valor total da compra
  installment_amount: number; // valor de cada parcela
  installment_count:  number; // quantas parcelas no total
  paid_count:         number; // quantas já foram pagas
  category_id:        string;
  account_id:         string;
  start_date:         string; // data da primeira parcela
  created_at:         string;
  // Joins opcionais
  category?: Category;
  account?:  Account;
}

// --- UTILITÁRIOS ---
// Tipos para formulários: omitimos campos gerados pelo banco
export type CreateTransaction = Omit<Transaction, "id" | "user_id" | "created_at" | "account" | "category">;
export type CreateAccount     = Omit<Account,      "id" | "user_id" | "created_at">;
export type CreateCategory    = Omit<Category,     "id" | "user_id">;
export type CreateGoal        = Omit<Goal,         "id" | "user_id" | "created_at">;
export type CreateInstallment = Omit<Installment, "id" | "user_id" | "created_at" | "paid_count" | "category" | "account"> & { already_paid?: number; };
export type CreateAlert = Omit<Alert, "id" | "user_id" | "created_at" | "category">;

// Resumo financeiro para o dashboard
export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
}