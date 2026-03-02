// ============================================================
// BOTTOM NAV — NAVEGAÇÃO INFERIOR
// ============================================================
// Layout:
//
//  [ Início ]  [ Relatórios ]  [ ➕ ]  [ Contas ]  [ Perfil ]
//                               FAB
//
// "Contas" = contas a pagar, com badge vermelho se houver
// contas vencendo em até 3 dias ou já vencidas.
// ============================================================

import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart2, Plus, Receipt, User } from "lucide-react";
import { cn }               from "@/lib/utils";
import { useUpcomingBills } from "@/hooks/useBills";

const LEFT_NAV_ITEMS = [
  { to: "/",        icon: Home,      label: "Início"     },
  { to: "/reports", icon: BarChart2, label: "Relatórios" },
];

const RIGHT_NAV_ITEMS = [
  { to: "/bills",   icon: Receipt,   label: "Contas"     },
  { to: "/profile", icon: User,      label: "Perfil"     },
];

interface BottomNavProps {
  onAddTransaction: () => void;
}

export function BottomNav({ onAddTransaction }: BottomNavProps) {
  const location      = useLocation();
  const upcomingBills = useUpcomingBills();
  const hasBillAlert  = upcomingBills.length > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] max-w-lg mx-auto pb-safe">
      <div className="flex items-center justify-around px-2 h-16">

        {/* Itens da esquerda */}
        {LEFT_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            active={location.pathname === item.to}
          />
        ))}

        {/* FAB central */}
        <div className="flex flex-col items-center justify-center -mt-6">
          <button
            onClick={onAddTransaction}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform duration-100"
            aria-label="Adicionar transação"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] text-gray-400 mt-1">Novo</span>
        </div>

        {/* Itens da direita */}
        {RIGHT_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            active={location.pathname === item.to}
            badge={item.to === "/bills" && hasBillAlert ? upcomingBills.length : undefined}
          />
        ))}

      </div>
    </nav>
  );
}

// ── NAV ITEM ────────────────────────────────────────────────

interface NavItemProps {
  to:     string;
  icon:   React.ElementType;
  label:  string;
  active: boolean;
  badge?: number;
}

function NavItem({ to, icon: Icon, label, active, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className="flex flex-col items-center justify-center gap-0.5 w-16 py-1"
    >
      <div className="relative flex items-center justify-center">
        {active && (
          <span className="absolute -top-1 w-1 h-1 rounded-full bg-emerald-500" />
        )}
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 1.8}
          className={cn(
            "transition-colors duration-200",
            active ? "text-emerald-500" : "text-gray-400"
          )}
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-colors duration-200",
        active ? "text-emerald-500" : "text-gray-400"
      )}>
        {label}
      </span>
    </NavLink>
  );
}