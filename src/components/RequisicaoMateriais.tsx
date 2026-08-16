import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  FileText,
  CheckSquare,
  Building,
  Save,
  X,
  PackageCheck,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Truck,
  Layers,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  RequisicaoMaterial,
  ItemRequisicao,
  Fornecedor,
  EmpresaConfig,
  Compra,
  Obra,
  RegistroEntregaParcial
} from '../types';
import {
  generateRequisicaoCodigo,
  getDateExtenso,
  formatDateBR,
  addBusinessDays
} from '../utils/dateUtils';
import {
  generateRequisicaoPDF,
  generateConferenciaPDF
} from '../utils/pdfGenerator';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useDialog } from './DialogContext';

interface RequisicaoMateriaisProps {
  requisicoes?: RequisicaoMaterial[];
  fornecedores?: Fornecedor[];
  obras?: Obra[];
  empresa: EmpresaConfig;
  onSaveRequisicao: (req: RequisicaoMaterial) => void;
  onGerarCompraAuto: (compra: Compra) => void;
  onDeleteRequisicao: (id: string) => void;
}

const UNIDADES_REQUISICAO = ['UN', 'BAR', 'M²', 'VOL', 'CX', 'PC', 'PCT', 'KG', 'M'] as const;

export const RequisicaoMateriais: React.FC<RequisicaoMateriaisProps> = ({
  requisicoes = [],
  fornecedores = [],
  obras = [],
  empresa,
  onSaveRequisicao,
  onGerarCompraAuto,
  onDeleteRequisicao,
}) => {
  const { showAlert } = useDialog();
  const todayStr = new Date().toISOString().split('T')[0];

  // Control for Create Requisition Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Control for Edit Requisition Modal
  const [editingReq, setEditingReq] = useState<RequisicaoMaterial | null>(null);

  // Delete modal state
  const [reqToDelete, setReqToDelete] = useState<RequisicaoMaterial | null>(null);

  // Expanded row id for on-screen conferral mode
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);

  // --- Form State for New Requisition ---
  const [selectedFornecedorId, setSelectedFornecedorId] = useState(fornecedores[0]?.id || '');
  const [dataCriacao, setDataCriacao] = useState(todayStr);
  const [clienteEstoque, setClienteEstoque] = useState<'CLIENTE' | 'ESTOQUE' | 'OBRA_DIRETA'>('CLIENTE');
  const [selectedObraId, setSelectedObraId] = useState('');
  const [customClienteNome, setCustomClienteNome] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Dynamic items for new requisition
  const [items, setItems] = useState<ItemRequisicao[]>([
    {
      id: `it-${Date.now()}-1`,
      codigo: 'PER-G01',
      cor: 'Preto Anodizado',
      descricao: 'Perfil Marco Linha Gold (6 metros)',
      quantidade: 10,
      unidade: 'BAR',
      conferido: false,
    },
    {
      id: `it-${Date.now()}-2`,
      codigo: 'VID-L04',
      cor: 'Incolor / Prata',
      descricao: 'Vidro Laminado Refletivo 4+4mm',
      quantidade: 25,
      unidade: 'M²',
      conferido: false,
    },
  ]);

  // --- State for Partial Delivery Form in "Ver e Conferir" ---
  const [novaDataEntregaParcial, setNovaDataEntregaParcial] = useState(todayStr);
  const [novaNFE, setNovaNFE] = useState('');
  const [novaQtdVolumes, setNovaQtdVolumes] = useState('');
  const [novaObsEntrega, setNovaObsEntrega] = useState('');

  const currentFornecedor = fornecedores.find((f) => f.id === selectedFornecedorId) || fornecedores[0];
  const autoCodigo = generateRequisicaoCodigo(currentFornecedor?.razaoSocial || 'fornecedor', dataCriacao);

  // --- Handlers for Create Form ---
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `it-${Date.now()}-${items.length + 1}`,
        codigo: '',
        cor: 'Padrão',
        descricao: '',
        quantidade: 1,
        unidade: 'BAR',
        conferido: false,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof ItemRequisicao, val: any) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  };

  const handleSaveAndCreatePurchase = () => {
    if (items.some((it) => !it.descricao.trim())) {
      showAlert('Por favor preencha a Descrição de todos os itens da requisição.', { type: 'warning' });
      return;
    }

    const dataExtenso = getDateExtenso(dataCriacao);

    // Resolve client / obra name if applicable
    let resolvedObraNome = '';
    if (clienteEstoque === 'ESTOQUE') {
      resolvedObraNome = 'Estoque Geral / Almoxarifado';
    } else if (selectedObraId) {
      const selectedObra = obras.find((o) => o.id === selectedObraId);
      resolvedObraNome = selectedObra ? `${selectedObra.codigo} - ${selectedObra.cliente}` : customClienteNome;
    } else {
      resolvedObraNome = customClienteNome || 'Obra / Cliente Direto';
    }

    const newReq: RequisicaoMaterial = {
      id: `req-${Date.now()}`,
      codigo: autoCodigo,
      fornecedorId: currentFornecedor?.id || 'forn-geral',
      fornecedorNome: currentFornecedor?.razaoSocial || 'Fornecedor Geral',
      clienteEstoque,
      obraId: selectedObraId || undefined,
      obraNome: resolvedObraNome,
      dataCriacao,
      dataCriacaoExtenso: dataExtenso,
      observacoes: observacoes.trim(),
      itens: items,
      status: 'GERADO_COMPRA',
      registrosEntregas: [],
      observacaoConferencia: '',
    };

    onSaveRequisicao(newReq);

    // Auto Create Purchase in "EM COTAÇÃO"
    const newCompra: Compra = {
      id: `comp-${Date.now()}`,
      codigoPedido: `PED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      fornecedorId: currentFornecedor?.id || 'forn-geral',
      fornecedorNome: currentFornecedor?.razaoSocial || 'Fornecedor Geral',
      material: items.map((it) => `${it.quantidade}x ${it.descricao}`).join('; '),
      dataEnviada: dataCriacao,
      prazoDiasUteis: currentFornecedor?.prazoEntregaPadraoDiasUteis || 5,
      dataEntregaPrevista: addBusinessDays(dataCriacao, currentFornecedor?.prazoEntregaPadraoDiasUteis || 5),
      status: 'EM COTAÇÃO',
      valorTotal: 0,
      requisicaoId: newReq.id,
      observacao: `Origem: ${newReq.codigo} • Destino: ${resolvedObraNome}`,
    };

    onGerarCompraAuto(newCompra);

    showAlert(`Requisição ${autoCodigo} salva com sucesso e enviada ao Controle de Compras!`, { type: 'success' });

    // Reset form and close modal
    setObservacoes('');
    setSelectedObraId('');
    setCustomClienteNome('');
    setClienteEstoque('CLIENTE');
    setItems([
      {
        id: `it-${Date.now()}-1`,
        codigo: '',
        cor: 'Padrão',
        descricao: '',
        quantidade: 1,
        unidade: 'BAR',
        conferido: false,
      },
    ]);
    setShowCreateModal(false);
  };

  // --- Handlers for Editing Existing Requisition ---
  const handleOpenEditModal = (req: RequisicaoMaterial) => {
    // Clone requisition to edit safely
    setEditingReq(JSON.parse(JSON.stringify(req)));
  };

  const handleEditReqItemUpdate = (itemId: string, field: keyof ItemRequisicao, val: any) => {
    if (!editingReq) return;

    const updatedItens = editingReq.itens.map((it) => {
      if (it.id !== itemId) return it;

      const oldQty = it.quantidade;
      const originalQty = it.quantidadeOriginal ?? oldQty;

      const updated = { ...it, [field]: val };

      // If quantity is modified, mark as edited
      if (field === 'quantidade') {
        const numVal = Number(val);
        if (numVal !== originalQty) {
          updated.editado = true;
          updated.quantidadeOriginal = originalQty;
          updated.dataEdicao = new Date().toISOString();
        } else {
          updated.editado = false;
        }
      } else if (field === 'descricao' || field === 'cor' || field === 'codigo') {
        updated.editado = true;
        updated.dataEdicao = new Date().toISOString();
      }

      return updated;
    });

    setEditingReq({
      ...editingReq,
      itens: updatedItens,
    });
  };

  const handleEditReqAddItem = () => {
    if (!editingReq) return;
    const newItem: ItemRequisicao = {
      id: `it-${Date.now()}-${editingReq.itens.length + 1}`,
      codigo: '',
      cor: 'Padrão',
      descricao: '',
      quantidade: 1,
      unidade: 'BAR',
      conferido: false,
      editado: true,
      dataEdicao: new Date().toISOString(),
      motivoEdicao: 'Novo item adicionado pós-criação',
    };

    setEditingReq({
      ...editingReq,
      itens: [...editingReq.itens, newItem],
    });
  };

  const handleEditReqRemoveItem = (itemId: string) => {
    if (!editingReq || editingReq.itens.length <= 1) return;
    setEditingReq({
      ...editingReq,
      itens: editingReq.itens.filter((it) => it.id !== itemId),
    });
  };

  const handleSaveEditedRequisition = () => {
    if (!editingReq) return;

    if (editingReq.itens.some((it) => !it.descricao.trim())) {
      showAlert('Por favor preencha a Descrição de todos os itens da requisição.', { type: 'warning' });
      return;
    }

    onSaveRequisicao(editingReq);
    showAlert(`Requisição ${editingReq.codigo} atualizada com sucesso! As alterações nos materiais foram salvas.`, { type: 'success' });
    setEditingReq(null);
  };

  // --- Handlers for Conference Mode ("Ver e Conferir na Tela") ---
  const handleUpdateArrivedQuantity = (req: RequisicaoMaterial, itemId: string, arrivedQty: number) => {
    const safeQty = Math.max(0, isNaN(arrivedQty) ? 0 : arrivedQty);

    const updatedItens = req.itens.map((it) => {
      if (it.id !== itemId) return it;
      return {
        ...it,
        quantidadeRecebida: safeQty,
      };
    });

    const updatedReq: RequisicaoMaterial = {
      ...req,
      itens: updatedItens,
    };

    onSaveRequisicao(updatedReq);
  };

  const handleToggleItemConferido = (req: RequisicaoMaterial, itemId: string) => {
    const updatedItens = req.itens.map((it) => {
      if (it.id !== itemId) return it;

      const newConferido = !it.conferido;
      let newQtdRecebida = it.quantidadeRecebida;
      if (newConferido && (!newQtdRecebida || newQtdRecebida === 0)) {
        newQtdRecebida = it.quantidade;
      }

      return {
        ...it,
        conferido: newConferido,
        quantidadeRecebida: newQtdRecebida,
      };
    });

    const allConferido = updatedItens.every((it) => it.conferido);

    const updatedReq: RequisicaoMaterial = {
      ...req,
      itens: updatedItens,
      status: allConferido ? 'CONFERIDO' : 'GERADO_COMPRA',
    };

    onSaveRequisicao(updatedReq);
  };

  const handleMarkAllConferido = (req: RequisicaoMaterial) => {
    const updatedItens = req.itens.map((it) => ({
      ...it,
      conferido: true,
      quantidadeRecebida: it.quantidadeRecebida && it.quantidadeRecebida > 0 ? it.quantidadeRecebida : it.quantidade,
    }));

    const updatedReq: RequisicaoMaterial = {
      ...req,
      itens: updatedItens,
      status: 'CONFERIDO',
    };

    onSaveRequisicao(updatedReq);
  };

  const handleResetConferencia = (req: RequisicaoMaterial) => {
    const updatedItens = req.itens.map((it) => ({
      ...it,
      conferido: false,
      quantidadeRecebida: 0,
    }));

    const updatedReq: RequisicaoMaterial = {
      ...req,
      itens: updatedItens,
      status: 'GERADO_COMPRA',
    };

    onSaveRequisicao(updatedReq);
  };

  // --- Handlers for Partial Deliveries Registration ---
  const handleAddRegistroEntregaParcial = (req: RequisicaoMaterial) => {
    if (!novaNFE.trim() && !novaObsEntrega.trim()) {
      showAlert('Por favor informe o Número da Nota Fiscal ou a Observação do recebimento parcial.', { type: 'warning' });
      return;
    }

    const novoRegistro: RegistroEntregaParcial = {
      id: `ent-${Date.now()}`,
      dataRecebimento: novaDataEntregaParcial || todayStr,
      numeroNotaFiscal: novaNFE.trim() || 'Sem NF declarada',
      quantidadeItensRecebidos: novaQtdVolumes ? Number(novaQtdVolumes) : undefined,
      observacao: novaObsEntrega.trim(),
      registradoPor: empresa.responsavel || 'Almoxarifado',
    };

    const updatedRegistros = [...(req.registrosEntregas || []), novoRegistro];

    const updatedReq: RequisicaoMaterial = {
      ...req,
      registrosEntregas: updatedRegistros,
    };

    onSaveRequisicao(updatedReq);

    // Reset inputs
    setNovaNFE('');
    setNovaQtdVolumes('');
    setNovaObsEntrega('');
  };

  const handleDeleteRegistroEntregaParcial = (req: RequisicaoMaterial, registroId: string) => {
    const updatedRegistros = (req.registrosEntregas || []).filter((r) => r.id !== registroId);
    onSaveRequisicao({
      ...req,
      registrosEntregas: updatedRegistros,
    });
  };

  const handleUpdateObservacaoConferencia = (req: RequisicaoMaterial, obs: string) => {
    onSaveRequisicao({
      ...req,
      observacaoConferencia: obs,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with "Nova Requisição" Button */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-600/10 text-orange-600 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Requisição de Materiais & Ordem de Conferência
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Geração de código automático, destinação (Cliente/Estoque), edição de materiais ao clicar na linha e registro de entregas parciais por NF-e.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Requisição</span>
        </button>
      </div>

      {/* Modal 1: Create New Requisition */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-bold text-base">Criar Nova Requisição de Materiais</h3>
                  <p className="text-xs text-slate-400">Preencha fornecedor, destinação (Cliente/Estoque) e itens</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Code Preview Header Box */}
              <div className="p-4 bg-orange-50/80 dark:bg-orange-950/40 rounded-xl border border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-orange-900 dark:text-orange-300 uppercase tracking-wider block">
                    Código da Requisição (Gerado Automaticamente)
                  </span>
                  <span className="font-mono text-base font-extrabold text-orange-800 dark:text-orange-200 break-all">
                    {autoCodigo}
                  </span>
                </div>
                <span className="text-[11px] text-orange-700 dark:text-orange-300 font-medium bg-orange-100 dark:bg-orange-900/60 px-2.5 py-1 rounded-md">
                  Ex: {autoCodigo}
                </span>
              </div>

              {/* Supplier & Date & Cliente/Estoque selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fornecedor
                  </label>
                  <select
                    value={selectedFornecedorId}
                    onChange={(e) => setSelectedFornecedorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                  >
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.razaoSocial} - CNPJ: {f.cnpj}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Requisição
                  </label>
                  <input
                    type="date"
                    value={dataCriacao}
                    onChange={(e) => setDataCriacao(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destino: Cliente / Estoque
                  </label>
                  <select
                    value={clienteEstoque}
                    onChange={(e) => setClienteEstoque(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="CLIENTE">Obra / Cliente Específico</option>
                    <option value="ESTOQUE">Estoque Geral / Almoxarifado</option>
                    <option value="OBRA_DIRETA">Obra Direta</option>
                  </select>
                </div>
              </div>

              {/* Conditional Client / Obra Selector */}
              {clienteEstoque !== 'ESTOQUE' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vincular Obra ou Informar Cliente:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        Selecionar Obra Cadastrada:
                      </label>
                      <select
                        value={selectedObraId}
                        onChange={(e) => {
                          setSelectedObraId(e.target.value);
                          const obra = obras.find((o) => o.id === e.target.value);
                          if (obra) setCustomClienteNome(`${obra.codigo} - ${obra.cliente}`);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Selecionar da lista de Obras --</option>
                        {obras.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.codigo} - {o.cliente} ({o.segmento})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        Ou Digitar Nome do Cliente / Local:
                      </label>
                      <input
                        type="text"
                        value={customClienteNome}
                        onChange={(e) => setCustomClienteNome(e.target.value)}
                        placeholder="Ex: Condomínio Alphaville - Lote 12"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Items Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Itens Solicitados
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Código Item
                        </label>
                        <input
                          type="text"
                          value={item.codigo}
                          onChange={(e) => handleUpdateItem(item.id, 'codigo', e.target.value)}
                          placeholder="Ex: LG-001"
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Cor / Acab.
                        </label>
                        <input
                          type="text"
                          value={item.cor}
                          onChange={(e) => handleUpdateItem(item.id, 'cor', e.target.value)}
                          placeholder="Cor"
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-5">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Descrição do Material / Insumo *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.descricao}
                          onChange={(e) => handleUpdateItem(item.id, 'descricao', e.target.value)}
                          placeholder="Descrição detalhada do material..."
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Qtd
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateItem(item.id, 'quantidade', Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-bold text-center"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Unid.
                        </label>
                        <select
                          value={item.unidade || 'BAR'}
                          onChange={(e) => handleUpdateItem(item.id, 'unidade', e.target.value)}
                          className="w-full px-1 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-center font-bold"
                        >
                          {UNIDADES_REQUISICAO.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer"
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações e Instruções da Requisição
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Entregar no Galpão 04 aos cuidados da expedição."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAndCreatePurchase}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar e Gerar Compra em Cotação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Existing Requisition & Modify Quantities / Lines upon Clicking Row */}
      {editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-base">Editar Materiais da Requisição ({editingReq.codigo})</h3>
                  <p className="text-xs text-slate-400">
                    Altere quantidades, adicione novos materiais, ajuste pós-cotação e salve
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingReq(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Notice Box */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Ajuste de Quantidades Pós-Cotação:</strong> Altere a quantidade das barras/materiais conforme o valor negociado. Toda linha modificada receberá automaticamente um <strong>sinal visual de edição</strong> para rastreabilidade.
                </div>
              </div>

              {/* General info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código da Requisição
                  </label>
                  <input
                    type="text"
                    value={editingReq.codigo}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={editingReq.fornecedorNome}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destino: Cliente / Estoque
                  </label>
                  <select
                    value={editingReq.clienteEstoque || 'CLIENTE'}
                    onChange={(e) => setEditingReq({ ...editingReq, clienteEstoque: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="CLIENTE">Obra / Cliente Específico</option>
                    <option value="ESTOQUE">Estoque Geral / Almoxarifado</option>
                    <option value="OBRA_DIRETA">Obra Direta</option>
                  </select>
                </div>
              </div>

              {/* Obra / Cliente reference in edit mode */}
              {editingReq.clienteEstoque !== 'ESTOQUE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Obra / Cliente Vinculado
                  </label>
                  <input
                    type="text"
                    value={editingReq.obraNome || ''}
                    onChange={(e) => setEditingReq({ ...editingReq, obraNome: e.target.value })}
                    placeholder="Nome do cliente ou código da obra..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Items Grid with Visual Edit Badges */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Linhas de Materiais ({editingReq.itens.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleEditReqAddItem}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editingReq.itens.map((item) => {
                    const wasEdited = !!item.editado;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition ${
                          wasEdited
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Edit Signal Banner on Item */}
                        {wasEdited && (
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                            <span className="flex items-center gap-1">
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Linha Editada / Ajustada pós-cotação</span>
                            </span>
                            {item.quantidadeOriginal && (
                              <span className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded text-[10px] font-extrabold">
                                Qtd Original: {item.quantidadeOriginal} {item.unidade} ➔ Atual: {item.quantidade} {item.unidade}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-3 sm:col-span-2">
                            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                              Código
                            </label>
                            <input
                              type="text"
                              value={item.codigo}
                              onChange={(e) => handleEditReqItemUpdate(item.id, 'codigo', e.target.value)}
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>

                          <div className="col-span-3 sm:col-span-2">
                            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                              Cor
                            </label>
                            <input
                              type="text"
                              value={item.cor}
                              onChange={(e) => handleEditReqItemUpdate(item.id, 'cor', e.target.value)}
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-4">
                            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                              Descrição do Material *
                            </label>
                            <input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => handleEditReqItemUpdate(item.id, 'descricao', e.target.value)}
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="col-span-4 sm:col-span-2">
                            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                              Quantidade
                            </label>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleEditReqItemUpdate(item.id, 'quantidade', Math.max(1, item.quantidade - 1))}
                                className="px-1.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => handleEditReqItemUpdate(item.id, 'quantidade', Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-extrabold text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleEditReqItemUpdate(item.id, 'quantidade', item.quantidade + 1)}
                                className="px-1.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="col-span-4 sm:col-span-1">
                            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                              Unid.
                            </label>
                            <select
                              value={item.unidade || 'BAR'}
                              onChange={(e) => handleEditReqItemUpdate(item.id, 'unidade', e.target.value)}
                              className="w-full px-1 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-center font-bold"
                            >
                              {UNIDADES_REQUISICAO.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-4 sm:col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditReqRemoveItem(item.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer"
                              title="Remover Linha"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações e Instruções da Requisição
                </label>
                <input
                  type="text"
                  value={editingReq.observacoes || ''}
                  onChange={(e) => setEditingReq({ ...editingReq, observacoes: e.target.value })}
                  placeholder="Instruções de entrega, local de descarregamento..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedRequisition}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Materiais</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Requisitions List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Requisições Cadastradas</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                {requisicoes.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clique sobre a linha da requisição para abrir o formulário e editar materiais e quantidades.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {requisicoes.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Nenhuma requisição criada até o momento. Clique em <strong>"+ Nova Requisição"</strong> para cadastrar.
            </div>
          ) : (
            requisicoes.map((req) => {
              const isExpanded = expandedReqId === req.id;
              const totalItems = req.itens.length;
              const conferidosCount = req.itens.filter((i) => i.conferido).length;
              const hasAnyEdited = req.itens.some((i) => i.editado);
              const progressPct = totalItems > 0 ? Math.round((conferidosCount / totalItems) * 100) : 0;
              const fornecedorObj = fornecedores.find((f) => f.id === req.fornecedorId);
              const totalEntregasParciais = req.registrosEntregas?.length || 0;

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isExpanded
                      ? 'bg-slate-50 dark:bg-slate-800/90 border-orange-300 dark:border-orange-700/80 shadow-md ring-1 ring-orange-500/20'
                      : hasAnyEdited
                      ? 'bg-orange-50/20 dark:bg-slate-800/60 border-orange-200 dark:border-slate-700 hover:border-orange-400 hover:shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs'
                  }`}
                >
                  {/* Basic Info Line - Clicking row opens edit modal */}
                  <div
                    onClick={() => handleOpenEditModal(req)}
                    className="p-4 cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 select-none group"
                    title="Clique para editar materiais e salvar"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {/* Auto Code */}
                        <span className="font-mono text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/80 px-2.5 py-0.5 rounded group-hover:bg-orange-200 transition">
                          {req.codigo}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'CONFERIDO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          }`}
                        >
                          {req.status === 'CONFERIDO' ? 'Conferido 100%' : 'Aguardando Conferência'}
                        </span>

                        {/* Cliente / Estoque Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.clienteEstoque === 'ESTOQUE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span>
                            {req.clienteEstoque === 'ESTOQUE'
                              ? 'Estoque Geral'
                              : req.obraNome
                              ? req.obraNome
                              : 'Cliente / Obra'}
                          </span>
                        </span>

                        {/* Partial Deliveries Badge if logged */}
                        {totalEntregasParciais > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                            <Truck className="w-3 h-3" />
                            <span>{totalEntregasParciais} Chegada(s) Parcial(is)</span>
                          </span>
                        )}

                        {/* Edited Badge */}
                        {hasAnyEdited && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Edit3 className="w-3 h-3" />
                            <span>Materiais Ajustados</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <strong className="text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition font-bold truncate">
                          Fornecedor: {req.fornecedorNome}
                        </strong>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate">
                          {req.dataCriacaoExtenso || formatDateBR(req.dataCriacao)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          {totalItems} materiais ({conferidosCount} conferidos)
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-orange-500" />
                        <span>Clique na linha para editar e salvar materiais</span>
                      </p>
                    </div>

                    {/* Action buttons (with stopPropagation so row click is not triggered) */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-2 flex-wrap gap-y-2 shrink-0"
                    >
                      <button
                        onClick={() => handleOpenEditModal(req)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                        title="Editar Linhas & Quantidades da Requisição"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Materiais</span>
                      </button>

                      <button
                        onClick={() => generateRequisicaoPDF(req, empresa, fornecedorObj)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                        title="Download PDF da Requisição em Layout Horizontal"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Requisição</span>
                      </button>

                      <button
                        onClick={() => generateConferenciaPDF(req, empresa, fornecedorObj)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                        title="Download PDF Ordem de Conferência"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>PDF Conferência</span>
                      </button>

                      <button
                        onClick={() => setExpandedReqId(isExpanded ? null : req.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer ${
                          isExpanded
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Fechar Conferência' : 'Ver e Conferir na Tela'}</span>
                      </button>

                      <button
                        onClick={() => setReqToDelete(req)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer"
                        title="Excluir Requisição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* On-screen Conference Verification Mode (Ver e Conferir na Tela) */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-5 bg-white dark:bg-slate-900/90 rounded-b-2xl animate-fadeIn">
                      {/* Conference Header & Bulk Action */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/80">
                        <div className="flex items-center space-x-2">
                          <PackageCheck className="w-5 h-5 text-emerald-600" />
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Modo Conferência & Recebimento Físico de Estoque
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              Informe a quantidade de barras que efetivamente chegou antes de dar OK no material.
                            </p>
                          </div>
                        </div>

                        {/* Bulk buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleMarkAllConferido(req)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receber Tudo (100% OK)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetConferencia(req)}
                            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Limpar</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">Progresso do Recebimento</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {progressPct}% ({conferidosCount}/{totalItems} itens conferidos)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* NOVO: Painel de Controle de Entregas Parciais & Notas Fiscais (NF-e) */}
                      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h6 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                              Controle de Entregas Parciais & Notas Fiscais (NF-e)
                            </h6>
                          </div>
                          <span className="text-[10px] bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                            {totalEntregasParciais} entrega(s) registrada(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                          Se o pedido for entregue em partes, registre aqui a data e o número da NF-e que chegou para manter o histórico e o controle interno de pedidos.
                        </p>

                        {/* Input Row for New Partial Delivery */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 items-end">
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                              Data da Chegada
                            </label>
                            <input
                              type="date"
                              value={novaDataEntregaParcial}
                              onChange={(e) => setNovaDataEntregaParcial(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                              Nº da Nota Fiscal (NF-e)
                            </label>
                            <input
                              type="text"
                              value={novaNFE}
                              onChange={(e) => setNovaNFE(e.target.value)}
                              placeholder="Ex: NF-e 14209"
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                              Qtd/Volumes
                            </label>
                            <input
                              type="number"
                              value={novaQtdVolumes}
                              onChange={(e) => setNovaQtdVolumes(e.target.value)}
                              placeholder="Ex: 5"
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                              Observação da Remessa
                            </label>
                            <input
                              type="text"
                              value={novaObsEntrega}
                              onChange={(e) => setNovaObsEntrega(e.target.value)}
                              placeholder="Ex: Chegou o 1º lote de perfis"
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div className="sm:col-span-12 flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddRegistroEntregaParcial(req)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Registrar Chegada Parcial / NF-e</span>
                            </button>
                          </div>
                        </div>

                        {/* List of Registered Partial Deliveries */}
                        {req.registrosEntregas && req.registrosEntregas.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <h6 className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                              Histórico de Entregas Parciais Recebidas:
                            </h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {req.registrosEntregas.map((reg) => (
                                <div
                                  key={reg.id}
                                  className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-start justify-between gap-2 shadow-2xs"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-mono text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                                        {reg.numeroNotaFiscal}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        • {formatDateBR(reg.dataRecebimento)}
                                      </span>
                                      {reg.quantidadeItensRecebidos !== undefined && (
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold text-slate-700 dark:text-slate-300">
                                          {reg.quantidadeItensRecebidos} vol.
                                        </span>
                                      )}
                                    </div>
                                    {reg.observacao && (
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                        {reg.observacao}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRegistroEntregaParcial(req, reg.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                                    title="Remover registro de entrega"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Observações Gerais de Conferência */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Anotações Gerais da Conferência / Controle Interno
                        </label>
                        <input
                          type="text"
                          value={req.observacaoConferencia || ''}
                          onChange={(e) => handleUpdateObservacaoConferencia(req, e.target.value)}
                          placeholder="Ex: Todas as barras chegaram sem riscos. Aguardando entrega dos vidros prevista p/ sexta-feira..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      {/* Item Rows with Input for Arrived Bars Quantity */}
                      <div className="space-y-3 pt-2">
                        <h6 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Itens da Ordem de Conferência ({req.itens.length})
                        </h6>
                        {req.itens.map((it, idx) => {
                          const arrivedQty =
                            it.quantidadeRecebida !== undefined
                              ? it.quantidadeRecebida
                              : it.conferido
                              ? it.quantidade
                              : 0;
                          const isFullyArrived = arrivedQty === it.quantidade && it.conferido;
                          const isPartial = arrivedQty > 0 && arrivedQty < it.quantidade && it.conferido;
                          const isSurplus = arrivedQty > it.quantidade && it.conferido;

                          return (
                            <div
                              key={it.id}
                              className={`p-3.5 rounded-xl border transition ${
                                it.conferido
                                  ? isPartial
                                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                                    : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                {/* Item Details */}
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                      #{idx + 1}. {it.descricao}
                                    </span>
                                    {it.codigo && (
                                      <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                        {it.codigo}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                                      Cor: {it.cor}
                                    </span>
                                  </div>

                                  {/* Edit notice if adjusted */}
                                  {it.editado && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                      <span>
                                        Item Editado Pós-Cotação: Solicitado {it.quantidade} {it.unidade}
                                        {it.quantidadeOriginal ? ` (Quantidade Original: ${it.quantidadeOriginal})` : ''}
                                      </span>
                                    </div>
                                  )}

                                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                    Quantidade Solicitada na Requisição:{' '}
                                    <strong className="text-slate-900 dark:text-slate-100 font-extrabold">
                                      {it.quantidade} {it.unidade}
                                    </strong>
                                  </div>
                                </div>

                                {/* Controls: Input for Quantity of Bars Arrived + OK Checkbox */}
                                <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                                  {/* Arrived Quantity Input */}
                                  <div className="space-y-0.5">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                      Qtd. Chegou ({it.unidade})
                                    </label>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateArrivedQuantity(req, it.id, Math.max(0, arrivedQty - 1))
                                        }
                                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                        title="Diminuir quantidade recebida"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={arrivedQty}
                                        onChange={(e) =>
                                          handleUpdateArrivedQuantity(req, it.id, Number(e.target.value))
                                        }
                                        className="w-16 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white font-extrabold text-center"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateArrivedQuantity(req, it.id, arrivedQty + 1)}
                                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                        title="Aumentar quantidade recebida"
                                      >
                                        +
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateArrivedQuantity(req, it.id, it.quantidade)}
                                        className="px-2 py-1 bg-orange-100 dark:bg-orange-950/80 hover:bg-orange-200 text-orange-700 dark:text-orange-300 rounded text-[10px] font-bold cursor-pointer"
                                        title="Preencher com a quantidade total solicitada"
                                      >
                                        Tudo ({it.quantidade})
                                      </button>
                                    </div>
                                  </div>

                                  {/* Checkbox / OK confirmation */}
                                  <div className="pl-2 border-l border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                      Dar OK
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleItemConferido(req, it.id)}
                                      className={`p-2 rounded-lg font-bold text-xs transition flex items-center space-x-1 cursor-pointer ${
                                        it.conferido
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                                      }`}
                                      title="Clique para confirmar conferência do material"
                                    >
                                      <CheckSquare className="w-4 h-4" />
                                      <span>{it.conferido ? 'OK' : 'Pendente'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Status Badge below item */}
                              <div className="mt-2 flex items-center justify-between text-[10px]">
                                {it.conferido ? (
                                  isFullyArrived ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>
                                        Recebimento Integral Confirmado: {arrivedQty} {it.unidade} recebidas (100% OK)
                                      </span>
                                    </span>
                                  ) : isPartial ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>
                                        Entrega Parcial: {arrivedQty} de {it.quantidade} {it.unidade} recebidas (Faltam{' '}
                                        {it.quantidade - arrivedQty})
                                      </span>
                                    </span>
                                  ) : isSurplus ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300">
                                      <Sparkles className="w-3 h-3" />
                                      <span>
                                        Excedente Recebido: {arrivedQty} {it.unidade} (+{arrivedQty - it.quantidade} a
                                        mais que o solicitado)
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-medium">0 {it.unidade} recebidas</span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>Aguardando descarregamento e contagem física na expedição</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirm Delete Requisicao Modal */}
      {reqToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Excluir Requisição de Materiais"
          message="Tem certeza que deseja excluir esta requisição de materiais? O registro e seus itens de conferência serão removidos."
          itemDescription={`${reqToDelete.codigo} - ${reqToDelete.fornecedorNome} (${reqToDelete.itens?.length || 0} itens)`}
          confirmLabel="Sim, Excluir Requisição"
          onConfirm={() => {
            if (reqToDelete) {
              onDeleteRequisicao(reqToDelete.id);
              setReqToDelete(null);
            }
          }}
          onCancel={() => setReqToDelete(null)}
        />
      )}
    </div>
  );
};
