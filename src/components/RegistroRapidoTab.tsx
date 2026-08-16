import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ShieldAlert,
  Tag,
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  X,
  Share2,
  SlidersHorizontal,
  Flame,
  Check,
  Building2,
  Users,
  Package,
  Wrench,
  Shield,
  Eye
} from 'lucide-react';
import {
  RegistroRapidoItem,
  RegistroRapidoTipo,
  RegistroRapidoCategoria,
  RegistroRapidoStatus,
  PDCAItem,
  GUTItem,
  FiveWTwoHItem,
  BrainstormingIdea,
  EisenhowerItem
} from '../types';
import { formatDateBR } from '../utils/dateUtils';
import { useDialog } from './DialogContext';

interface RegistroRapidoTabProps {
  registros: RegistroRapidoItem[];
  onSaveRegistro: (item: RegistroRapidoItem) => void;
  onDeleteRegistro: (id: string) => void;
  onConvertToPDCA?: (item: PDCAItem) => void;
  onConvertToGUT?: (item: GUTItem) => void;
  onConvertTo5W2H?: (item: FiveWTwoHItem) => void;
  onConvertToBrainstorming?: (item: BrainstormingIdea) => void;
  onConvertToEisenhower?: (item: EisenhowerItem) => void;
}

const TIPOS_CONFIG: Record<
  RegistroRapidoTipo,
  { label: string; sub: string; color: string; bg: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  PROBLEMA: {
    label: 'Problema',
    sub: 'algo que precisa ser resolvido',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-900',
    icon: AlertTriangle,
  },
  IDEIA: {
    label: 'Ideia',
    sub: 'sugestão de melhoria',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-900',
    icon: Lightbulb,
  },
  OPORTUNIDADE: {
    label: 'Oportunidade',
    sub: 'potencial de ganho',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-900',
    icon: TrendingUp,
  },
  RISCO: {
    label: 'Risco',
    sub: 'ameaça potencial',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    border: 'border-purple-200 dark:border-purple-900',
    icon: ShieldAlert,
  },
};

const CATEGORIAS_CONFIG: Record<
  RegistroRapidoCategoria,
  { label: string; sub: string; color: string; bg: string; icon: React.FC<{ className?: string }> }
> = {
  QUALIDADE: {
    label: 'Qualidade',
    sub: 'defeitos, refugo, não conformidade',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    icon: Shield,
  },
  PRODUCAO: {
    label: 'Produção',
    sub: 'paradas, gargalos, produtividade',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    icon: Wrench,
  },
  ESTOQUE: {
    label: 'Estoque',
    sub: 'falta, excesso, obsolescência',
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    icon: Package,
  },
  SEGURANCA: {
    label: 'Segurança',
    sub: 'acidentes, riscos, EPIs',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    icon: ShieldAlert,
  },
  PESSOAS: {
    label: 'Pessoas',
    sub: 'treinamento, clima, absenteísmo',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    icon: Users,
  },
};

const SUGGESTED_TAGS = [
  'maquina',
  'parada',
  'urgente',
  'pantografo',
  'ferramenta',
  'perfil',
  'fornecedor',
  'corte',
  'montagem',
  'qualidade',
  'entrega',
  'usinagem',
  'embalagem'
];

export const RegistroRapidoTab: React.FC<RegistroRapidoTabProps> = ({
  registros = [],
  onSaveRegistro,
  onDeleteRegistro,
  onConvertToPDCA,
  onConvertToGUT,
  onConvertTo5W2H,
  onConvertToBrainstorming,
  onConvertToEisenhower,
}) => {
  const { showAlert, showConfirm } = useDialog();
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RegistroRapidoItem | null>(null);

  // Form Fields
  const [formTipo, setFormTipo] = useState<RegistroRapidoTipo>('PROBLEMA');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCategoria, setFormCategoria] = useState<RegistroRapidoCategoria>('PRODUCAO');
  const [formTags, setFormTags] = useState('maquina, parada, urgente, pantografo, ferramenta');
  const [formStatus, setFormStatus] = useState<RegistroRapidoStatus>('PENDENTE');
  const [formResponsavel, setFormResponsavel] = useState('');

  // Quick inline form expansion
  const [showInlineForm, setShowInlineForm] = useState(false);

  // Conversion notification state
  const [convertedToast, setConvertedToast] = useState<string | null>(null);

  const openNewForm = () => {
    setEditingItem(null);
    setFormTipo('PROBLEMA');
    setFormDescricao('');
    setFormCategoria('PRODUCAO');
    setFormTags('maquina, parada, urgente, pantografo, ferramenta');
    setFormStatus('PENDENTE');
    setFormResponsavel('');
    setShowModal(true);
  };

  const openEditForm = (item: RegistroRapidoItem) => {
    setEditingItem(item);
    setFormTipo(item.tipo);
    setFormDescricao(item.descricaoCurta || item.descricao || '');
    setFormCategoria(item.categoria);
    setFormTags(item.tags?.join(', ') || '');
    setFormStatus(item.status);
    setFormResponsavel(item.responsavel || '');
    setShowModal(true);
  };

  const handleSaveForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formDescricao.trim()) {
      showAlert('Por favor, informe a descrição do registro.', { type: 'warning' });
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newItem: RegistroRapidoItem = {
      id: editingItem ? editingItem.id : `rr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tipo: formTipo,
      descricaoCurta: formDescricao.trim(),
      descricao: formDescricao.trim(),
      categoria: formCategoria,
      tags: tagsArray,
      status: formStatus,
      responsavel: formResponsavel.trim() || undefined,
      dataCriacao: editingItem ? editingItem.dataCriacao : new Date().toISOString(),
      convertidoEm: editingItem?.convertidoEm,
    };

    onSaveRegistro(newItem);
    setShowModal(false);
    setShowInlineForm(false);
    setFormDescricao('');
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = await showConfirm('Tem certeza que deseja excluir este registro rápido?', {
      title: 'Excluir Registro',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      onDeleteRegistro(id);
      if (editingItem?.id === id) {
        setShowModal(false);
      }
    }
  };

  const handleAddTagToForm = (tag: string) => {
    const current = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!current.includes(tag)) {
      setFormTags([...current, tag].join(', '));
    }
  };

  const handleQuickStatusChange = (item: RegistroRapidoItem, newStatus: RegistroRapidoStatus) => {
    const updated: RegistroRapidoItem = {
      ...item,
      status: newStatus,
    };
    onSaveRegistro(updated);
  };

  // Conversões Rápidas
  const handleConvertPDCA = (item: RegistroRapidoItem) => {
    if (!onConvertToPDCA) return;
    const desc = item.descricaoCurta || item.descricao || '';
    const pdca: PDCAItem = {
      id: `pdca_${Date.now()}`,
      titulo: `[${item.tipo}] ${desc.slice(0, 60)}...`,
      plan: `Origem Registro Rápido (${item.categoria}):\n${desc}\nTags: ${item.tags.join(', ')}`,
      do: '',
      check: '',
      act: '',
      status: 'EM ANDAMENTO',
      dataCriacao: new Date().toISOString(),
    };
    onConvertToPDCA(pdca);
    onSaveRegistro({ ...item, status: 'CONVERTIDO', convertidoEm: 'PDCA' });
    setConvertedToast(`Convertido com sucesso em Ciclo PDCA!`);
    setTimeout(() => setConvertedToast(null), 4000);
  };

  const handleConvertGUT = (item: RegistroRapidoItem) => {
    if (!onConvertToGUT) return;
    const desc = item.descricaoCurta || item.descricao || '';
    const gut: GUTItem = {
      id: `gut_${Date.now()}`,
      problema: `[${item.tipo}] ${desc}`,
      gravidade: item.tipo === 'PROBLEMA' || item.tipo === 'RISCO' ? 4 : 3,
      urgencia: item.tags.includes('urgente') || item.tags.includes('parada') ? 5 : 3,
      tendencia: 3,
      acaoProposta: `Tratar item registrado em ${item.categoria}`,
      responsavel: item.responsavel || 'Equipe',
      dataCriacao: new Date().toISOString(),
    };
    onConvertToGUT(gut);
    onSaveRegistro({ ...item, status: 'CONVERTIDO', convertidoEm: 'GUT' });
    setConvertedToast(`Convertido com sucesso na Matriz GUT!`);
    setTimeout(() => setConvertedToast(null), 4000);
  };

  const handleConvert5W2H = (item: RegistroRapidoItem) => {
    if (!onConvertTo5W2H) return;
    const desc = item.descricaoCurta || item.descricao || '';
    const f5: FiveWTwoHItem = {
      id: `5w2h_${Date.now()}`,
      what: `[${item.tipo}] ${desc}`,
      why: `Melhoria/resolução em ${item.categoria} identificada no registro rápido`,
      where: 'Fábrica / Obra',
      when: formatDateBR(new Date().toISOString()),
      who: item.responsavel || 'Responsável pelo setor',
      how: `Tratar ocorrências com tags: ${item.tags.join(', ')}`,
      howMuch: 'A definir',
      status: 'EM ANDAMENTO',
      dataCriacao: new Date().toISOString(),
    };
    onConvertTo5W2H(f5);
    onSaveRegistro({ ...item, status: 'CONVERTIDO', convertidoEm: '5W2H' });
    setConvertedToast(`Convertido com sucesso no Plano 5W2H!`);
    setTimeout(() => setConvertedToast(null), 4000);
  };

  const handleConvertBrainstorming = (item: RegistroRapidoItem) => {
    if (!onConvertToBrainstorming) return;
    const desc = item.descricaoCurta || item.descricao || '';
    const idea: BrainstormingIdea = {
      id: `brain_${Date.now()}`,
      topico: `Melhoria em ${item.categoria}`,
      ideia: desc,
      autor: item.responsavel || 'Operação',
      votos: 1,
      status: 'SELECIONADA',
      dataCriacao: new Date().toISOString(),
    };
    onConvertToBrainstorming(idea);
    onSaveRegistro({ ...item, status: 'CONVERTIDO', convertidoEm: 'BRAINSTORMING' });
    setConvertedToast(`Convertido com sucesso no Brainstorming!`);
    setTimeout(() => setConvertedToast(null), 4000);
  };

  const handleConvertEisenhower = (item: RegistroRapidoItem) => {
    if (!onConvertToEisenhower) return;
    const desc = item.descricaoCurta || item.descricao || '';
    const isUrg = item.tags.includes('urgente') || item.tags.includes('parada') || item.tipo === 'PROBLEMA';
    const eis: EisenhowerItem = {
      id: `eis_${Date.now()}`,
      titulo: `[${item.tipo}] ${desc}`,
      descricao: `Categoria: ${item.categoria} | Tags: ${item.tags.join(', ')}`,
      urgente: isUrg,
      importante: true,
      dataCriacao: new Date().toISOString(),
    };
    onConvertToEisenhower(eis);
    onSaveRegistro({ ...item, status: 'CONVERTIDO', convertidoEm: 'EISENHOWER' });
    setConvertedToast(`Convertido com sucesso na Matriz Eisenhower!`);
    setTimeout(() => setConvertedToast(null), 4000);
  };

  // Filter items
  const filteredRegistros = registros.filter((item) => {
    const desc = item.descricaoCurta || item.descricao || '';
    const matchSearch =
      searchTerm.trim() === '' ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo = filterTipo === 'TODOS' || item.tipo === filterTipo;
    const matchCat = filterCategoria === 'TODAS' || item.categoria === filterCategoria;
    const matchStatus = filterStatus === 'TODOS' || item.status === filterStatus;

    return matchSearch && matchTipo && matchCat && matchStatus;
  });

  // Metrics
  const countProblemas = registros.filter((r) => r.tipo === 'PROBLEMA').length;
  const countIdeias = registros.filter((r) => r.tipo === 'IDEIA').length;
  const countOportunidades = registros.filter((r) => r.tipo === 'OPORTUNIDADE').length;
  const countRiscos = registros.filter((r) => r.tipo === 'RISCO').length;
  const countPendentes = registros.filter((r) => r.status === 'PENDENTE').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {convertedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center space-x-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-xs font-bold">{convertedToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">Registro Rápido de Ocorrências & Ideias</h2>
              <p className="text-xs text-orange-100 mt-0.5 max-w-2xl">
                Capture problemas de máquina, paradas, ideias e oportunidades de imediato no chão de fábrica e transforme-os em PDCA, GUT ou 5W2H com 1 clique.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={openNewForm}
            className="px-4 py-2.5 bg-white text-orange-700 hover:bg-orange-50 font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro Rápido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setFilterTipo('TODOS')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            filterTipo === 'TODOS'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-slate-700'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white hover:border-orange-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">Total Geral</span>
          <span className="text-xl font-black">{registros.length}</span>
        </div>

        <div
          onClick={() => setFilterTipo('PROBLEMA')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            filterTipo === 'PROBLEMA'
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Problemas</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black">{countProblemas}</span>
        </div>

        <div
          onClick={() => setFilterTipo('IDEIA')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            filterTipo === 'IDEIA'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Ideias</span>
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black">{countIdeias}</span>
        </div>

        <div
          onClick={() => setFilterTipo('OPORTUNIDADE')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            filterTipo === 'OPORTUNIDADE'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Oportunidades</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black">{countOportunidades}</span>
        </div>

        <div
          onClick={() => setFilterTipo('RISCO')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            filterTipo === 'RISCO'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-200 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Riscos</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black">{countRiscos}</span>
        </div>

        <div
          onClick={() => setFilterStatus('PENDENTE')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            filterStatus === 'PENDENTE'
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900 text-orange-800 dark:text-orange-200 hover:border-orange-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Pendentes</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black">{countPendentes}</span>
        </div>
      </div>

      {/* Inline Quick Action Form Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Captura Direta (1 Clique)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowInlineForm(!showInlineForm)}
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            {showInlineForm ? 'Recolher Painel' : 'Expandir Formulário Completo'}
          </button>
        </div>

        {/* Linha de Tipo e Categoria Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Seletor de Tipo com Subtítulo explicativo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo da Ocorrência
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['PROBLEMA', 'IDEIA', 'OPORTUNIDADE', 'RISCO'] as RegistroRapidoTipo[]).map((t) => {
                const conf = TIPOS_CONFIG[t];
                const Icon = conf.icon;
                const isSelected = formTipo === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormTipo(t)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${conf.bg} ${conf.border} border-2 shadow-xs`
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                      <span className={`text-xs font-extrabold ${conf.color}`}>{conf.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-tight line-clamp-1">
                      {conf.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Categoria com Subtítulo explicativo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(['QUALIDADE', 'PRODUCAO', 'ESTOQUE', 'SEGURANCA', 'PESSOAS'] as RegistroRapidoCategoria[]).map((c) => {
                const conf = CATEGORIAS_CONFIG[c];
                const Icon = conf.icon;
                const isSelected = formCategoria === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormCategoria(c)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${conf.bg} border-orange-500 border-2 shadow-xs`
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                      <span className={`text-xs font-bold ${conf.color}`}>{conf.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-tight line-clamp-1">
                      {conf.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Input Descrição e Botão Salvar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveForm();
              }
            }}
            placeholder="Descreva rapidamente o ocorrido (ex: Pantógrafo parou com falha na fixação da peça)..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => handleSaveForm()}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Agora</span>
          </button>
        </div>

        {/* Sugestões de Tags Rápidas */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" />
            Tags rápidas:
          </span>
          {SUGGESTED_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleAddTagToForm(t)}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-950 dark:hover:text-orange-300 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              +{t}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por texto, tags ou responsável..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Selects de Filtros */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tipo */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="PROBLEMA">Problemas</option>
            <option value="IDEIA">Ideias</option>
            <option value="OPORTUNIDADE">Oportunidades</option>
            <option value="RISCO">Riscos</option>
          </select>

          {/* Categoria */}
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="TODAS">Todas as Categorias</option>
            <option value="QUALIDADE">Qualidade</option>
            <option value="PRODUCAO">Produção</option>
            <option value="ESTOQUE">Estoque</option>
            <option value="SEGURANCA">Segurança</option>
            <option value="PESSOAS">Pessoas</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="CONVERTIDO">Convertido</option>
            <option value="CONCLUIDO">Concluído</option>
          </select>

          {(searchTerm || filterTipo !== 'TODOS' || filterCategoria !== 'TODAS' || filterStatus !== 'TODOS') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterTipo('TODOS');
                setFilterCategoria('TODAS');
                setFilterStatus('TODOS');
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl text-xs font-bold transition"
              title="Limpar Filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Cards de Registros Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegistros.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum registro rápido encontrado
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Utilize o campo acima para registrar novas ocorrências no chão de fábrica ou altere os filtros.
            </p>
            <button
              type="button"
              onClick={openNewForm}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
            >
              Adicionar Primeiro Registro
            </button>
          </div>
        ) : (
          filteredRegistros.map((item) => {
            const tipoConf = TIPOS_CONFIG[item.tipo] || TIPOS_CONFIG.PROBLEMA;
            const catConf = CATEGORIAS_CONFIG[item.categoria] || CATEGORIAS_CONFIG.PRODUCAO;
            const TipoIcon = tipoConf.icon;
            const CatIcon = catConf.icon;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4 group relative"
              >
                <div>
                  {/* Top Bar: Tipo Badge + Categoria Badge + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase flex items-center space-x-1 ${tipoConf.bg} ${tipoConf.color} border ${tipoConf.border}`}>
                        <TipoIcon className="w-3 h-3" />
                        <span>{tipoConf.label}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 ${catConf.bg} ${catConf.color}`}>
                        <CatIcon className="w-3 h-3" />
                        <span>{catConf.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Status Selector */}
                      <select
                        value={item.status}
                        onChange={(e) => handleQuickStatusChange(item, e.target.value as RegistroRapidoStatus)}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border outline-none cursor-pointer ${
                          item.status === 'CONCLUIDO'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'CONVERTIDO'
                            ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                            : item.status === 'EM_ANALISE'
                            ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANALISE">Em Análise</option>
                        <option value="CONVERTIDO">Convertido</option>
                        <option value="CONCLUIDO">Concluído</option>
                      </select>
                    </div>
                  </div>

                  {/* Descrição */}
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-3 leading-relaxed">
                    {item.descricaoCurta || item.descricao}
                  </h4>

                  {/* Subtext explicativo da categoria */}
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    {tipoConf.sub} • {catConf.sub}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1 mt-3">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          onClick={() => setSearchTerm(tag)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-700 cursor-pointer transition"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Converted badge if any */}
                  {item.convertidoEm && (
                    <div className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Convertido em: {item.convertidoEm}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Data + Ações + Menu de Conversão 1-Clique */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDateBR(item.dataCriacao)}</span>
                    {item.responsavel && (
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Resp: {item.responsavel}
                      </span>
                    )}
                  </div>

                  {/* Quick Convert Buttons */}
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-orange-500" />
                      Transformar em Ação:
                    </span>
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => handleConvertPDCA(item)}
                        className="p-1 bg-white dark:bg-slate-900 hover:bg-orange-600 hover:text-white rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition text-center cursor-pointer shadow-2xs"
                        title="Criar Ciclo PDCA com este registro"
                      >
                        + PDCA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConvertGUT(item)}
                        className="p-1 bg-white dark:bg-slate-900 hover:bg-rose-600 hover:text-white rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition text-center cursor-pointer shadow-2xs"
                        title="Priorizar na Matriz GUT"
                      >
                        + GUT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConvert5W2H(item)}
                        className="p-1 bg-white dark:bg-slate-900 hover:bg-blue-600 hover:text-white rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition text-center cursor-pointer shadow-2xs"
                        title="Criar Plano 5W2H"
                      >
                        + 5W2H
                      </button>
                    </div>
                  </div>

                  {/* Botões Editar / Excluir */}
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição Completa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingItem ? 'Editar Registro Rápido' : 'Novo Registro Rápido'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ocorrência ou ideia para resolução e melhoria contínua
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Campo Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PROBLEMA', 'IDEIA', 'OPORTUNIDADE', 'RISCO'] as RegistroRapidoTipo[]).map((t) => {
                    const conf = TIPOS_CONFIG[t];
                    const Icon = conf.icon;
                    const isSelected = formTipo === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormTipo(t)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${conf.bg} ${conf.border} border-2 shadow-xs`
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Icon className={`w-4 h-4 ${conf.color}`} />
                          <span className={`text-xs font-extrabold ${conf.color}`}>{conf.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          ({conf.sub})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campo Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['QUALIDADE', 'PRODUCAO', 'ESTOQUE', 'SEGURANCA', 'PESSOAS'] as RegistroRapidoCategoria[]).map((c) => {
                    const conf = CATEGORIAS_CONFIG[c];
                    const Icon = conf.icon;
                    const isSelected = formCategoria === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormCategoria(c)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${
                          isSelected
                            ? `${conf.bg} border-orange-500 border-2 shadow-xs`
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${conf.color} shrink-0`} />
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block ${conf.color}`}>{conf.label}</span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            ({conf.sub})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição da Ocorrência *
                </label>
                <textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Informe os detalhes do problema, parada de máquina, gargalo, ou sugestão de melhoria..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Campo Tags (separadas por vírgula) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tags (separadas por vírgula)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">ex: maquina, parada, urgente, pantografo, ferramenta</span>
                </div>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="maquina, parada, urgente, pantografo, ferramenta"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                />
                {/* Tag suggestions */}
                <div className="flex items-center flex-wrap gap-1 mt-1.5">
                  {SUGGESTED_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTagToForm(t)}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded transition cursor-pointer"
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status e Responsável */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as RegistroRapidoStatus)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="CONVERTIDO">Convertido</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formResponsavel}
                    onChange={(e) => setFormResponsavel(e.target.value)}
                    placeholder="Nome do operador ou gestor..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingItem.id)}
                    className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition flex items-center space-x-1 cursor-pointer border border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Registro</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
