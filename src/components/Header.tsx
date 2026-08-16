import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bell,
  Calendar,
  ShieldCheck,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Lock,
  Unlock,
  ExternalLink,
  Maximize2,
  X,
  Smartphone,
  HardHat,
  ShoppingCart,
  Wrench,
  BarChart3,
  LayoutDashboard,
  ClipboardList,
  BrainCircuit,
  Info
} from 'lucide-react';
import { EmpresaConfig, Obra, Compra, Fornecedor } from '../types';
import { storageService } from '../services/storage';
import { onCloudSyncStatusChange, CloudSyncStatus } from '../services/firebase';
import { isOverdue } from '../utils/dateUtils';
import { NotificationModal } from './NotificationModal';
import { WorkspaceModal } from './WorkspaceModal';

interface HeaderProps {
  empresa: EmpresaConfig;
  obras?: Obra[];
  compras?: Compra[];
  fornecedores?: Fornecedor[];
  darkMode?: boolean;
  isReadOnly?: boolean;
  activeTab?: string;
  onToggleDarkMode?: () => void;
  onOpenNotifications?: () => void;
  onOpenWorkspace?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  empresa,
  obras: propsObras,
  compras: propsCompras,
  fornecedores = [],
  darkMode = false,
  isReadOnly = false,
  activeTab = 'dashboard',
  onToggleDarkMode,
  onOpenNotifications,
  onOpenWorkspace,
  onNavigateToTab,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [delayedObras, setDelayedObras] = useState<Obra[]>([]);
  const [delayedCompras, setDelayedCompras] = useState<Compra[]>([]);
  const [delayedManutencoesCount, setDelayedManutencoesCount] = useState<number>(0);
  const [comprasCotacaoCount, setComprasCotacaoCount] = useState<number>(0);
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);
  const [pendingInteligenciaCount, setPendingInteligenciaCount] = useState<number>(0);
  const [temObrasAtivasFabrica, setTemObrasAtivasFabrica] = useState<boolean>(false);
  const [allObras, setAllObras] = useState<Obra[]>([]);
  const [allCompras, setAllCompras] = useState<Compra[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('connecting');

  useEffect(() => {
    const unsub = onCloudSyncStatusChange((status) => {
      setCloudStatus(status);
    });
    return () => unsub();
  }, []);

  const checkAlerts = () => {
    const loadedObras = storageService.getObras().filter((o) => !o.arquivada);
    const loadedCompras = storageService.getCompras();
    const tasks = storageService.getGoogleTasks();
    const pdca = storageService.getPDCA();
    const eis = storageService.getEisenhower();
    const gut = storageService.getGUT();
    const five = storageService.getFiveWTwoH();
    const brain = storageService.getBrainstorming();
    const manutencoes = storageService.getManutencoes();
    const dismissed = storageService.getDismissedAlerts();

    setAllObras(loadedObras);
    setAllCompras(loadedCompras);

    const overObras = loadedObras.filter(
      (o) => isOverdue(o.dataPrevistaEntrega, o.statusGlobal) && !dismissed.includes(`obra-delayed-${o.id}`)
    );
    const overCompras = loadedCompras.filter((c) => {
      if (c.status === 'ENTREGUE') return false;
      return isOverdue(c.dataEntregaPrevista, c.status) && !dismissed.includes(`compra-delayed-${c.id}`);
    });

    const cotacoes = loadedCompras.filter(
      (c) => c.status === 'EM COTAÇÃO' && !dismissed.includes(`compra-cotacao-${c.id}`)
    );
    const activeTasks = tasks.filter((t) => !t.concluida && !dismissed.includes(`task-${t.id}`));

    const openPdca = pdca.filter((p) => p.status !== 'CONCLUÍDO' && !dismissed.includes(`pdca-${p.id}`));
    const openEis = eis.filter((e) => (e as any).concluido !== true && !dismissed.includes(`eisen-${e.id}`));
    const openGut = gut.filter((g) => (g as any).status !== 'CONCLUIDO' && !dismissed.includes(`gut-${g.id}`));
    const openFive = five.filter((f) => f.status !== 'CONCLUÍDO' && !dismissed.includes(`fivew-${f.id}`));
    const openBrain = brain.filter(
      (b) => (b.status === 'RASCUNHO' || b.status === 'SELECIONADA') && !dismissed.includes(`brain-${b.id}`)
    );

    const activeManutencoes = manutencoes.filter((m) => {
      if (m.status === 'CONCLUIDA' || m.status === 'CANCELADA') return false;
      if (dismissed.includes(`manutencao-${m.id}`)) return false;
      return true;
    });

    const totalInteligencia = openPdca.length + openEis.length + openGut.length + openFive.length + openBrain.length;

    const obrasFabrica = loadedObras.filter(
      (o) => o.statusGlobal !== 'ENTREGUE' && o.statusGlobal !== 'FINALIZADA'
    );
    const precisaAtualizar = obrasFabrica.length > 0 && !dismissed.includes('daily-production');

    setDelayedObras(overObras);
    setDelayedCompras(overCompras);
    setDelayedManutencoesCount(activeManutencoes.length);
    setComprasCotacaoCount(cotacoes.length);
    setPendingTasksCount(activeTasks.length);
    setPendingInteligenciaCount(totalInteligencia);
    setTemObrasAtivasFabrica(precisaAtualizar);
  };

  useEffect(() => {
    checkAlerts();
    window.addEventListener('sgm_storage_updated', checkAlerts);
    return () => window.removeEventListener('sgm_storage_updated', checkAlerts);
  }, []);

  const totalAlerts =
    delayedObras.length +
    delayedCompras.length +
    delayedManutencoesCount +
    comprasCotacaoCount +
    pendingTasksCount +
    pendingInteligenciaCount +
    (temObrasAtivasFabrica ? 1 : 0);

  // Base Clean URLs for sharing (ensuring no ?mode=view in general operational link)
  const getBaseCleanUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}`;
  };

  const baseCleanUrl = getBaseCleanUrl();
  const directFullAccessUrl = baseCleanUrl;
  const readOnlyUrl = `${baseCleanUrl}?mode=view`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const openFullscreenTab = (urlToOpen?: string) => {
    const targetUrl = urlToOpen || baseCleanUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // If iframe blocks fullscreen, open in new tab
        openFullscreenTab();
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const moduleShareLinks = [
    {
      id: 'obras',
      name: 'Gestão de Obras & Produção',
      icon: HardHat,
      url: `${baseCleanUrl}?tab=obras`,
      desc: 'Fluxo fabril, corte, usinagem, montagem e conferência de peças',
    },
    {
      id: 'compras',
      name: 'Controle de Compras',
      icon: ShoppingCart,
      url: `${baseCleanUrl}?tab=compras`,
      desc: 'Pedidos de compra, cotações com fornecedores e controle de entrega',
    },
    {
      id: 'dashboard',
      name: 'Painel Principal / Dashboard',
      icon: LayoutDashboard,
      url: `${baseCleanUrl}?tab=dashboard`,
      desc: 'Visão geral com KPIs, gargalos, radar de prazos e fluxo geral',
    },
    {
      id: 'manutencao',
      name: 'Manutenção de Equipamentos',
      icon: Wrench,
      url: `${baseCleanUrl}?tab=manutencao`,
      desc: 'Controle de máquinas, serras, ferramentas e ordens de manutenção',
    },
    {
      id: 'relatorios',
      name: 'Relatórios & Analytics',
      icon: BarChart3,
      url: `${baseCleanUrl}?tab=relatorios`,
      desc: 'Eficiência de produção, capacidade fabril e exportação de PDF',
    },
    {
      id: 'requisicao',
      name: 'Requisição de Materiais',
      icon: ClipboardList,
      url: `${baseCleanUrl}?tab=requisicao`,
      desc: 'Solicitações de material por obra com geração automática de compra',
    },
    {
      id: 'inteligencia',
      name: 'Inteligência & Tomada de Decisão',
      icon: BrainCircuit,
      url: `${baseCleanUrl}?tab=inteligencia`,
      desc: 'Matrizes PDCA, Eisenhower, GUT, 5W2H e lições aprendidas',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Company Branding */}
          <div className="flex items-center space-x-3">
            {empresa.logoBase64 ? (
              <img
                src={empresa.logoBase64}
                alt="Logo"
                className="h-10 w-auto max-w-[160px] object-contain rounded bg-slate-100 dark:bg-white/10 p-1 border border-slate-200 dark:border-white/20"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md ring-2 ring-orange-500/30"
                style={{ backgroundColor: empresa.corTemaHex || '#EA580C' }}
              >
                <Building2 className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                  {empresa.nomeEmpresa}
                </h1>
                {isReadOnly ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                    <Lock className="w-3 h-3 mr-1" /> Somente Leitura
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 mr-1" /> ERP / SGM Operacional
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Sistema de Gerenciamento de Obras, Produção & Compras
              </p>
            </div>
          </div>

          {/* Quick Actions & Connectivity */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Direct Open in Fullscreen / Standalone New Tab */}
            <button
              onClick={() => openFullscreenTab()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Abrir o Sistema Completo em Tela Cheia (Nova Guia)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tela Cheia</span>
            </button>

            {/* Share / Access Links Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Compartilhar links de acesso ao sistema (Uso completo ou por módulo)"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar Sistema</span>
            </button>

            {/* Firebase Cloud Status Indicator */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-xs ${
                cloudStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : cloudStatus === 'connecting'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={
                cloudStatus === 'connected'
                  ? 'Banco de Dados Firebase Firestore conectado em tempo real na nuvem'
                  : cloudStatus === 'connecting'
                  ? 'Conectando ao Firebase Firestore...'
                  : 'Modo Offline / Cache Local Ativo'
              }
            >
              {cloudStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline text-[11px] font-bold">Nuvem Firebase</span>
                </>
              ) : cloudStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="hidden lg:inline text-[11px] font-bold">Sincronizando...</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline text-[11px] font-bold">Local / Offline</span>
                </>
              )}
            </div>

            {/* Google Workspace Button */}
            <button
              onClick={() => setShowWorkspace(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition shadow-xs cursor-pointer"
              title="Google Workspace (Agenda & Tarefas)"
            >
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">Google Workspace</span>
            </button>

            {/* Notifications Alert Popup Button */}
            <div className="relative">
              <button
                onClick={() => {
                  if (onOpenNotifications) {
                    onOpenNotifications();
                  } else {
                    setShowNotifications(!showNotifications);
                  }
                }}
                className={`relative p-2 rounded-lg transition border cursor-pointer ${
                  totalAlerts > 0
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 hover:bg-rose-200 dark:hover:bg-rose-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Painel de Notificações de Atraso, Cotações e Decisões"
              >
                <Bell className="w-5 h-5" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow">
                    {totalAlerts}
                  </span>
                )}
              </button>
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title={darkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-300">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Modo Escuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Share / Access Links Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-orange-600 rounded-lg text-white">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Links de Compartilhamento & Acesso em Tela Cheia</h3>
                  <p className="text-[11px] text-slate-400">
                    Acesso direto para a equipe operar e preencher o sistema sem acesso aos códigos-fonte
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Notice Banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start space-x-3 text-xs text-emerald-900 dark:text-emerald-200">
                <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Acesso Operacional Completo em Tela Cheia</p>
                  <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
                    Ao abrir os links abaixo, o sistema executa em <strong>tela cheia no navegador</strong> como um aplicativo web independente. Os usuários podem cadastrar, preencher e editar todos os campos livremente, salvando dados em tempo real no banco de dados na nuvem, <strong>sem qualquer visualização ou edição de código-fonte</strong>.
                  </p>
                </div>
              </div>

              {/* 1. Main Official Application Link (Full Operational Access) */}
              <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border-2 border-orange-300 dark:border-orange-800/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-orange-900 dark:text-orange-200">
                    <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        1. Link Principal do Sistema (Tela Cheia & Edição Livre)
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                        Para toda a equipe, gerentes de fábrica, produção e setor de compras
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-orange-200 dark:bg-orange-900/80 text-orange-900 dark:text-orange-200 rounded-full">
                    Acesso Operacional Completo
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={directFullAccessUrl}
                    className="flex-1 p-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 rounded-lg text-slate-800 dark:text-slate-200 select-all shadow-inner"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(directFullAccessUrl, 'main')}
                      className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs ${
                        copiedKey === 'main'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {copiedKey === 'main' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey === 'main' ? 'Copiado!' : 'Copiar Link'}</span>
                    </button>
                    <button
                      onClick={() => openFullscreenTab(directFullAccessUrl)}
                      className="px-3.5 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
                      title="Abrir agora em tela cheia (Nova Guia)"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Abrir Agora</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Direct Links to Specific Modules (Full Screen & Full Editing) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Links Diretos por Módulo (Abre direto na aba em Tela Cheia)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Edição e preenchimento ativos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {moduleShareLinks.map((mod) => {
                    const ModIcon = mod.icon;
                    const isCopied = copiedKey === `mod-${mod.id}`;
                    return (
                      <div
                        key={mod.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition"
                      >
                        <div className="flex items-start justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <ModIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {mod.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {mod.desc}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            onClick={() => copyToClipboard(mod.url, `mod-${mod.id}`)}
                            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copiado' : 'Copiar Link'}</span>
                          </button>
                          <button
                            onClick={() => openFullscreenTab(mod.url)}
                            className="p-1.5 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                            title="Abrir módulo em tela cheia"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Read-Only Mode (Optional for Displays or Clients) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      3. Link Somente Leitura (Consulta & Telões de Fábrica)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                    Sem Edição / Bloqueado
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ideal exclusivamente para telões de fábrica ou clientes externos onde se deseja <strong>proibir qualquer clique de edição ou exclusão</strong>.
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={readOnlyUrl}
                    className="flex-1 p-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(readOnlyUrl, 'readonly')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                      copiedKey === 'readonly'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                    }`}
                  >
                    {copiedKey === 'readonly' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'readonly' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={() => openFullscreenTab(readOnlyUrl)}
                    className="p-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                    title="Abrir em modo somente leitura"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4. Tips for Mobile & Tablet Installation */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Dica: Uso em Celular, Tablet e Telões</p>
                  <p className="mt-0.5 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                    Você pode enviar o link principal por WhatsApp ou e-mail. No celular/tablet, abra o link no Google Chrome ou Safari e clique em <strong>"Adicionar à Tela de Início"</strong> para usar como um aplicativo nativo em tela inteira sem barras de navegação.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400" />
                <span>Dados sincronizados instantaneamente na nuvem</span>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition cursor-pointer shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifications && (
        <NotificationModal
          obras={allObras}
          compras={allCompras}
          delayedObras={delayedObras}
          delayedCompras={delayedCompras}
          fornecedores={fornecedores}
          onClose={() => setShowNotifications(false)}
          onOpenWorkspace={() => setShowWorkspace(true)}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* Workspace Modal */}
      {showWorkspace && (
        <WorkspaceModal
          obras={delayedObras}
          compras={delayedCompras}
          onClose={() => setShowWorkspace(false)}
        />
      )}
    </>
  );
};

