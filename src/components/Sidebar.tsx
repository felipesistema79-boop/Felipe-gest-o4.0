import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  ShoppingCart,
  ClipboardList,
  BrainCircuit,
  BarChart3,
  Users,
  Wrench,
  Settings,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  primaryColor: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  primaryColor,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Painel Principal',
      subtitle: 'KPIs e Gargalos',
      icon: LayoutDashboard,
    },
    {
      id: 'obras',
      label: 'Gestão de Obras',
      subtitle: 'Fluxo de Produção Core',
      icon: HardHat,
    },
    {
      id: 'compras',
      label: 'Controle de Compras',
      subtitle: 'Pedidos & Prazos',
      icon: ShoppingCart,
    },
    {
      id: 'requisicao',
      label: 'Requisição Materiais',
      subtitle: 'PDFs & Conferência',
      icon: ClipboardList,
    },
    {
      id: 'inteligencia',
      label: 'Inteligência & Decisão',
      subtitle: 'PDCA, Eisenhower, GUT',
      icon: BrainCircuit,
    },
    {
      id: 'relatorios',
      label: 'Relatórios & Analytics',
      subtitle: 'Mapeamento & PDF',
      icon: BarChart3,
    },
    {
      id: 'cadastros',
      label: 'Cadastros Auxiliares',
      subtitle: 'Vendedores & Fornecedores',
      icon: Users,
    },
    {
      id: 'manutencao',
      label: 'Manutenção',
      subtitle: 'Máquinas & Ferramentas',
      icon: Wrench,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      subtitle: 'Branding, Backup & Excel',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex flex-col shrink-0 transition-colors duration-150">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Módulos do Sistema
        </p>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-orange-600 dark:bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/30 ring-1 ring-orange-500'
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-orange-950/30'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition ${
                    isActive
                      ? 'bg-white/20 text-white ring-1 ring-white/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className={`text-xs font-bold leading-none truncate ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
                    {item.label}
                  </p>
                  <p className={`text-[10px] truncate mt-1 ${isActive ? 'text-orange-100' : 'text-slate-500 dark:text-slate-400 group-hover:text-orange-600/80 dark:group-hover:text-orange-300/80'}`}>
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  isActive ? 'rotate-90 text-white' : 'text-slate-400 dark:text-slate-600 group-hover:text-orange-500 dark:group-hover:text-orange-400'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
        SGM ERP v2026.1 • Desenvolvido por Felipe Martinelli
      </div>
    </aside>
  );
};
