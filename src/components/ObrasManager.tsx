import React, { useState } from 'react';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  ArrowDownUp,
  Workflow
} from 'lucide-react';
import { Obra, Vendedor, EtapaFluxoConfig, StatusEtapa, StatusGlobalObra } from '../types';
import { formatDateBR, isOverdue } from '../utils/dateUtils';
import { ObraFormModal } from './ObraFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { defaultEtapas } from '../services/storage';

interface ObrasManagerProps {
  obras?: Obra[];
  vendedores?: Vendedor[];
  etapas?: EtapaFluxoConfig[];
  isReadOnly?: boolean;
  onSaveObra: (obra: Obra) => void;
  onDeleteObra: (id: string) => void;
  onArchiveObra?: (id: string) => void;
  onUnarchiveObra?: (id: string) => void;
  onOpenNewObra?: () => void;
  onOpenEditObra?: (obra: Obra) => void;
}

type SortOrder = 'FILA_PADRAO' | 'MAIS_NOVO' | 'MAIS_ANTIGO' | 'PRAZO_ENTREGA' | 'CLIENTE_AZ';

export const ObrasManager: React.FC<ObrasManagerProps> = ({
  obras = [],
  vendedores = [],
  etapas = [],
  isReadOnly = false,
  onSaveObra,
  onDeleteObra,
  onArchiveObra,
  onUnarchiveObra,
  onOpenNewObra,
  onOpenEditObra,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('FILA_PADRAO');
  const [exibirArquivadas, setExibirArquivadas] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null);

  // Active production stages
  const activeEtapas: EtapaFluxoConfig[] = etapas && etapas.length > 0 ? etapas : defaultEtapas;

  // Helper to normalize text for flexible stage name matching
  const normalizeText = (text?: string) => {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Base active/archived obras list
  const baseObras = obras.filter((o) => (exibirArquivadas ? o.arquivada : !o.arquivada));

  // Category counts for quick filter buttons
  const countTotal = baseObras.length;
  const countAgendadas = baseObras.filter(
    (o) => o.statusGlobal === 'AGENDADA' || Boolean(o.dataAgendada && o.dataAgendada.trim() !== '')
  ).length;
  const countNaoAgendadas = baseObras.filter(
    (o) =>
      (o.statusGlobal === 'NÃO AGENDADA' || !o.statusGlobal) &&
      (!o.dataAgendada || o.dataAgendada.trim() === '')
  ).length;
  const countPendencias = baseObras.filter(
    (o) => o.statusGlobal === 'PENDENCIA' || (o.statusGlobal as string) === 'PENDÊNCIA'
  ).length;
  const countEntregues = baseObras.filter((o) => o.statusGlobal === 'ENTREGUE').length;
  const countFinalizadas = baseObras.filter((o) => o.statusGlobal === 'FINALIZADA').length;
  const countAtrasadas = baseObras.filter((o) =>
    isOverdue(o.dataPrevistaEntrega, o.statusGlobal)
  ).length;

  // Filter obras
  const filteredObras = obras
    .filter((o) => {
      // Hide archived by default unless toggle is ON
      if (!exibirArquivadas && o.arquivada) return false;
      if (exibirArquivadas && !o.arquivada) return false;

      // Search text
      const searchMatch =
        o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vendedorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.observacoes && o.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!searchMatch) return false;

      // Filter vendedor
      if (filterVendedor !== 'TODOS' && o.vendedorId !== filterVendedor) return false;

      // Filter status
      if (filterStatus !== 'TODOS') {
        const normFilter = filterStatus.toUpperCase().trim();
        if (normFilter === 'AGENDADA' || normFilter === 'AGENDADAS') {
          const isAgendada =
            o.statusGlobal === 'AGENDADA' || Boolean(o.dataAgendada && o.dataAgendada.trim() !== '');
          if (!isAgendada) return false;
        } else if (
          normFilter === 'NÃO AGENDADA' ||
          normFilter === 'NAO AGENDADA' ||
          normFilter === 'NÃO AGENDADAS'
        ) {
          const isNaoAgendada =
            (o.statusGlobal === 'NÃO AGENDADA' || !o.statusGlobal) &&
            (!o.dataAgendada || o.dataAgendada.trim() === '');
          if (!isNaoAgendada) return false;
        } else if (
          normFilter === 'PENDENCIA' ||
          normFilter === 'PENDÊNCIA' ||
          normFilter === 'PENDENCIAS'
        ) {
          if (o.statusGlobal !== 'PENDENCIA' && (o.statusGlobal as string) !== 'PENDÊNCIA')
            return false;
        } else if (normFilter === 'ENTREGUE' || normFilter === 'ENTREGUES') {
          if (o.statusGlobal !== 'ENTREGUE') return false;
        } else if (normFilter === 'FINALIZADA' || normFilter === 'FINALIZADAS') {
          if (o.statusGlobal !== 'FINALIZADA') return false;
        } else if (normFilter === 'ATRASADAS' || normFilter === 'ATRASADA') {
          if (!isOverdue(o.dataPrevistaEntrega, o.statusGlobal)) return false;
        } else {
          if (o.statusGlobal !== filterStatus) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'FILA_PADRAO' || sortOrder === 'MAIS_ANTIGO') {
        const timeA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
        const timeB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
        return timeA - timeB;
      }
      if (sortOrder === 'MAIS_NOVO') {
        const timeA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
        const timeB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOrder === 'PRAZO_ENTREGA') {
        return new Date(a.dataPrevistaEntrega).getTime() - new Date(b.dataPrevistaEntrega).getTime();
      }
      if (sortOrder === 'CLIENTE_AZ') {
        return a.cliente.localeCompare(b.cliente);
      }
      return 0;
    });

  const handleOpenAddModal = () => {
    if (onOpenNewObra) {
      onOpenNewObra();
    } else {
      setEditingObra(null);
      setShowModal(true);
    }
  };

  const handleOpenEditModal = (obra: Obra) => {
    if (onOpenEditObra) {
      onOpenEditObra(obra);
    } else {
      setEditingObra(obra);
      setShowModal(true);
    }
  };

  const getObraStepStatus = (obra: Obra, etapa: EtapaFluxoConfig): StatusEtapa => {
    if (!obra.fluxoEtapas) return 'NÃO INICIADO';
    if (obra.fluxoEtapas[etapa.id]) return obra.fluxoEtapas[etapa.id];
    if (obra.fluxoEtapas[etapa.nome]) return obra.fluxoEtapas[etapa.nome];
    if (obra.fluxoEtapas[etapa.id.toLowerCase()]) return obra.fluxoEtapas[etapa.id.toLowerCase()];

    // Match by normalized text
    const targetNorm = normalizeText(etapa.nome);
    if (targetNorm) {
      for (const [key, val] of Object.entries(obra.fluxoEtapas)) {
        const keyNorm = normalizeText(key);
        if (
          keyNorm === targetNorm ||
          (targetNorm.length >= 4 && keyNorm.includes(targetNorm)) ||
          (keyNorm.length >= 4 && targetNorm.includes(keyNorm))
        ) {
          return val as StatusEtapa;
        }
      }
    }
    return 'NÃO INICIADO';
  };

  const handleQuickStepStatusChange = (obra: Obra, etapa: EtapaFluxoConfig, newStatus: StatusEtapa) => {
    const updatedObra: Obra = {
      ...obra,
      fluxoEtapas: {
        ...obra.fluxoEtapas,
        [etapa.id]: newStatus,
        [etapa.nome]: newStatus,
      },
    };
    onSaveObra(updatedObra);
  };

  const handleGlobalStatusChange = (obra: Obra, newStatusGlobal: StatusGlobalObra) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedObra: Obra = {
      ...obra,
      statusGlobal: newStatusGlobal,
      dataFinalizacao: newStatusGlobal === 'FINALIZADA' ? (obra.dataFinalizacao || todayStr) : undefined,
    };
    onSaveObra(updatedObra);
  };

  const getStepBadge = (status: StatusEtapa) => {
    switch (status) {
      case 'EXECUTADO':
        return 'bg-emerald-500 text-white font-bold';
      case 'EM ANDAMENTO':
        return 'bg-blue-600 text-white font-bold';
      case 'PARADO':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      default:
        return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-600/10 text-orange-600 rounded-xl">
              <HardHat className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestão de Obras & Fluxo de Produção
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento em tempo real de pedidos, cronogramas, etapas fabris e status de entrega.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Toggle Exibir Obras Arquivadas */}
          <button
            onClick={() => setExibirArquivadas(!exibirArquivadas)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
              exibirArquivadas
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            {exibirArquivadas ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{exibirArquivadas ? 'Ver Ativas' : 'Ver Arquivadas'}</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Obra</span>
            </button>
          )}

          {isReadOnly && (
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Modo Somente Leitura</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente, código da obra, cor, vendedor, observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Vendedor Filter */}
          <div>
            <select
              value={filterVendedor}
              onChange={(e) => setFilterVendedor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
            >
              <option value="TODOS">Todos os Vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Status Filter Buttons & Sort Orders */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('TODOS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'TODOS'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>Todas</span>
              <span className="text-[10px] opacity-80">({countTotal})</span>
            </button>

            <button
              onClick={() => setFilterStatus('NÃO AGENDADA')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'NÃO AGENDADA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              <span>Não Agendadas</span>
              <span className="text-[10px] opacity-80">({countNaoAgendadas})</span>
            </button>

            <button
              onClick={() => setFilterStatus('AGENDADA')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'AGENDADA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              <span>Agendadas</span>
              <span className="text-[10px] opacity-80">({countAgendadas})</span>
            </button>

            <button
              onClick={() => setFilterStatus('PENDENCIA')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'PENDENCIA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <span>Pendências</span>
              <span className="text-[10px] opacity-80">({countPendencias})</span>
            </button>

            <button
              onClick={() => setFilterStatus('ATRASADAS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'ATRASADAS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <span>Atrasadas</span>
              <span className="text-[10px] opacity-80">({countAtrasadas})</span>
            </button>

            <button
              onClick={() => setFilterStatus('ENTREGUE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'ENTREGUE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <span>Entregues</span>
              <span className="text-[10px] opacity-80">({countEntregues})</span>
            </button>

            <button
              onClick={() => setFilterStatus('FINALIZADA')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                filterStatus === 'FINALIZADA'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100'
              }`}
            >
              <span>Finalizadas</span>
              <span className="text-[10px] opacity-80">({countFinalizadas})</span>
            </button>
          </div>

          {/* Sorting controls */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-400">Ordenar:</span>
            <button
              type="button"
              onClick={() => setSortOrder('FILA_PADRAO')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                sortOrder === 'FILA_PADRAO'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Fila de Produção: Mais antiga no topo, novas no final"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Fila Padrão</span>
            </button>

            <button
              type="button"
              onClick={() => setSortOrder('PRAZO_ENTREGA')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                sortOrder === 'PRAZO_ENTREGA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Prazo de entrega mais urgente primeiro"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Prazo de Entrega</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Obras Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {/* Active Stage Columns Indicator Banner */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <Workflow className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Fluxo de Produção:{' '}
              <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                {activeEtapas.length} Etapas Ativas
              </span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {filteredObras.length} {filteredObras.length === 1 ? 'obra exibida' : 'obras exibidas'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[650px] scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-20">
                <th className="p-3 sticky left-0 bg-slate-900 z-30 w-[130px] min-w-[130px] max-w-[130px] border-r border-slate-800">Código</th>
                <th className="p-3 sticky left-[130px] bg-slate-900 z-30 w-[280px] min-w-[280px] max-w-[280px] border-r border-slate-800">Cliente / Obra</th>
                <th className="p-3 w-[160px] min-w-[160px] max-w-[160px]">Vendedor</th>
                <th className="p-3 w-[110px] min-w-[110px] text-center">Prioridade</th>
                <th className="p-3 w-[110px] min-w-[110px] text-center">Dt. Inicial</th>
                <th className="p-3 w-[100px] min-w-[100px] text-center">Prazo (Úteis)</th>
                <th className="p-3 w-[125px] min-w-[125px] text-center">Prev. Entrega</th>
                <th className="p-3 w-[130px] min-w-[130px] text-center bg-slate-900 border-x border-slate-800 text-blue-300 font-bold">Data Agendada</th>

                {/* EDITABLE FLOW PRODUCTION STAGES HEADERS */}
                {activeEtapas.map((etapa, idx) => (
                  <th key={etapa.id} className="p-3 w-[145px] min-w-[145px] text-center border-l border-slate-800">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-orange-400 font-extrabold">Etapa {idx + 1}</span>
                      <span className="truncate max-w-[135px]" title={etapa.nome}>{etapa.nome}</span>
                    </div>
                  </th>
                ))}

                <th className="p-3 w-[160px] min-w-[160px] border-l border-slate-800">Status Global</th>
                <th className="p-3 w-[110px] min-w-[110px] text-right pr-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredObras.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + activeEtapas.length + 2}
                    className="p-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    Nenhuma obra encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredObras.map((obra) => {
                  const overdue = isOverdue(obra.dataPrevistaEntrega, obra.statusGlobal);

                  const totalEtapasCount = activeEtapas.length || 1;
                  const completedEtapasCount = activeEtapas.filter(
                    (e) => getObraStepStatus(obra, e) === 'EXECUTADO'
                  ).length;
                  const percentCompleted = Math.round((completedEtapasCount / totalEtapasCount) * 100);

                  let rowBgClass = 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80';
                  let stickyBgClass = 'bg-white dark:bg-slate-900';
                  if (obra.statusGlobal === 'ENTREGUE') {
                    rowBgClass = 'bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border-l-4 border-l-emerald-500';
                    stickyBgClass = 'bg-emerald-50 dark:bg-slate-900';
                  } else if (obra.statusGlobal === 'FINALIZADA') {
                    rowBgClass = 'bg-orange-50/80 hover:bg-orange-100/80 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 border-l-4 border-l-orange-500';
                    stickyBgClass = 'bg-orange-50 dark:bg-slate-900';
                  } else if (overdue) {
                    rowBgClass = 'bg-rose-50/60 hover:bg-rose-100/60 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border-l-4 border-l-rose-500';
                    stickyBgClass = 'bg-rose-50 dark:bg-slate-900';
                  }

                  const canArchive = obra.statusGlobal === 'FINALIZADA';

                  return (
                    <tr key={obra.id} className={`transition ${rowBgClass}`}>
                      {/* Código */}
                      <td className={`p-3 font-bold text-slate-800 dark:text-slate-100 sticky left-0 ${stickyBgClass} z-10 w-[130px] min-w-[130px] max-w-[130px] border-r border-slate-200 dark:border-slate-800 shadow-xs`}>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-extrabold text-slate-900 dark:text-slate-100 block text-center truncate">
                          {obra.codigo}
                        </span>
                      </td>

                      {/* Cliente & Visual Progress */}
                      <td
                        onClick={() => handleOpenEditModal(obra)}
                        className={`p-3 font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer sticky left-[130px] ${stickyBgClass} z-10 w-[280px] min-w-[280px] max-w-[280px] border-r border-slate-200 dark:border-slate-800 shadow-xs`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate" title={obra.cliente}>
                            {obra.cliente}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            {obra.quantidade} pçs • {obra.cor}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded shrink-0">
                            {completedEtapasCount}/{totalEtapasCount} ({percentCompleted}%)
                          </span>
                        </div>
                        {/* Mini Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percentCompleted}%` }}
                          />
                        </div>
                      </td>

                      {/* Vendedor */}
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold truncate w-[160px] min-w-[160px] max-w-[160px]" title={obra.vendedorNome}>
                        {obra.vendedorNome}
                      </td>

                      {/* Prioridade */}
                      <td className="p-3 text-center w-[110px] min-w-[110px]">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold inline-block ${
                            obra.prioridade === 'URGENTE'
                              ? 'bg-rose-600 text-white'
                              : obra.prioridade === 'ALTA'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {obra.prioridade}
                        </span>
                      </td>

                      {/* Dt. Inicial */}
                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px] w-[110px] min-w-[110px]">
                        {formatDateBR(obra.dataInicial)}
                      </td>

                      {/* Prazo Dias Úteis */}
                      <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 w-[100px] min-w-[100px]">
                        {obra.prazoDiasUteis}d
                      </td>

                      {/* Prev. Entrega */}
                      <td className="p-3 text-center w-[125px] min-w-[125px]">
                        <div
                          className={`font-mono text-[11px] font-bold justify-center ${
                            overdue
                              ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {overdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{formatDateBR(obra.dataPrevistaEntrega)}</span>
                        </div>
                      </td>

                      {/* Data Agendada */}
                      <td className="p-3 text-center w-[130px] min-w-[130px] border-x border-slate-200/80 dark:border-slate-800/80">
                        {obra.dataAgendada ? (
                          <span className="font-mono text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-800 inline-block shadow-2xs">
                            {formatDateBR(obra.dataAgendada)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Não agendada</span>
                        )}
                      </td>

                      {/* PRODUCTION FLOW STEPS COLUMNS */}
                      {activeEtapas.map((etapa) => {
                        const currentStepStatus = getObraStepStatus(obra, etapa);

                        if (isReadOnly) {
                          return (
                            <td
                              key={etapa.id}
                              className="p-2 border-l border-slate-200/60 dark:border-slate-800/60 text-center"
                            >
                              <span className={`inline-block w-full text-[10px] py-1 px-1.5 rounded-lg shadow-2xs ${getStepBadge(
                                currentStepStatus
                              )}`}>
                                {currentStepStatus}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={etapa.id}
                            className="p-2 border-l border-slate-200/60 dark:border-slate-800/60 text-center"
                          >
                            <select
                              value={currentStepStatus}
                              onChange={(e) =>
                                handleQuickStepStatusChange(
                                  obra,
                                  etapa,
                                  e.target.value as StatusEtapa
                                )
                              }
                              className={`w-full text-[10px] py-1 px-1.5 rounded-lg border-0 shadow-2xs focus:ring-2 focus:ring-orange-500 cursor-pointer ${getStepBadge(
                                currentStepStatus
                              )}`}
                            >
                              <option value="NÃO INICIADO" className="bg-slate-100 text-slate-800">
                                NÃO INICIADO
                              </option>
                              <option value="EM ANDAMENTO" className="bg-blue-600 text-white">
                                EM ANDAMENTO
                              </option>
                              <option value="EXECUTADO" className="bg-emerald-600 text-white">
                                EXECUTADO
                              </option>
                              <option value="PARADO" className="bg-rose-600 text-white">
                                PARADO
                              </option>
                            </select>
                          </td>
                        );
                      })}

                      {/* Status Global */}
                      <td className="p-2 border-l border-slate-200/60 dark:border-slate-800/60">
                        {isReadOnly ? (
                          <span className="inline-block w-full text-[10px] font-extrabold py-1 px-2 rounded-lg bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 text-center">
                            {obra.statusGlobal}
                          </span>
                        ) : (
                          <select
                            value={obra.statusGlobal}
                            onChange={(e) =>
                              handleGlobalStatusChange(obra, e.target.value as StatusGlobalObra)
                            }
                            className="w-full text-[10px] font-extrabold py-1 px-2 rounded-lg bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 cursor-pointer"
                          >
                            <option value="NÃO AGENDADA">NÃO AGENDADA</option>
                            <option value="AGENDADA">AGENDADA</option>
                            <option value="PENDENCIA">PENDENCIA</option>
                            <option value="ENTREGUE">ENTREGUE</option>
                            <option value="FINALIZADA">FINALIZADA</option>
                          </select>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="p-3 text-right space-x-1 pr-4">
                        {isReadOnly ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(obra);
                            }}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Visualizar Detalhes da Obra"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(obra);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Editar Obra"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Archive / Unarchive Button */}
                            {obra.arquivada ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUnarchiveObra) {
                                    onUnarchiveObra(obra.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer transition"
                                title="Desarquivar / Reativar Obra (Voltar para Obras Ativas)"
                              >
                                <ArchiveRestore className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                disabled={!canArchive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onArchiveObra) {
                                    onArchiveObra(obra.id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition ${
                                  canArchive
                                    ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer'
                                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                                }`}
                                title={
                                  canArchive
                                    ? 'Arquivar Obra Finalizada'
                                    : 'O botão Arquivar só fica habilitado após a obra mudar para FINALIZADA'
                                }
                              >
                                {canArchive ? <Archive className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setObraToDelete(obra);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                              title="Excluir Obra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Obra Form Modal (Internal trigger fallback) */}
      {showModal && (
        <ObraFormModal
          editingObra={editingObra}
          vendedores={vendedores}
          etapas={activeEtapas}
          onSave={(data) => {
            onSaveObra(data);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {obraToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(obraToDelete)}
          title="Excluir Obra"
          message={`Tem certeza que deseja excluir a obra ${obraToDelete.codigo} - ${obraToDelete.cliente}? Esta ação removerá a obra permanentemente do sistema.`}
          onConfirm={() => {
            onDeleteObra(obraToDelete.id);
            setObraToDelete(null);
          }}
          onCancel={() => setObraToDelete(null)}
        />
      )}
    </div>
  );
};
