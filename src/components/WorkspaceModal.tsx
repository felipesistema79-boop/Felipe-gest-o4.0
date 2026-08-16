import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  CheckSquare,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Share2,
  Send,
  Trash2,
  BellRing,
  AlertCircle,
  Check
} from 'lucide-react';
import { Obra, Compra, EmpresaConfig, GoogleTaskItem } from '../types';
import { storageService } from '../services/storage';
import { formatDateBR } from '../utils/dateUtils';
import { sendSystemNotification, requestBrowserNotificationPermission } from '../utils/notificationUtils';

interface WorkspaceModalProps {
  obras?: Obra[];
  compras?: Compra[];
  empresa?: EmpresaConfig;
  isOpen?: boolean;
  onClose: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  obras = [],
  compras = [],
  empresa,
  onClose,
}) => {
  const [syncedEvents, setSyncedEvents] = useState<string[]>([]);
  const [taskText, setTaskText] = useState('');
  const [taskDetail, setTaskDetail] = useState('');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [tasksList, setTasksList] = useState<GoogleTaskItem[]>(() => storageService.getGoogleTasks());
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setTasksList(storageService.getGoogleTasks());
    window.addEventListener('sgm_storage_updated', refresh);
    return () => window.removeEventListener('sgm_storage_updated', refresh);
  }, []);

  const handleSyncToCalendar = (title: string, dateStr: string, details?: string) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `[SGM ERP] ${title}`
    )}&dates=${cleanDate}/${cleanDate}&details=${encodeURIComponent(
      details || 'Sincronizado automaticamente pelo Sistema SGM ERP Cabral Esquadrias.'
    )}`;
    window.open(gcalUrl, '_blank');

    setSyncedEvents((prev) => [...prev, title]);

    // Send system alert
    sendSystemNotification(
      '📅 Google Agenda Sincronizado',
      `Evento "${title}" programado para ${formatDateBR(dateStr)}.`
    );
  };

  const handleAddTask = async () => {
    if (!taskText.trim()) return;

    const newTask: GoogleTaskItem = {
      id: `gt-${Date.now()}`,
      titulo: taskText.trim(),
      detalhes: taskDetail.trim() || undefined,
      dataLimite: taskDate || undefined,
      concluida: false,
      prioridade: taskPriority,
      origemTipo: 'MANUAL',
      dataCriacao: new Date().toISOString().split('T')[0],
      alertaAtivo: true,
    };

    storageService.saveGoogleTask(newTask);
    setTasksList(storageService.getGoogleTasks());
    setTaskText('');
    setTaskDetail('');

    // Trigger Desktop notification
    sendSystemNotification(
      '✅ Nova Tarefa Registrada',
      `${newTask.titulo} ${newTask.dataLimite ? `(Prazo: ${formatDateBR(newTask.dataLimite)})` : ''}`
    );

    setNotificationStatus('Tarefa salva e notificação disparada com sucesso!');
    setTimeout(() => setNotificationStatus(null), 3500);
  };

  const handleToggleTask = (task: GoogleTaskItem) => {
    const updated = { ...task, concluida: !task.concluida };
    storageService.saveGoogleTask(updated);
    setTasksList(storageService.getGoogleTasks());

    if (updated.concluida) {
      sendSystemNotification(
        '🎉 Tarefa Concluída',
        `"${task.titulo}" marcada como executada no SGM ERP.`
      );
    }
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteGoogleTask(id);
    setTasksList(storageService.getGoogleTasks());
  };

  // Convert an Obra or Compra directly into a Google Task
  const handleCreateTaskFromObra = (obra: Obra) => {
    const newTask: GoogleTaskItem = {
      id: `gt-obr-${obra.id}`,
      titulo: `Acompanhar Obra: ${obra.cliente} (${obra.codigo})`,
      detalhes: `Status: ${obra.statusGlobal} • Vendedor: ${obra.vendedorNome} • Segmento: ${obra.segmento}`,
      dataLimite: obra.dataPrevistaEntrega,
      concluida: false,
      prioridade: obra.prioridade === 'URGENTE' ? 'URGENTE' : 'ALTA',
      origemTipo: 'OBRA',
      origemId: obra.id,
      dataCriacao: new Date().toISOString().split('T')[0],
      alertaAtivo: true,
    };

    storageService.saveGoogleTask(newTask);
    setTasksList(storageService.getGoogleTasks());

    sendSystemNotification(
      '📌 Tarefa Criada a partir da Obra',
      `Lembrete ativado para ${obra.codigo} - ${obra.cliente}`
    );
    setNotificationStatus(`Lembrete gerado para a obra ${obra.codigo}!`);
    setTimeout(() => setNotificationStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-1.5">
                Google Workspace & Afazeres (Google Tasks)
              </h3>
              <p className="text-xs text-blue-200">
                Lembretes, alertas no app e notificações de sistema para tarefas pendentes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {notificationStatus && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{notificationStatus}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Quick Sync Events Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
                Sincronizar Prazos no Google Agenda & Tarefas
              </h4>
              <button
                onClick={async () => {
                  const perm = await requestBrowserNotificationPermission();
                  if (perm) {
                    sendSystemNotification('🔔 Notificações Ativas', 'Alertas de tarefas configurados!');
                  }
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center"
              >
                <BellRing className="w-3 h-3 mr-1" />
                Ativar Alertas de Sistema
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Deliveries */}
              {obras.slice(0, 4).map((obra) => (
                <div
                  key={obra.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {obra.codigo}
                    </span>
                    <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate mt-1">
                      {obra.cliente}
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Entrega: {formatDateBR(obra.dataPrevistaEntrega)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleCreateTaskFromObra(obra)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition shadow-xs"
                      title="Gerar Lembrete em Afazeres / Tasks"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleSyncToCalendar(
                          `Entrega Obra: ${obra.cliente} (${obra.codigo})`,
                          obra.dataPrevistaEntrega,
                          `Segmento: ${obra.segmento} • Vendedor: ${obra.vendedorNome}`
                        )
                      }
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition shadow-xs"
                      title="Agendar no Google Agenda"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Google Tasks Panel */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <CheckSquare className="w-4 h-4 mr-1.5 text-emerald-600" />
                Google Tarefas (Afazeres & Alertas em Tempo Real)
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {tasksList.filter((t) => !t.concluida).length} Pendentes
              </span>
            </div>

            {/* Input task */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 mb-4">
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Ex: Conferir medidas do vão PVC da obra Res. Alphaville..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />

                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="NORMAL">Prioridade Normal</option>
                  <option value="ALTA">Prioridade Alta</option>
                  <option value="URGENTE">Urgente / Crítica</option>
                </select>

                <button
                  onClick={handleAddTask}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Lembrete</span>
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {tasksList.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    t.concluida
                      ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 line-through'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 shadow-xs'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={t.concluida}
                      onChange={() => {}}
                      className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                          {t.titulo}
                        </span>
                        {t.prioridade === 'URGENTE' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 shrink-0">
                            URGENTE
                          </span>
                        )}
                        {t.prioridade === 'ALTA' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 shrink-0">
                            ALTA
                          </span>
                        )}
                      </div>
                      {t.detalhes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {t.detalhes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pl-2 shrink-0">
                    {t.dataLimite && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        {formatDateBR(t.dataLimite)}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteTask(t.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <a
              href="https://tasks.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center hover:underline"
            >
              Abrir Google Tasks <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 font-medium flex items-center hover:underline"
            >
              Abrir Google Agenda <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};

