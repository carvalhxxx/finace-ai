// ============================================================
// TIPOS GLOBAIS DA APLICAÇÃO
// Aqui definimos as "formas" de todos os dados que vamos usar.
// TypeScript usa isso para garantir que nunca passemos dados
// errados para um componente ou função.
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
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string; // cor para identificação visual
  icon?: string;
  created_at: string;
}

// --- CATEGORIA ---
// Agrupa transações: Alimentação, Transporte, Salário, etc
export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;   // emoji ou nome de ícone
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
  date: string; // ISO 8601: "2024-02-26"
  created_at: string;
  // Joins opcionais (quando buscamos com dados relacionados)
  account?: Account;
  category?: Category;
}

// --- META FINANCEIRA ---
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;   // quanto quer atingir
  current_amount: number;  // quanto já tem
  deadline?: string;       // data limite (opcional)
  category_id?: string;
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

// --- UTILITÁRIOS ---
// Tipos auxiliares usados em vários lugares

// Para formulários: omitimos campos gerados pelo banco
export type CreateTransaction = Omit<Transaction, "id" | "user_id" | "created_at" | "account" | "category">;
export type CreateAccount = Omit<Account, "id" | "user_id" | "created_at">;
export type CreateCategory = Omit<Category, "id" | "user_id">;
export type CreateGoal = Omit<Goal, "id" | "user_id" | "created_at">;
export type CreateAlert = Omit<Alert, "id" | "user_id" | "created_at" | "category">;

// Resumo financeiro para o dashboard
export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number; // receitas - despesas
}