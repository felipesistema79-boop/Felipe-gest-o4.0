import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Save,
  Building,
  FileText
} from 'lucide-react';
import { Compra, Fornecedor, StatusCompra } from '../types';
import { addBusinessDays, formatDateBR, isOverdue } from '../utils/dateUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useDialog } from './DialogContext';

interface ComprasManagerProps {
  compras?: Compra[];
  fornecedores?: Fornecedor[];
  onSaveCompra: (compra: Compra) => void;
  onDeleteCompra: (id: string) => void;
}

export const ComprasManager: React.FC<ComprasManagerProps> = ({
  compras = [],
  fornecedores = [],
  onSaveCompra,
  onDeleteCompra,
}) => {
  const { showAlert } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  const [showModal, setShowModal] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [compraToDelete, setCompraToDelete] = useState<Compra | null>(null);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [codigoPedido, setCodigoPedido] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [material, setMaterial] = useState('');
  const [dataEnviada, setDataEnviada] = useState(todayStr);
  const [prazoDiasUteis, setPrazoDiasUteis] = useState<number>(5);
  const [dataAprovacao, setDataAprovacao] = useState('');
  const [status, setStatus] = useState<StatusCompra>('EM COTAÇÃO');
  const [observacao, setObservacao] = useState('');

  const handleOpenAdd = () => {
    setEditingCompra(null);
    const initialForn = fornecedores[0];
    setCodigoPedido(`PED-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    setFornecedorId(initialForn?.id || '');
    setMaterial(initialForn?.materialEscopo || '');
    setDataEnviada(todayStr);
    setPrazoDiasUteis(initialForn?.prazoEntregaPadraoDiasUteis || 5);
    setDataAprovacao('');
    setStatus('EM COTAÇÃO');
    setObservacao('');
    setShowModal(true);
  };

  const handleOpenEdit = (compra: Compra) => {
    setEditingCompra(compra);
    setCodigoPedido(compra.codigoPedido);
    setFornecedorId(compra.fornecedorId);
    setMaterial(compra.material);
    setDataEnviada(compra.dataEnviada);
    setPrazoDiasUteis(compra.prazoDiasUteis);
    setDataAprovacao(compra.dataAprovacao || '');
    setStatus(compra.status);
    setObservacao(compra.observacao || '');
    setShowModal(true);
  };

  // When Fornecedor is selected, auto load default delivery days and scope
  const handleFornecedorChange = (id: string) => {
    setFornecedorId(id);
    const forn = fornecedores.find((f) => f.id === id);
    if (forn) {
      setPrazoDiasUteis(forn.prazoEntregaPadraoDiasUteis);
      if (!material) setMaterial(forn.materialEscopo);
    }
  };

  // Auto calculate Delivery Date based on Approval Date or Sent Date
  const calculateDeliveryDate = () => {
    const baseDate = dataAprovacao || dataEnviada || todayStr;
    return addBusinessDays(baseDate, prazoDiasUteis);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!material.trim()) {
      showAlert('Por favor informe a Descrição do Material/Insumo.', { type: 'warning' });
      return;
    }

    const fornObj = fornecedores.find((f) => f.id === fornecedorId);
    const calculatedPrevista = calculateDeliveryDate();

    // Auto status check for ATRASADO
    let finalStatus = status;
    if (finalStatus !== 'ENTREGUE' && isOverdue(calculatedPrevista, finalStatus)) {
      finalStatus = 'ATRASADO';
    }

    const compraData: Compra = {
      id: editingCompra?.id || `comp-${Date.now()}`,
      codigoPedido: codigoPedido.trim(),
      fornecedorId,
      fornecedorNome: fornObj?.razaoSocial || 'Geral',
      material: material.trim(),
      dataEnviada,
      prazoDiasUteis: Number(prazoDiasUteis) || 1,
      dataAprovacao: dataAprovacao || undefined,
      dataEntregaPrevista: calculatedPrevista,
      status: finalStatus,
      valorTotal: 0,
      observacao: observacao.trim(),
      requisicaoId: editingCompra?.requisicaoId,
    };

    onSaveCompra(compraData);
    setShowModal(false);
  };

  // Filtered compras
  const filteredCompras = compras.filter((c) => {
    const matchText =
      c.codigoPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.material.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchText) return false;

    // Check automatic overdue update
    let currentStatus = c.status;
    if (currentStatus !== 'ENTREGUE' && isOverdue(c.dataEntregaPrevista, currentStatus)) {
      currentStatus = 'ATRASADO';
    }

    if (filterStatus !== 'TODOS' && currentStatus !== filterStatus) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Controle de Compras & Pedidos aos Fornecedores
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automação de cálculo de prazo após aprovação e sinalização de entregas atrasadas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido de Compra</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código do pedido, fornecedor ou material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
          >
            <option value="TODOS">Todos os Status de Compra</option>
            <option value="EM COTAÇÃO">EM COTAÇÃO</option>
            <option value="APROVADO">APROVADO</option>
            <option value="ENTREGUE">ENTREGUE</option>
            <option value="ATRASADO">ATRASADO</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-20">
                <th className="p-3 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-slate-900 z-30 border-r border-slate-800">Código Pedido</th>
                <th className="p-3 w-[220px] min-w-[220px] max-w-[220px] sticky left-[140px] bg-slate-900 z-30 border-r border-slate-800">Fornecedor</th>
                <th className="p-3 w-[240px] min-w-[240px]">Material / Insumo</th>
                <th className="p-3 w-[120px] min-w-[120px] text-center">Data Enviada</th>
                <th className="p-3 w-[110px] min-w-[110px] text-center">Prazo (Úteis)</th>
                <th className="p-3 w-[140px] min-w-[140px] text-center font-bold uppercase tracking-wider">Data Prev. Entrega</th>
                <th className="p-3 w-[130px] min-w-[130px] text-center font-bold uppercase tracking-wider">Status</th>
                <th className="p-3 w-[100px] min-w-[100px] text-right pr-4 font-bold uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredCompras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum pedido de compra encontrado.
                  </td>
                </tr>
              ) : (
                filteredCompras.map((compra) => {
                  const overdue =
                    compra.status !== 'ENTREGUE' && isOverdue(compra.dataEntregaPrevista, compra.status);
                  const statusDisplay = overdue ? 'ATRASADO' : compra.status;

                  return (
                    <tr
                      key={compra.id}
                      onClick={() => handleOpenEdit(compra)}
                      className={`cursor-pointer transition ${
                        statusDisplay === 'ATRASADO'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/80'
                          : statusDisplay === 'ENTREGUE'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70'
                          : 'hover:bg-amber-50/50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <td className="p-3 font-bold font-mono text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-800 shadow-2xs truncate">
                        {compra.codigoPedido}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100 sticky left-[140px] bg-white dark:bg-slate-900 z-10 w-[220px] min-w-[220px] max-w-[220px] border-r border-slate-200 dark:border-slate-800 shadow-2xs truncate" title={compra.fornecedorNome}>
                        {compra.fornecedorNome}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 w-[240px] min-w-[240px]">
                        {compra.material}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400 text-center w-[120px] min-w-[120px]">
                        {formatDateBR(compra.dataEnviada)}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 w-[110px] min-w-[110px]">
                        {compra.prazoDiasUteis}d
                      </td>
                      <td className="p-3 font-mono font-bold text-center w-[140px] min-w-[140px]">
                        <span
                          className={
                            statusDisplay === 'ATRASADO'
                              ? 'text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1'
                              : 'text-slate-800 dark:text-slate-200'
                          }
                        >
                          {statusDisplay === 'ATRASADO' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {formatDateBR(compra.dataEntregaPrevista)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            statusDisplay === 'EM COTAÇÃO'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : statusDisplay === 'APROVADO'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                              : statusDisplay === 'ENTREGUE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                              : 'bg-rose-600 text-white animate-pulse'
                          }`}
                        >
                          {statusDisplay}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-4 space-x-1">
                        <button
                          onClick={() => handleOpenEdit(compra)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Editar Compra"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompraToDelete(compra);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Excluir Compra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCompra ? `Editar Pedido: ${editingCompra.codigoPedido}` : 'Novo Pedido de Compra'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código do Pedido
                  </label>
                  <input
                    type="text"
                    required
                    value={codigoPedido}
                    onChange={(e) => setCodigoPedido(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fornecedor
                  </label>
                  <select
                    value={fornecedorId}
                    onChange={(e) => handleFornecedorChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                  >
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.razaoSocial} ({f.prazoEntregaPadraoDiasUteis}d)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Material / Escopo do Pedido *
                </label>
                <input
                  type="text"
                  required
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex: Lote Perfis Linha Gold Preto Anodizado (400kg)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Enviada
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEnviada}
                    onChange={(e) => setDataEnviada(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo em Dias Úteis
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={prazoDiasUteis}
                    onChange={(e) => setPrazoDiasUteis(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Aprovação
                  </label>
                  <input
                    type="date"
                    value={dataAprovacao}
                    onChange={(e) => {
                      setDataAprovacao(e.target.value);
                      if (e.target.value && status === 'EM COTAÇÃO') {
                        setStatus('APROVADO');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Automatic delivery preview box */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Data de Entrega Prevista (Automática):
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    Calculada a partir da {dataAprovacao ? 'Data de Aprovação' : 'Data Enviada'} + {prazoDiasUteis} dias úteis
                  </span>
                </div>
                <span className="text-sm font-extrabold text-amber-800 dark:text-amber-200 font-mono">
                  {formatDateBR(calculateDeliveryDate())}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status da Compra
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusCompra)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="EM COTAÇÃO">EM COTAÇÃO</option>
                  <option value="APROVADO">APROVADO</option>
                  <option value="ENTREGUE">ENTREGUE</option>
                  <option value="ATRASADO">ATRASADO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Detalhes de pagamento, frete, contatos do vendedor..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Compra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {compraToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Excluir Pedido de Compra"
          message="Tem certeza que deseja excluir este pedido de compra? O registro será removido permanentemente do controle de compras."
          itemDescription={`${compraToDelete.codigoPedido} - ${compraToDelete.fornecedorNome} (${compraToDelete.material})`}
          confirmLabel="Sim, Excluir Pedido"
          onConfirm={() => {
            if (compraToDelete) {
              onDeleteCompra(compraToDelete.id);
              setCompraToDelete(null);
            }
          }}
          onCancel={() => setCompraToDelete(null)}
        />
      )}
    </div>
  );
};
