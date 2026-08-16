import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  ShoppingCart,
  HardHat,
  CheckSquare,
  BellRing,
  ExternalLink,
  BrainCircuit,
  MessageSquare,
  PhoneCall,
  CalendarCheck,
  ChevronRight,
  Trash2,
  RotateCcw,
  CheckCheck,
  Sparkles,
  Wrench
} from 'lucide-react';
import {
  Obra,
  Compra,
  GoogleTaskItem,
  PDCAItem,
  EisenhowerItem,
  GUTItem,
  FiveWTwoHItem,
  BrainstormingIdea,
  Fornecedor,
  OrdemManutencao
} from '../types';
import { storageService } from '../services/storage';
import { isOverdue, formatDateBR } from '../utils/dateUtils';
import { requestBrowserNotificationPermission, sendSystemNotification } from '../utils/notificationUtils';
import { useDialog } from './DialogContext';

interface NotificationModalProps {
  obras?: Obra[];
  compras?: Compra[];
  delayedObras?: Obra[];
  delayedCompras?: Compra[];
  fornecedores?: Fornecedor[];
  isOpen?: boolean;
  onClose: () => void;
  onOpenWorkspace?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  obras = [],
  compras = [],
  delayedObras,
  delayedCompras,
  fornecedores = [],
  onClose,
  onOpenWorkspace,
  onNavigateToTab,
}) => {
  const { showAlert } = useDialog();
  const [tasks, setTasks] = useState<GoogleTaskItem[]>(() => storageService.getGoogleTasks());
  const [pdcaItems, setPdcaItems] = useState<PDCAItem[]>(() => storageService.getPDCA());
  const [eisenhowerItems, setEisenhowerItems] = useState<EisenhowerItem[]>(() => storageService.getEisenhower());
  const [gutItems, setGutItems] = useState<GUTItem[]>(() => storageService.getGUT());
  const [fiveWTwoHItems, setFiveWTwoHItems] = useState<FiveWTwoHItem[]>(() => storageService.getFiveWTwoH());
  const [brainstormingItems, setBrainstormingItems] = useState<BrainstormingIdea[]>(() => storageService.getBrainstorming());
  const [manutencoes, setManutencoes] = useState<OrdemManutencao[]>(() => storageService.getManutencoes());
  const [allFornecedores] = useState<Fornecedor[]>(() => (fornecedores.length > 0 ? fornecedores : storageService.getFornecedores()));
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'default'>('default');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => storageService.getDismissedAlerts());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPerm(Notification.permission);
    }

    const handleStorageUpdate = () => {
      setDismissedAlerts(storageService.getDismissedAlerts());
      setTasks(storageService.getGoogleTasks());
      setPdcaItems(storageService.getPDCA());
      setEisenhowerItems(storageService.getEisenhower());
      setGutItems(storageService.getGUT());
      setFiveWTwoHItems(storageService.getFiveWTwoH());
      setBrainstormingItems(storageService.getBrainstorming());
      setManutencoes(storageService.getManutencoes());
    };

    window.addEventListener('sgm_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('sgm_storage_updated', handleStorageUpdate);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 1. Obras atrasadas (filtradas pelas não dispensadas)
  const activeDelayedObras = (delayedObras || obras.filter((o) => !o.arquivada && isOverdue(o.dataPrevistaEntrega, o.statusGlobal))).filter(
    (o) => !dismissedAlerts.includes(`obra-delayed-${o.id}`)
  );

  // 2. Compras em Cotação (filtradas pelas não dispensadas)
  const comprasEmCotacao = compras.filter(
    (c) => c.status === 'EM COTAÇÃO' && !dismissedAlerts.includes(`compra-cotacao-${c.id}`)
  );

  // 3. Compras Atrasadas (filtradas pelas não dispensadas)
  const activeDelayedCompras = (delayedCompras || compras.filter((c) => c.status !== 'ENTREGUE' && isOverdue(c.dataEntregaPrevista, c.status))).filter(
    (c) => !dismissedAlerts.includes(`compra-delayed-${c.id}`)
  );

  // 4. Itens da aba Inteligência & Decisão abertos / a fazer (filtrados pelos não dispensados)
  const openPDCA = pdcaItems.filter((p) => p.status !== 'CONCLUÍDO' && !dismissedAlerts.includes(`pdca-${p.id}`));
  const openEisenhower = eisenhowerItems.filter((e) => (e as any).concluido !== true && !dismissedAlerts.includes(`eisen-${e.id}`));
  const openGUT = gutItems.filter((g) => (g as any).status !== 'CONCLUIDO' && !dismissedAlerts.includes(`gut-${g.id}`));
  const openFiveW = fiveWTwoHItems.filter((f) => f.status !== 'CONCLUÍDO' && !dismissedAlerts.includes(`fivew-${f.id}`));
  const openBrainstorming = brainstormingItems.filter(
    (b) => (b.status === 'RASCUNHO' || b.status === 'SELECIONADA') && !dismissedAlerts.includes(`brain-${b.id}`)
  );

  const totalInteligenciaOpen =
    openPDCA.length + openEisenhower.length + openGUT.length + openFiveW.length + openBrainstorming.length;

  // 5. Manutenções Agendadas e Pendentes (filtradas pelas não dispensadas)
  const activeManutencoes = manutencoes.filter(
    (m) => m.status !== 'CONCLUIDA' && m.status !== 'CANCELADA' && !dismissedAlerts.includes(`manutencao-${m.id}`)
  );

  // 6. Alerta Diário de Atualização do Fluxo de Produção
  const obrasAtivasNaFabrica = obras.filter(
    (o) => !o.arquivada && o.statusGlobal !== 'ENTREGUE' && o.statusGlobal !== 'FINALIZADA'
  );
  const precisaAtualizarProducaoHoje = obrasAtivasNaFabrica.length > 0 && !dismissedAlerts.includes('daily-production');

  // 7. Google Tasks
  const pendingTasks = tasks.filter((t) => !t.concluida && !dismissedAlerts.includes(`task-${t.id}`));

  const totalAlerts =
    activeDelayedObras.length +
    activeDelayedCompras.length +
    comprasEmCotacao.length +
    activeManutencoes.length +
    totalInteligenciaOpen +
    pendingTasks.length +
    (precisaAtualizarProducaoHoje ? 1 : 0);

  // Coleta todas as chaves ativas para limpeza em massa
  const getAllActiveKeys = () => {
    const keys: string[] = [];
    if (precisaAtualizarProducaoHoje) keys.push('daily-production');
    activeDelayedObras.forEach((o) => keys.push(`obra-delayed-${o.id}`));
    comprasEmCotacao.forEach((c) => keys.push(`compra-cotacao-${c.id}`));
    activeDelayedCompras.forEach((c) => keys.push(`compra-delayed-${c.id}`));
    activeManutencoes.forEach((m) => keys.push(`manutencao-${m.id}`));
    openPDCA.forEach((p) => keys.push(`pdca-${p.id}`));
    openGUT.forEach((g) => keys.push(`gut-${g.id}`));
    openFiveW.forEach((f) => keys.push(`fivew-${f.id}`));
    openEisenhower.forEach((e) => keys.push(`eisen-${e.id}`));
    openBrainstorming.forEach((b) => keys.push(`brain-${b.id}`));
    pendingTasks.forEach((t) => keys.push(`task-${t.id}`));
    return keys;
  };

  // Funções de Limpeza de Alertas
  const handleClearAllAlerts = () => {
    const keys = getAllActiveKeys();
    if (keys.length === 0) return;
    storageService.dismissAllAlerts(keys);
    setDismissedAlerts(storageService.getDismissedAlerts());
    showFeedback(`${keys.length} alerta(s) limpo(s) com sucesso!`);
  };

  const handleDismissSingleAlert = (alertKey: string) => {
    storageService.dismissAlert(alertKey);
    setDismissedAlerts(storageService.getDismissedAlerts());
    showFeedback('Alerta dispensado');
  };

  const handleDismissCategory = (keys: string[], categoryName: string) => {
    if (keys.length === 0) return;
    storageService.dismissAllAlerts(keys);
    setDismissedAlerts(storageService.getDismissedAlerts());
    showFeedback(`Alertas de ${categoryName} limpos!`);
  };

  const handleRestoreDismissedAlerts = () => {
    storageService.restoreDismissedAlerts();
    setDismissedAlerts([]);
    showFeedback('Todos os alertas foram restaurados!');
  };

  const handleRequestPerm = async () => {
    const granted = await requestBrowserNotificationPermission();
    if (granted) {
      setBrowserPerm('granted');
      sendSystemNotification(
        '🔔 SGM ERP - Alertas Ativados',
        `Você receberá notificações sobre ${totalAlerts} pendências e atualizações diárias.`
      );
    }
  };

  const handleToggleTask = (task: GoogleTaskItem) => {
    const updated = { ...task, concluida: !task.concluida };
    storageService.saveGoogleTask(updated);
    setTasks(storageService.getGoogleTasks());
  };

  const handleNavigate = (tabName: string) => {
    onClose();
    if (onNavigateToTab) {
      onNavigateToTab(tabName);
    }
  };

  const getFornecedorContact = (fornNome?: string, fornId?: string) => {
    const found = allFornecedores.find((f) => f.id === fornId || f.nome === fornNome || f.razaoSocial === fornNome);
    return found?.whatsapp || found?.telefone || '';
  };

  const handleCobrarWhatsApp = (compra: Compra, tipo: 'COTACAO' | 'ATRASO') => {
    const contact = getFornecedorContact(compra.fornecedorNome, compra.fornecedorId);
    const cleanPhone = contact.replace(/\D/g, '');
    const msg =
      tipo === 'COTACAO'
        ? `Olá ${compra.fornecedorNome || ''}! Gostaria de cobrar o retorno da cotação do pedido ${compra.codigoPedido || ''} (${compra.material || 'materiais'}). Aguardamos seu retorno para fechamento.`
        : `Olá ${compra.fornecedorNome || ''}! Cobrança de entrega urgente referente ao pedido ${compra.codigoPedido || ''} (${compra.material || 'materiais'}). O prazo previsto era ${formatDateBR(compra.dataEntregaPrevista)}. Poderia confirmar a previsão de entrega?`;

    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      navigator.clipboard?.writeText(msg);
      showAlert(`Mensagem copiada para a área de transferência!\n\n"${msg}"`, { type: 'info' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide">
                  Central de Alertas & Ações
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-extrabold bg-white/25 rounded-full">
                  {totalAlerts}
                </span>
              </div>
              <p className="text-[11px] text-orange-100">
                Lembretes diários de fábrica, compras, inteligência & decisões
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {totalAlerts > 0 && (
              <button
                onClick={handleClearAllAlerts}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                title="Limpar e dispensar todos os alertas ativos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Alertas</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCheck className="w-4 h-4" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Restauração de Alertas Dispensados Banner */}
        {dismissedAlerts.length > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              <strong className="text-orange-600 dark:text-orange-400">{dismissedAlerts.length}</strong> alerta(s) limpo(s)/dispensado(s).
            </span>
            <button
              onClick={handleRestoreDismissedAlerts}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-bold flex items-center space-x-1 text-[11px] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Alertas Limpos</span>
            </button>
          </div>
        )}

        {/* System Permission Bar */}
        {browserPerm !== 'granted' && (
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                Ativar alertas no navegador e sistema operacional
              </span>
            </div>
            <button
              onClick={handleRequestPerm}
              className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shrink-0 cursor-pointer"
            >
              Ativar
            </button>
          </div>
        )}

        {/* List Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {totalAlerts === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base">Tudo limpo e em dia!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Nenhum atraso pendente, cotação sem resposta ou alerta ativo no momento.
                </p>
              </div>
              {dismissedAlerts.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleRestoreDismissedAlerts}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 rounded-xl border border-orange-200 dark:border-orange-900 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar {dismissedAlerts.length} Alerta(s) Limpos</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* 1. ALERTA DIÁRIO: ATUALIZAÇÃO DE ETAPAS DE PRODUÇÃO */}
              {precisaAtualizarProducaoHoje && (
                <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200 dark:border-orange-900/60 rounded-xl shadow-xs relative group">
                  <button
                    onClick={() => handleDismissSingleAlert('daily-production')}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-orange-200/50 dark:hover:bg-orange-900/50 transition cursor-pointer"
                    title="Limpar este lembrete"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="flex items-start space-x-2.5">
                      <div className="p-2 bg-orange-600 text-white rounded-lg shrink-0 mt-0.5">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-200">
                            LEMBRETE DIÁRIO
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Atualizar Chão de Fábrica & Etapas de Produção
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Existem <strong className="text-orange-700 dark:text-orange-400">{obrasAtivasNaFabrica.length} obras ativas</strong> no fluxo fabril que necessitam de acompanhamento diário das etapas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-orange-900/40">
                    <button
                      onClick={() => handleDismissSingleAlert('daily-production')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
                    >
                      Dispensar por hoje
                    </button>
                    <button
                      onClick={() => handleNavigate('obras')}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Atualizar Produção Agora</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. ITENS DE INTELIGÊNCIA & DECISÃO ABERTOS / A FAZER */}
              {totalInteligenciaOpen > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
                      <BrainCircuit className="w-3.5 h-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                      Inteligência & Decisão ({totalInteligenciaOpen} Abertos)
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const keys: string[] = [];
                          openPDCA.forEach((p) => keys.push(`pdca-${p.id}`));
                          openGUT.forEach((g) => keys.push(`gut-${g.id}`));
                          openFiveW.forEach((f) => keys.push(`fivew-${f.id}`));
                          openEisenhower.forEach((e) => keys.push(`eisen-${e.id}`));
                          openBrainstorming.forEach((b) => keys.push(`brain-${b.id}`));
                          handleDismissCategory(keys, 'Inteligência & Decisão');
                        }}
                        className="text-[10px] text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                      <button
                        onClick={() => handleNavigate('inteligencia')}
                        className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center cursor-pointer"
                      >
                        Abrir <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* PDCA Items */}
                    {openPDCA.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl hover:border-purple-400 transition flex items-start justify-between relative group"
                      >
                        <div
                          className="flex-1 cursor-pointer pr-6"
                          onClick={() => handleNavigate('inteligencia')}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                              PDCA
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {p.titulo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                            Plano: {p.plan || 'Em estruturação'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissSingleAlert(`pdca-${p.id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 rounded transition cursor-pointer"
                            title="Limpar este alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* GUT Matrix high priority */}
                    {openGUT.map((g) => (
                      <div
                        key={g.id}
                        className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:border-rose-400 transition flex items-start justify-between relative group"
                      >
                        <div
                          className="flex-1 cursor-pointer pr-6"
                          onClick={() => handleNavigate('inteligencia')}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                              GUT (Score: {(g.gravidade || 1) * (g.urgencia || 1) * (g.tendencia || 1)})
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {g.problema}
                            </span>
                          </div>
                          {g.acaoProposta && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                              Ação: {g.acaoProposta}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissSingleAlert(`gut-${g.id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 rounded transition cursor-pointer"
                            title="Limpar este alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* 5W2H Action Plans */}
                    {openFiveW.map((f) => (
                      <div
                        key={f.id}
                        className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl hover:border-blue-400 transition flex items-start justify-between relative group"
                      >
                        <div
                          className="flex-1 cursor-pointer pr-6"
                          onClick={() => handleNavigate('inteligencia')}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              5W2H • {f.status}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {f.what}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                            Como: {f.how} • Quem: {f.who}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissSingleAlert(`fivew-${f.id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 rounded transition cursor-pointer"
                            title="Limpar este alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Eisenhower Items */}
                    {openEisenhower.map((e) => (
                      <div
                        key={e.id}
                        className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl hover:border-amber-400 transition flex items-start justify-between relative group"
                      >
                        <div
                          className="flex-1 cursor-pointer pr-6"
                          onClick={() => handleNavigate('inteligencia')}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              EISENHOWER {e.urgente && e.importante ? '🔥 FAZER AGORA' : 'AGENDAR'}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {e.titulo}
                            </span>
                          </div>
                          {e.descricao && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                              {e.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissSingleAlert(`eisen-${e.id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 rounded transition cursor-pointer"
                            title="Limpar este alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. MANUTENÇÕES AGENDADAS E PREVENTIVAS */}
              {activeManutencoes.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center">
                      <Wrench className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      Manutenções Agendadas & Alertas ({activeManutencoes.length})
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const keys = activeManutencoes.map((m) => `manutencao-${m.id}`);
                          handleDismissCategory(keys, 'Manutenções');
                        }}
                        className="text-[10px] text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                      <button
                        onClick={() => handleNavigate('manutencao')}
                        className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center cursor-pointer"
                      >
                        Ver Painel <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeManutencoes.map((m) => {
                      const isOver = m.dataPrevisao ? isOverdue(m.dataPrevisao, m.status) : false;
                      const priorityColor =
                        m.prioridade === 'URGENTE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300'
                          : m.prioridade === 'ALTA'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border-orange-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300';

                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border relative transition group ${
                            isOver
                              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                          }`}
                        >
                          <button
                            onClick={() => handleDismissSingleAlert(`manutencao-${m.id}`)}
                            className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 transition cursor-pointer"
                            title="Limpar este alerta"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div
                            className="flex items-start justify-between pr-6 cursor-pointer"
                            onClick={() => handleNavigate('manutencao')}
                          >
                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-white dark:bg-slate-700">
                                  {m.categoria} • {m.tipo}
                                </span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${priorityColor}`}>
                                  {m.prioridade}
                                </span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {m.status.replace('_', ' ')}
                                </span>
                              </div>

                              <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5">
                                {m.titulo}
                              </h5>
                              {m.descricao && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                  {m.descricao}
                                </p>
                              )}

                              <div className="flex items-center space-x-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                {m.responsavel && (
                                  <span>Resp: <strong className="text-slate-700 dark:text-slate-300">{m.responsavel}</strong></span>
                                )}
                                {m.dataPrevisao && (
                                  <span className={isOver ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                                    {isOver ? '⚠️ Atrasado desde: ' : '📅 Previsto: '}
                                    {formatDateBR(m.dataPrevisao)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                            <button
                              onClick={() => handleDismissSingleAlert(`manutencao-${m.id}`)}
                              className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                            >
                              Dispensar alerta
                            </button>
                            <button
                              onClick={() => handleNavigate('manutencao')}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-xs"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Abrir Ordem</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. COBRANÇA DE COMPRAS EM COTAÇÃO */}
              {comprasEmCotacao.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                      Compras em Cotação ({comprasEmCotacao.length})
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const keys = comprasEmCotacao.map((c) => `compra-cotacao-${c.id}`);
                          handleDismissCategory(keys, 'Cotações');
                        }}
                        className="text-[10px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                      <button
                        onClick={() => handleNavigate('compras')}
                        className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center cursor-pointer"
                      >
                        Ver Compras <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {comprasEmCotacao.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl relative group"
                      >
                        <button
                          onClick={() => handleDismissSingleAlert(`compra-cotacao-${c.id}`)}
                          className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-blue-200/50 dark:hover:bg-blue-900/50 transition cursor-pointer"
                          title="Limpar alerta desta cotação"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start justify-between pr-6">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {c.codigoPedido || 'PEDIDO EM COTAÇÃO'}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                              {c.material}
                            </h5>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              Fornecedor: <strong>{c.fornecedorNome}</strong> • Qtd: {c.quantidade} {c.unidade}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                          <button
                            onClick={() => handleDismissSingleAlert(`compra-cotacao-${c.id}`)}
                            className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                          >
                            Dispensar alerta
                          </button>
                          <button
                            onClick={() => handleCobrarWhatsApp(c, 'COTACAO')}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-xs"
                            title="Cobrar Fornecedor via WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Cobrar Orçamento</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. COMPRAS ATRASADAS (COBRAR ENTREGA) */}
              {activeDelayedCompras.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center">
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                      Compras Atrasadas ({activeDelayedCompras.length})
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const keys = activeDelayedCompras.map((c) => `compra-delayed-${c.id}`);
                          handleDismissCategory(keys, 'Compras Atrasadas');
                        }}
                        className="text-[10px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                      <button
                        onClick={() => handleNavigate('compras')}
                        className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center cursor-pointer"
                      >
                        Ver Compras <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeDelayedCompras.map((compra) => (
                      <div
                        key={compra.id}
                        className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl relative group"
                      >
                        <button
                          onClick={() => handleDismissSingleAlert(`compra-delayed-${compra.id}`)}
                          className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-200/50 dark:hover:bg-rose-900/50 transition cursor-pointer"
                          title="Limpar alerta desta compra"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start justify-between pr-6">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                              {compra.codigoPedido} • ATRASADO
                            </span>
                            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-1">
                              {compra.material}
                            </h5>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              Fornecedor: <strong>{compra.fornecedorNome}</strong>
                            </p>
                            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 mt-1">
                              Data Prevista: {formatDateBR(compra.dataEntregaPrevista)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                          <button
                            onClick={() => handleDismissSingleAlert(`compra-delayed-${compra.id}`)}
                            className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                          >
                            Dispensar alerta
                          </button>
                          <button
                            onClick={() => handleCobrarWhatsApp(compra, 'ATRASO')}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-xs"
                            title="Cobrar Fornecedor via WhatsApp"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Cobrar Entrega</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. OBRAS ATRASADAS */}
              {activeDelayedObras.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
                      <HardHat className="w-3.5 h-3.5 mr-1 text-rose-500" />
                      Obras Atrasadas ({activeDelayedObras.length})
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const keys = activeDelayedObras.map((o) => `obra-delayed-${o.id}`);
                          handleDismissCategory(keys, 'Obras Atrasadas');
                        }}
                        className="text-[10px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                      <button
                        onClick={() => handleNavigate('obras')}
                        className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center cursor-pointer"
                      >
                        Ir para Obras <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeDelayedObras.map((obra) => (
                      <div
                        key={obra.id}
                        className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl relative group"
                      >
                        <button
                          onClick={() => handleDismissSingleAlert(`obra-delayed-${obra.id}`)}
                          className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-200/50 dark:hover:bg-rose-900/50 transition cursor-pointer"
                          title="Limpar alerta desta obra"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start justify-between pr-6">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                              {obra.codigo}
                            </span>
                            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-1">
                              {obra.cliente}
                            </h5>
                          </div>
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Prev: {formatDateBR(obra.dataPrevistaEntrega)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          Vendedor: {obra.vendedorNome} • Status: {obra.statusGlobal}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                          <button
                            onClick={() => handleDismissSingleAlert(`obra-delayed-${obra.id}`)}
                            className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                          >
                            Dispensar alerta
                          </button>
                          <button
                            onClick={() => handleNavigate('obras')}
                            className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer"
                          >
                            Ver Obra
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. GOOGLE TAREFAS */}
              {pendingTasks.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
                      <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Google Tarefas ({pendingTasks.length})
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const keys = pendingTasks.map((t) => `task-${t.id}`);
                          handleDismissCategory(keys, 'Tarefas');
                        }}
                        className="text-[10px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                      {onOpenWorkspace && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenWorkspace();
                          }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center cursor-pointer"
                        >
                          Workspace <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pendingTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl hover:border-emerald-400 transition flex items-start space-x-2.5 relative group"
                      >
                        <input
                          type="checkbox"
                          checked={t.concluida}
                          onChange={() => handleToggleTask(t)}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0 cursor-pointer"
                        />
                        <div
                          className="flex-1 min-w-0 cursor-pointer pr-6"
                          onClick={() => handleToggleTask(t)}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                              {t.titulo}
                            </h5>
                            {t.prioridade === 'URGENTE' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 ml-1 shrink-0">
                                URGENTE
                              </span>
                            )}
                          </div>
                          {t.detalhes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {t.detalhes}
                            </p>
                          )}
                          {t.dataLimite && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                              Prazo: {formatDateBR(t.dataLimite)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDismissSingleAlert(`task-${t.id}`)}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 rounded transition cursor-pointer"
                          title="Limpar alerta desta tarefa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (browserPerm === 'granted') {
                  sendSystemNotification(
                    '🔔 Teste de Notificação SGM',
                    `Você tem ${totalAlerts} pendências ativas registradas no sistema.`
                  );
                } else {
                  handleRequestPerm();
                }
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 mr-1" />
              Testar Alerta
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {totalAlerts > 0 && (
              <button
                onClick={handleClearAllAlerts}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center space-x-1 cursor-pointer border border-rose-200 dark:border-rose-900"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Todos</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
