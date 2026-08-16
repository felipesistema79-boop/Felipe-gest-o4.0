import React, { useState } from 'react';
import {
  Users,
  Building2,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  Phone,
  Mail,
  Clock,
  Briefcase
} from 'lucide-react';
import { Vendedor, Fornecedor } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CadastrosAuxiliaresProps {
  vendedores?: Vendedor[];
  fornecedores?: Fornecedor[];
  onSaveVendedor: (vendedor: Vendedor) => void;
  onDeleteVendedor: (id: string) => void;
  onSaveFornecedor: (fornecedor: Fornecedor) => void;
  onDeleteFornecedor: (id: string) => void;
}

export const CadastrosAuxiliares: React.FC<CadastrosAuxiliaresProps> = ({
  vendedores = [],
  fornecedores = [],
  onSaveVendedor,
  onDeleteVendedor,
  onSaveFornecedor,
  onDeleteFornecedor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vendedores' | 'fornecedores'>('vendedores');

  // Delete modal states
  const [vendedorToDelete, setVendedorToDelete] = useState<Vendedor | null>(null);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null);

  // Vendedores Modal State
  const [showVendModal, setShowVendModal] = useState(false);
  const [editingVend, setEditingVend] = useState<Vendedor | null>(null);
  const [vendNome, setVendNome] = useState('');
  const [vendTel, setVendTel] = useState('');
  const [vendEmail, setVendEmail] = useState('');

  // Fornecedores Modal State
  const [showFornModal, setShowFornModal] = useState(false);
  const [editingForn, setEditingForn] = useState<Fornecedor | null>(null);
  const [fornRazao, setFornRazao] = useState('');
  const [fornCnpj, setFornCnpj] = useState('');
  const [fornTel, setFornTel] = useState('');
  const [fornEmail, setFornEmail] = useState('');
  const [fornPrazo, setFornPrazo] = useState<number>(5);
  const [fornEscopo, setFornEscopo] = useState('');

  // Vendedor Handlers
  const handleOpenAddVend = () => {
    setEditingVend(null);
    setVendNome('');
    setVendTel('');
    setVendEmail('');
    setShowVendModal(true);
  };

  const handleOpenEditVend = (v: Vendedor) => {
    setEditingVend(v);
    setVendNome(v.nome);
    setVendTel(v.telefone);
    setVendEmail(v.email);
    setShowVendModal(true);
  };

  const handleSaveVend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendNome.trim()) return;
    const vData: Vendedor = {
      id: editingVend?.id || `vend-${Date.now()}`,
      nome: vendNome.trim(),
      telefone: vendTel.trim(),
      email: vendEmail.trim(),
      ativo: true,
    };
    onSaveVendedor(vData);
    setShowVendModal(false);
  };

  // Fornecedor Handlers
  const handleOpenAddForn = () => {
    setEditingForn(null);
    setFornRazao('');
    setFornCnpj('');
    setFornTel('');
    setFornEmail('');
    setFornPrazo(5);
    setFornEscopo('');
    setShowFornModal(true);
  };

  const handleOpenEditForn = (f: Fornecedor) => {
    setEditingForn(f);
    setFornRazao(f.razaoSocial);
    setFornCnpj(f.cnpj);
    setFornTel(f.telefone);
    setFornEmail(f.email);
    setFornPrazo(f.prazoEntregaPadraoDiasUteis);
    setFornEscopo(f.materialEscopo);
    setShowFornModal(true);
  };

  const handleSaveForn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornRazao.trim()) return;
    const fData: Fornecedor = {
      id: editingForn?.id || `forn-${Date.now()}`,
      razaoSocial: fornRazao.trim(),
      cnpj: fornCnpj.trim(),
      telefone: fornTel.trim(),
      email: fornEmail.trim(),
      prazoEntregaPadraoDiasUteis: Number(fornPrazo) || 1,
      materialEscopo: fornEscopo.trim(),
    };
    onSaveFornecedor(fData);
    setShowFornModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-slate-800 text-slate-100 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Cadastros Auxiliares - Vendedores & Fornecedores
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerenciamento da equipe comercial e prazos padrão por fornecedor de insumos.
          </p>
        </div>

        {/* SubTab Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('vendedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'vendedores'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Vendedores ({vendedores.length})
          </button>
          <button
            onClick={() => setActiveSubTab('fornecedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'fornecedores'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Fornecedores ({fornecedores.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: VENDEDORES */}
      {activeSubTab === 'vendedores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Lista de Vendedores Cadastrados
            </h3>
            <button
              onClick={handleOpenAddVend}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Vendedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendedores.map((v) => (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center">
                      {v.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {v.nome}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Ativo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditVend(v)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded"
                      title="Editar Vendedor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setVendedorToDelete(v)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      title="Excluir Vendedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {v.telefone || 'Sem telefone'}
                  </p>
                  <p className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {v.email || 'Sem e-mail'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: FORNECEDORES */}
      {activeSubTab === 'fornecedores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Lista de Fornecedores Cadastrados
            </h3>
            <button
              onClick={handleOpenAddForn}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          </div>

          <div className="space-y-3">
            {fornecedores.map((f) => (
              <div
                key={f.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {f.razaoSocial}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      CNPJ: {f.cnpj}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {f.telefone} • {f.email}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Escopo: {f.materialEscopo}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 block uppercase">
                      Prazo Padrão
                    </span>
                    <span className="text-xs font-black text-amber-900 dark:text-amber-100 font-mono">
                      {f.prazoEntregaPadraoDiasUteis} Dias Úteis
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditForn(f)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                      title="Editar Fornecedor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFornecedorToDelete(f)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      title="Excluir Fornecedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendedor Modal */}
      {showVendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingVend ? 'Editar Vendedor' : 'Novo Vendedor'}
              </h3>
              <button onClick={() => setShowVendModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVend} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={vendNome}
                  onChange={(e) => setVendNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={vendTel}
                  onChange={(e) => setVendTel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">E-mail</label>
                <input
                  type="email"
                  value={vendEmail}
                  onChange={(e) => setVendEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                >
                  Salvar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fornecedor Modal */}
      {showFornModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingForn ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button onClick={() => setShowFornModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveForn} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={fornRazao}
                    onChange={(e) => setFornRazao(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={fornCnpj}
                    onChange={(e) => setFornCnpj(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Telefone</label>
                  <input
                    type="text"
                    value={fornTel}
                    onChange={(e) => setFornTel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    value={fornEmail}
                    onChange={(e) => setFornEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Prazo Padrão (Dias Úteis)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={fornPrazo}
                    onChange={(e) => setFornPrazo(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Material / Escopo do Fornecedor</label>
                <textarea
                  rows={2}
                  value={fornEscopo}
                  onChange={(e) => setFornEscopo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFornModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Vendedor Modal */}
      {vendedorToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Excluir Vendedor"
          message="Tem certeza que deseja excluir este vendedor? As obras já vinculadas manterão o histórico, mas ele não aparecerá para novas obras."
          itemDescription={`${vendedorToDelete.nome} (${vendedorToDelete.email || vendedorToDelete.telefone || 'Sem contato'})`}
          confirmLabel="Sim, Excluir Vendedor"
          onConfirm={() => {
            if (vendedorToDelete) {
              onDeleteVendedor(vendedorToDelete.id);
              setVendedorToDelete(null);
            }
          }}
          onCancel={() => setVendedorToDelete(null)}
        />
      )}

      {/* Confirm Delete Fornecedor Modal */}
      {fornecedorToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Excluir Fornecedor"
          message="Tem certeza que deseja excluir este fornecedor cadastrado?"
          itemDescription={`${fornecedorToDelete.razaoSocial} (CNPJ: ${fornecedorToDelete.cnpj})`}
          confirmLabel="Sim, Excluir Fornecedor"
          onConfirm={() => {
            if (fornecedorToDelete) {
              onDeleteFornecedor(fornecedorToDelete.id);
              setFornecedorToDelete(null);
            }
          }}
          onCancel={() => setFornecedorToDelete(null)}
        />
      )}
    </div>
  );
};
