// ============================================================
// BOTTOM NAV — NAVEGAÇÃO INFERIOR
// ============================================================
// Barra de navegação fixada na parte de baixo da tela.
// Padrão universal em apps mobile (Instagram, Nubank, iFood).
//
// Layout:
//
//  [ Início ]  [ Relatórios ]  [ ➕ ]  [ Metas ]  [ Perfil ]
//                               FAB
//                          (destaque verde,
//                           sobe acima da barra)
//
// O FAB (Floating Action Button) é a ação mais importante:
// adicionar uma nova transação. Fica no centro e maior que
// os outros itens para chamar atenção.
// ============================================================

import { NavLink, useLocation } from "react-router-dom";
import { Home, BarChart2, Plus, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Definição dos itens de navegação
// Separamos em dois grupos (esquerda e direita) por causa do FAB central
const LEFT_NAV_ITEMS = [
  { to: "/",        icon: Home,      label: "Início"     },
  { to: "/reports", icon: BarChart2, label: "Relatórios" },
];

const RIGHT_NAV_ITEMS = [
  { to: "/goals",   icon: Target,    label: "Metas"      },
  { to: "/profile", icon: User,      label: "Perfil"     },
];

interface BottomNavProps {
  onAddTransaction: () => void;
}

export function BottomNav({ onAddTransaction }: BottomNavProps) {
  const location = useLocation();

  return (
    // fixed bottom-0: sempre colado na parte de baixo
    // pb-safe: respeita a safe area do iPhone (home indicator)
    // z-40: fica acima do conteúdo mas abaixo de modais (z-50)
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

        {/* FAB central — botão de destaque
            -mt-6: sobe o botão acima da barra
            O espaço vazio no centro da nav é preenchido por ele */}
        <div className="flex flex-col items-center justify-center -mt-6">
          <button
            onClick={onAddTransaction}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "bg-emerald-500 text-white",
              "shadow-lg shadow-emerald-500/30",
              // active: dá feedback visual ao toque
              "active:scale-95 transition-transform duration-100"
            )}
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
          />
        ))}

      </div>
    </nav>
  );
}

// ── COMPONENTE AUXILIAR ──────────────────────────────────────
// Cada item individual da navegação.
// Separado para manter o código limpo e reutilizável.

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function NavItem({ to, icon: Icon, label, active }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className="flex flex-col items-center justify-center gap-0.5 w-16 py-1"
    >
      {/* Indicador de ativo: bolinha acima do ícone */}
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
      </div>

      {/* Label */}
      <span className={cn(
        "text-[10px] font-medium transition-colors duration-200",
        active ? "text-emerald-500" : "text-gray-400"
      )}>
        {label}
      </span>
    </NavLink>
  );
}
