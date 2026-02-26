// ============================================================
// UTILITÁRIOS GLOBAIS
// ============================================================
// Funções pequenas e reutilizáveis usadas em todo o app.
// Centralizadas aqui para não repetir lógica nos componentes.
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- cn() ---
// Função do shadcn/ui para combinar classes Tailwind.
// Resolve conflitos de classes automaticamente.
//
// Problema sem cn():
//   className={`p-4 ${condition ? "p-8" : ""}`}
//   → resultado: "p-4 p-8" (conflito! qual vale?)
//
// Com cn():
//   className={cn("p-4", condition && "p-8")}
//   → resultado: "p-8" (o tailwind-merge resolve o conflito)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- formatCurrency() ---
// Formata um número para moeda brasileira.
//
// formatCurrency(4250.8)  → "R$ 4.250,80"
// formatCurrency(55.9)    → "R$ 55,90"
// formatCurrency(0)       → "R$ 0,00"
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// --- formatDate() ---
// Formata uma data ISO para formato legível em pt-BR.
//
// formatDate("2024-02-26") → "26 de fev."
// formatDate("2024-12-01") → "01 de dez."
export function formatDate(dateStr: string): string {
  // O "T12:00:00" evita o bug de fuso horário onde
  // "2024-02-26" vira "25 de fev." em alguns sistemas
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// --- formatMonthYear() ---
// Retorna o mês e ano atuais por extenso.
//
// → "fevereiro de 2024"
export function formatMonthYear(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

// --- getInitials() ---
// Extrai as iniciais de um nome para usar em avatares.
//
// getInitials("João Silva")   → "JS"
// getInitials("Maria")        → "MA"
// getInitials("")             → "?"
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --- hexToRgba() ---
// Converte cor hex para rgba com opacidade — usada nos
// fundos dos ícones de categoria.
//
// hexToRgba("#22c55e", 0.15) → "rgba(34, 197, 94, 0.15)"
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}