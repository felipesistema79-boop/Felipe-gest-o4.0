import React, { useState, useEffect } from 'react';
import { X, Calendar, Calculator, Save, Workflow } from 'lucide-react';
import { Obra, Vendedor, EtapaFluxoConfig, PrioridadeObra, StatusGlobalObra, StatusEtapa } from '../types';
import { addBusinessDays, formatDateBR } from '../utils/dateUtils';
import { defaultEtapas } from '../services/storage';
import { useDialog } from './DialogContext';

interface ObraFormModalProps {
  obraToEdit?: Obra | null;
  editingObra?: Obra | null;
  vendedores?: Vendedor[];
  etapas?: EtapaFluxoConfig[];
  isReadOnly?: boolean;
  onSave: (obraData: Obra) => void;
  onClose: () => void;
  isOpen?: boolean;
}

export const ObraFormModal: React.FC<ObraFormModalProps> = ({
  obraToEdit,
  editingObra,
  vendedores = [],
  etapas = [],
  isReadOnly = false,
  onSave,
  onClose,
}) => {
  const { showAlert } = useDialog();
  const currentObra = editingObra !== undefined ? editingObra : obraToEdit;
  const todayStr = new Date().toISOString().split('T')[0];

  const activeEtapas = etapas && etapas.length > 0 ? etapas : defaultEtapas;

  // In new obra form, codigo and vendedor open empty
  const [codigo, setCodigo] = useState(currentObra?.codigo || '');
  const [cliente, setCliente] = useState(currentObra?.cliente || '');
  const [vendedorId, setVendedorId] = useState(currentObra?.vendedorId || '');
  const [prioridade, setPrioridade] = useState<PrioridadeObra>(currentObra?.prioridade || 'NORMAL');
  const [quantidade, setQuantidade] = useState<number>(currentObra?.quantidade || 1);
  const [cor, setCor] = useState(currentObra?.cor || 'Branco');
  const [dataInicial, setDataInicial] = useState(currentObra?.dataInicial || todayStr);

  const [prazoDiasUteis, setPrazoDiasUteis] = useState<number>(currentObra?.prazoDiasUteis || 15);
  const [dataAgendada, setDataAgendada] = useState(currentObra?.dataAgendada || '');
  const [statusGlobal, setStatusGlobal] = useState<StatusGlobalObra>(
    currentObra?.statusGlobal || (currentObra?.dataAgendada ? 'AGENDADA' : 'NÃO AGENDADA')
  );
  const [observacoes, setObservacoes] = useState(currentObra?.observacoes || '');

  // Fluxo de etapas status state
  const [fluxoEtapas, setFluxoEtapas] = useState<Record<string, StatusEtapa>>(() => {
    const initial: Record<string, StatusEtapa> = currentObra?.fluxoEtapas ? { ...currentObra.fluxoEtapas } : {};
    activeEtapas.forEach((e) => {
      if (!initial[e.id]) {
        initial[e.id] = initial[e.nome] || 'NÃO INICIADO';
      }
    });
    return initial;
  });

  // Calculate Data Prevista de Entrega automatically (Data Inicial + Dias Úteis)
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState(
    addBusinessDays(dataInicial, prazoDiasUteis)
  );

  useEffect(() => {
    setDataPrevistaEntrega(addBusinessDays(dataInicial, prazoDiasUteis));
  }, [dataInicial, prazoDiasUteis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      showAlert('Por favor informe o Código da Obra.', { type: 'warning' });
      return;
    }
    if (!cliente.trim()) {
      showAlert('Por favor informe o Nome do Cliente ou Identificação da Obra.', { type: 'warning' });
      return;
    }

    const selectedVend = vendedores.find((v) => v.id === vendedorId);

    const finalFluxo: Record<string, StatusEtapa> = { ...fluxoEtapas };
    activeEtapas.forEach((et) => {
      const st = fluxoEtapas[et.id] || fluxoEtapas[et.nome] || 'NÃO INICIADO';
      finalFluxo[et.id] = st;
      finalFluxo[et.nome] = st;
    });

    const obraData: Obra = {
      id: currentObra?.id || `obra-${Date.now()}`,
      codigo: codigo.trim(),
      cliente: cliente.trim(),
      vendedorId: vendedorId || undefined,
      vendedorNome: selectedVend?.nome || (vendedorId ? 'Vendedor Selecionado' : 'Não Informado'),
      prioridade,
      quantidade: Number(quantidade) || 1,
      cor: cor.trim(),
      dataInicial,
      prazoDiasUteis: Number(prazoDiasUteis) || 1,
      dataPrevistaEntrega,
      dataAgendada: dataAgendada || undefined,
      statusGlobal,
      observacoes: observacoes.trim(),
      fluxoEtapas: finalFluxo,
      arquivada: currentObra?.arquivada || false,
      dataCriacao: currentObra?.dataCriacao || todayStr,
      dataFinalizacao: statusGlobal === 'FINALIZADA' ? (currentObra?.dataFinalizacao || todayStr) : undefined,
    };

    onSave(obraData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base">
                {isReadOnly
                  ? `Visualizar Obra: ${currentObra?.codigo || ''}`
                  : currentObra
                  ? `Editar Obra: ${currentObra.codigo}`
                  : 'Cadastrar Nova Obra'}
              </h3>
              {isReadOnly && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Somente Leitura
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isReadOnly
                ? 'Visualização de detalhes, prazos e fluxo de produção'
                : 'Preencha os dados e prazos de entrega em dias úteis'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código da Obra *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: OBR-1042"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente / Identificação da Obra *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Res. Alphaville - Casa 42 (Dr. Fernando)"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vendedor Responsável
              </label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              >
                <option value="">-- Selecione o Vendedor (Vazio) --</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeObra)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="ALTA">ALTA</option>
                <option value="URGENTE">URGENTE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade de Itens/Pçs
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cor / Acabamento
              </label>
              <input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="Ex: Preto Anodizado, Branco, Inox, Amadeirado"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Dates & Automatic Calculation Box */}
          <div className="p-4 bg-orange-50/60 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-3">
            <div className="flex items-center space-x-2 text-orange-900 dark:text-orange-200 font-bold text-xs">
              <Calculator className="w-4 h-4 text-orange-600" />
              <span>Cálculo Automático de Prazo em Dias Úteis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  required
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prazo em Dias Úteis
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={prazoDiasUteis}
                  onChange={(e) => setPrazoDiasUteis(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-orange-900 dark:text-orange-300 mb-1">
                  Data Prevista de Entrega
                </label>
                <div className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border-2 border-orange-500 rounded-xl font-extrabold text-orange-700 dark:text-orange-300 flex items-center justify-between">
                  <span>{formatDateBR(dataPrevistaEntrega)}</span>
                  <span className="text-[10px] bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1.5 py-0.5 rounded">
                    Calculado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Global Status & Scheduled Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Global da Obra
              </label>
              <select
                value={statusGlobal}
                onChange={(e) => setStatusGlobal(e.target.value as StatusGlobalObra)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="NÃO AGENDADA">NÃO AGENDADA</option>
                <option value="AGENDADA">AGENDADA</option>
                <option value="PENDENCIA">PENDENCIA</option>
                <option value="ENTREGUE">ENTREGUE (Destaque Verde)</option>
                <option value="FINALIZADA">FINALIZADA (Destaque Laranja - Habilita Arquivamento)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Agendada (Instalação/Entrega)
              </label>
              <input
                type="date"
                value={dataAgendada}
                onChange={(e) => {
                  const val = e.target.value;
                  setDataAgendada(val);
                  if (val && (statusGlobal === 'NÃO AGENDADA' || !statusGlobal)) {
                    setStatusGlobal('AGENDADA');
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Fluxo de Produção Initial Step Statuses */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-orange-600" />
                <span>Fluxo de Produção Fabril ({activeEtapas.length} Etapas)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">
                Status de cada etapa na linha de produção
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {activeEtapas.map((etapa, idx) => (
                <div key={etapa.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-orange-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate" title={etapa.nome}>
                      {etapa.nome}
                    </p>
                  </div>
                  <select
                    value={fluxoEtapas[etapa.id] || 'NÃO INICIADO'}
                    onChange={(e) =>
                      setFluxoEtapas({
                        ...fluxoEtapas,
                        [etapa.id]: e.target.value as StatusEtapa,
                        [etapa.nome]: e.target.value as StatusEtapa,
                      })
                    }
                    className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="NÃO INICIADO">NÃO INICIADO</option>
                    <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                    <option value="EXECUTADO">EXECUTADO</option>
                    <option value="PARADO">PARADO</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações & Detalhes Técnicos
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções de fabricação, especificações, vidros, acessórios ou particularidades da obra..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Obra</span>
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
