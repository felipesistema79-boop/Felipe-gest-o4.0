import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Upload,
  Building2,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Check,
  FileJson,
  Sun,
  Moon,
  Mail,
  MapPin,
  ArrowUp,
  ArrowDown,
  Workflow,
  Sparkles,
  Edit2,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  X,
  SlidersHorizontal,
  AlertTriangle
} from 'lucide-react';
import { EmpresaConfig, EtapaFluxoConfig, Obra, Compra, Vendedor, Fornecedor, GargaloConfig } from '../types';
import { exportSystemToExcel, parseExcelImportFile } from '../utils/excelUtils';
import { storageService, defaultEtapas } from '../services/storage';
import { onCloudSyncStatusChange, CloudSyncStatus } from '../services/firebase';
import { ControleGargalosConfig } from './ControleGargalosConfig';
import { useDialog } from './DialogContext';

interface ConfiguracoesProps {
  empresa: EmpresaConfig;
  etapas?: EtapaFluxoConfig[];
  obras?: Obra[];
  compras?: Compra[];
  vendedores?: Vendedor[];
  fornecedores?: Fornecedor[];
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSaveEmpresa: (emp: EmpresaConfig) => void;
  onSaveEtapas: (etapas: EtapaFluxoConfig[]) => void;
  onReloadAllData: () => void;
}

type SubmenuConfig = 'FLUXO_PRODUCAO' | 'DADOS_EMPRESA' | 'CONTROLE_GARGALOS' | 'PORTABILIDADE';

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  empresa,
  etapas = [],
  obras = [],
  compras = [],
  vendedores = [],
  fornecedores = [],
  darkMode = false,
  onToggleDarkMode,
  onSaveEmpresa,
  onSaveEtapas,
  onReloadAllData,
}) => {
  const { showAlert, showConfirm } = useDialog();

  // Active Submenu tab state
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuConfig>('FLUXO_PRODUCAO');

  // Cloud Sync State
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('connecting');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  useEffect(() => {
    const unsub = onCloudSyncStatusChange((st) => setCloudStatus(st));
    return () => unsub();
  }, []);

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    setSyncSuccessMsg('');
    try {
      storageService.syncAllLocalToCloud();
      setTimeout(() => {
        setIsSyncingCloud(false);
        setSyncSuccessMsg('Todos os dados foram enviados e sincronizados com a Nuvem Firebase Firestore com sucesso!');
        setTimeout(() => setSyncSuccessMsg(''), 5000);
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsSyncingCloud(false);
    }
  };

  // Empresa Form State
  const [empresaForm, setEmpresaForm] = useState<EmpresaConfig>({ ...empresa });

  // Production Flow Stages State
  const [etapasList, setEtapasList] = useState<EtapaFluxoConfig[]>(etapas && etapas.length > 0 ? etapas : defaultEtapas);
  const [newEtapaNome, setNewEtapaNome] = useState('');
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);
  const [editingEtapaNome, setEditingEtapaNome] = useState('');

  // Gargalos Cadastrados State
  const [gargalos, setGargalos] = useState<GargaloConfig[]>([]);
  const [newGargaloNome, setNewGargaloNome] = useState('');
  const [newGargaloSetor, setNewGargaloSetor] = useState('');
  const [newGargaloImpacto, setNewGargaloImpacto] = useState<'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'>('MEDIO');

  useEffect(() => {
    setGargalos(storageService.getGargalos());
    const handleStorageUpdate = () => {
      setGargalos(storageService.getGargalos());
    };
    window.addEventListener('sgm_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('sgm_storage_updated', handleStorageUpdate);
  }, []);

  const handleAddGargalo = () => {
    if (!newGargaloNome.trim() || !newGargaloSetor.trim()) return;
    const newGargalo: GargaloConfig = {
      id: `gar_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      nome: newGargaloNome.trim(),
      setor: newGargaloSetor.trim(),
      impacto: newGargaloImpacto,
      ativo: true,
    };
    storageService.saveGargalo(newGargalo);
    setGargalos(storageService.getGargalos());
    setNewGargaloNome('');
    setNewGargaloSetor('');
    setNewGargaloImpacto('MEDIO');
  };

  const handleDeleteGargalo = async (id: string) => {
    const confirmed = await showConfirm('Deseja realmente remover este gargalo cadastrado?', {
      title: 'Excluir Gargalo',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      storageService.deleteGargalo(id);
      setGargalos(storageService.getGargalos());
    }
  };

  const handleToggleGargaloAtivo = (id: string) => {
    const item = gargalos.find((g) => g.id === id);
    if (item) {
      storageService.saveGargalo({ ...item, ativo: !item.ativo });
      setGargalos(storageService.getGargalos());
    }
  };

  useEffect(() => {
    if (etapas && etapas.length > 0) {
      setEtapasList(etapas);
    }
  }, [etapas]);

  // Logo upload dropzone handling
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showAlert('Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP).', { type: 'warning' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setEmpresaForm({ ...empresaForm, logoBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEmpresaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEmpresa(empresaForm);
    showAlert('Configurações da empresa e tema salvas com sucesso!', { type: 'success' });
  };

  // --- Production Flow Management (Etapas Editáveis) ---
  const handleAddEtapa = () => {
    if (!newEtapaNome.trim()) return;

    const newStage: EtapaFluxoConfig = {
      id: `etapa-${Date.now()}`,
      nome: newEtapaNome.trim(),
      ordem: etapasList.length + 1,
    };

    const updated = [...etapasList, newStage];
    setEtapasList(updated);
    onSaveEtapas(updated);
    setNewEtapaNome('');
  };

  const handleStartEditEtapa = (etapa: EtapaFluxoConfig) => {
    setEditingEtapaId(etapa.id);
    setEditingEtapaNome(etapa.nome);
  };

  const handleSaveEditEtapa = () => {
    if (!editingEtapaId || !editingEtapaNome.trim()) {
      setEditingEtapaId(null);
      return;
    }

    const updated = etapasList.map((et) => {
      if (et.id === editingEtapaId) {
        return { ...et, nome: editingEtapaNome.trim() };
      }
      return et;
    });

    setEtapasList(updated);
    onSaveEtapas(updated);
    setEditingEtapaId(null);
    setEditingEtapaNome('');
  };

  const handleCancelEditEtapa = () => {
    setEditingEtapaId(null);
    setEditingEtapaNome('');
  };

  const handleDeleteEtapa = async (id: string) => {
    if (etapasList.length <= 1) {
      showAlert('O sistema deve conter no mínimo 1 etapa no fluxo de produção.', { type: 'warning' });
      return;
    }
    const confirmed = await showConfirm('Deseja realmente remover esta etapa do fluxo de produção?', {
      title: 'Remover Etapa',
      type: 'danger',
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    const updated = etapasList
      .filter((e) => e.id !== id)
      .map((e, idx) => ({ ...e, ordem: idx + 1 }));

    setEtapasList(updated);
    onSaveEtapas(updated);
  };

  const handleMoveEtapaUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...etapasList];
    const temp = newStages[index - 1];
    newStages[index - 1] = newStages[index];
    newStages[index] = temp;

    const reordered = newStages.map((e, idx) => ({ ...e, ordem: idx + 1 }));
    setEtapasList(reordered);
    onSaveEtapas(reordered);
  };

  const handleMoveEtapaDown = (index: number) => {
    if (index >= etapasList.length - 1) return;
    const newStages = [...etapasList];
    const temp = newStages[index + 1];
    newStages[index + 1] = newStages[index];
    newStages[index] = temp;

    const reordered = newStages.map((e, idx) => ({ ...e, ordem: idx + 1 }));
    setEtapasList(reordered);
    onSaveEtapas(reordered);
  };

  const handleResetEtapasPadrao = async () => {
    const confirmed = await showConfirm('Deseja redefinir as etapas para a sequência padrão recomendada?', {
      title: 'Restaurar Etapas',
      type: 'warning',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      setEtapasList(defaultEtapas);
      onSaveEtapas(defaultEtapas);
    }
  };

  // Backup JSON Download
  const handleDownloadBackupJSON = () => {
    const jsonStr = storageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SGM_Backup_Sistema_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Restore Backup JSON
  const handleImportBackupJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = storageService.importBackupJSON(content);
      if (success) {
        showAlert('Backup do sistema restaurado com sucesso!', { type: 'success' });
        onReloadAllData();
      } else {
        showAlert('Falha ao restaurar o arquivo de backup JSON. Verifique a estrutura.', { type: 'danger' });
      }
    };
    reader.readAsText(file);
  };

  // Excel Export
  const handleExportExcel = () => {
    exportSystemToExcel(obras, compras, vendedores, fornecedores, etapasList);
  };

  // Excel Import
  const handleImportExcel = async (file: File) => {
    try {
      const result = await parseExcelImportFile(file);
      if (result.obrasImportadas && result.obrasImportadas.length > 0) {
        const existingObras = storageService.getObras();
        const merged = [...existingObras, ...(result.obrasImportadas as Obra[])];
        storageService.saveObras(merged);
        showAlert(`Sucesso! ${result.obrasImportadas.length} obras importadas da planilha Excel.`, { type: 'success' });
        onReloadAllData();
      } else {
        showAlert('Nenhuma aba de Obras válida encontrada na planilha.', { type: 'warning' });
      }
    } catch (err) {
      console.error(err);
      showAlert('Erro ao processar o arquivo Excel.', { type: 'danger' });
    }
  };

  // Predefined color presets
  const colorPresets = [
    { label: 'Laranja SGM (Padrão)', hex: '#EA580C' },
    { label: 'Laranja Âmbar', hex: '#D97706' },
    { label: 'Cinza Grafite', hex: '#374151' },
    { label: 'Azul Corporativo', hex: '#2563EB' },
    { label: 'Verde Esmeralda', hex: '#059669' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Submenu Navigation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-600/10 text-orange-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Painel de Configurações & Personalização
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalize as etapas do fluxo de produção, dados da empresa, identidade visual e realize backups.
          </p>
        </div>

        {/* Submenu Tabs */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubmenu('FLUXO_PRODUCAO')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              activeSubmenu === 'FLUXO_PRODUCAO'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Fluxo de Produção</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubmenu('CONTROLE_GARGALOS')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              activeSubmenu === 'CONTROLE_GARGALOS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Gargalos no Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubmenu('DADOS_EMPRESA')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              activeSubmenu === 'DADOS_EMPRESA'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresa & Tema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubmenu('PORTABILIDADE')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              activeSubmenu === 'PORTABILIDADE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Backup & Nuvem</span>
          </button>
        </div>
      </div>

      {/* SUBMENU 1: FLUXO DE PRODUÇÃO 100% EDITÁVEL */}
      {activeSubmenu === 'FLUXO_PRODUCAO' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-fadeIn max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Workflow className="w-5 h-5 text-orange-600" />
                <span>Etapas do Fluxo de Produção</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre, renomeie, reordene e remova as etapas de fabricação. Todas as colunas da tabela de Obras e o acompanhamento fabril refletem exatamente esta lista.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900 text-xs font-extrabold rounded-xl">
                {etapasList.length} Etapas Ativas
              </span>
              <button
                type="button"
                onClick={handleResetEtapasPadrao}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Restaurar Etapas Padrão"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Restaurar Padrão
              </button>
            </div>
          </div>

          {/* Add Stage Form */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Digite o nome da nova etapa (Ex: Medição & Projeto, Corte, Solda, Montagem, Vidros, Instalação)..."
              value={newEtapaNome}
              onChange={(e) => setNewEtapaNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEtapa();
                }
              }}
              className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddEtapa}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Etapa</span>
            </button>
          </div>

          {/* Stages List */}
          <div className="space-y-2.5 pt-1">
            {etapasList.map((etapa, idx) => {
              const isEditing = editingEtapaId === etapa.id;

              return (
                <div
                  key={etapa.id}
                  className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between transition hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-600/10 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 font-black text-xs flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-900/60">
                      {idx + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingEtapaNome}
                          onChange={(e) => setEditingEtapaNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditEtapa();
                            if (e.key === 'Escape') handleCancelEditEtapa();
                          }}
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-orange-400 dark:border-orange-500 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditEtapa}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                          title="Salvar Nome"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditEtapa}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {etapa.nome}
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditEtapa(etapa)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Renomear Etapa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveEtapaUp(idx)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === etapasList.length - 1}
                        onClick={() => handleMoveEtapaDown(idx)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEtapa(etapa.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 transition cursor-pointer"
                        title="Excluir Etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBMENU 2: CONTROLE DE GARGALOS NO DASHBOARD */}
      {activeSubmenu === 'CONTROLE_GARGALOS' && (
        <div className="space-y-6 max-w-4xl animate-fadeIn">
          <ControleGargalosConfig
            etapas={etapasList}
            obras={obras}
            onSaved={onReloadAllData}
          />

          {/* Cadastro de Pontos Críticos / Gargalos Manuais */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Pontos Críticos e Gargalos Cadastrados</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cadastre setores e processos vulneráveis para acompanhamento e auditoria.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-bold rounded-lg">
                {gargalos.length} Cadastrados
              </span>
            </div>

            {/* Form Adicionar Gargalo */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <input
                type="text"
                placeholder="Nome do Gargalo (Ex: Falta de perfis, Atraso na têmpera, Pintura eletrostática)..."
                value={newGargaloNome}
                onChange={(e) => setNewGargaloNome(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Setor / Área (Ex: Serralheria, Vidraçaria, Compras)..."
                value={newGargaloSetor}
                onChange={(e) => setNewGargaloSetor(e.target.value)}
                className="w-full md:w-48 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <select
                value={newGargaloImpacto}
                onChange={(e) => setNewGargaloImpacto(e.target.value as any)}
                aria-label="Impacto do Gargalo"
                className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="BAIXO">Impacto Baixo</option>
                <option value="MEDIO">Impacto Médio</option>
                <option value="ALTO">Impacto Alto</option>
                <option value="CRITICO">Impacto Crítico</option>
              </select>
              <button
                type="button"
                onClick={handleAddGargalo}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Lista de Gargalos */}
            {gargalos.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                Nenhum gargalo específico cadastrado. Use o formulário acima para registrar.
              </div>
            ) : (
              <div className="space-y-2">
                {gargalos.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleGargaloAtivo(g.id)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${
                          g.ativo
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 border-slate-400'
                        }`}
                        title={g.ativo ? 'Ativo' : 'Inativo'}
                      >
                        {g.ativo && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {g.nome}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          Setor: {g.setor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          g.impacto === 'CRITICO'
                            ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                            : g.impacto === 'ALTO'
                            ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300'
                            : g.impacto === 'MEDIO'
                            ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {g.impacto}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteGargalo(g.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Excluir Gargalo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMENU 3: DADOS DA EMPRESA & BRANDING */}
      {activeSubmenu === 'DADOS_EMPRESA' && (
        <form
          onSubmit={handleSaveEmpresaSubmit}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-fadeIn max-w-4xl"
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>Identidade Visual & Cores do Tema</span>
          </h3>

          {/* Logo Drag and Drop */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Logotipo da Empresa (Upload Drag & Drop)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleLogoFile(e.dataTransfer.files[0]);
                }
              }}
              className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center cursor-pointer hover:border-blue-500 transition relative"
            >
              {empresaForm.logoBase64 ? (
                <div className="space-y-2">
                  <img
                    src={empresaForm.logoBase64}
                    alt="Logo Preview"
                    className="h-16 mx-auto object-contain rounded p-1 bg-white border"
                  />
                  <button
                    type="button"
                    onClick={() => setEmpresaForm({ ...empresaForm, logoBase64: null })}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remover Logotipo
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Arraste e solte a imagem da logo aqui ou clique para navegar
                  </p>
                  <p className="text-[10px] text-slate-400">Suporta PNG, JPG e SVG</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleLogoFile(e.target.files[0]);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Theme Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cor Primária do Tema (HEX Code)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={empresaForm.corTemaHex || '#EA580C'}
                onChange={(e) => setEmpresaForm({ ...empresaForm, corTemaHex: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
              />
              <input
                type="text"
                value={empresaForm.corTemaHex || '#EA580C'}
                onChange={(e) => setEmpresaForm({ ...empresaForm, corTemaHex: e.target.value })}
                className="px-3 py-2 text-xs font-mono font-bold uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-32"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center space-x-2 mt-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setEmpresaForm({ ...empresaForm, corTemaHex: preset.hex })}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-xs hover:scale-110 transition"
                  style={{ backgroundColor: preset.hex }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          {/* Dark / Light Mode Switch */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Modo de Exibição do Sistema (Tema Claro / Escuro)
            </label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {darkMode ? 'Tema Escuro Ativo' : 'Tema Claro Ativo'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Alterna entre a interface escura de alta visibilidade e o fundo claro tradicional.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Ativar Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-300" />
                    <span>Ativar Modo Escuro</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Company Info Fields */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Empresa / Razão Social
              </label>
              <input
                type="text"
                required
                value={empresaForm.nomeEmpresa}
                onChange={(e) => setEmpresaForm({ ...empresaForm, nomeEmpresa: e.target.value })}
                placeholder="Ex: Cabral Esquadrias & Fachadas Ltda"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">CNPJ</label>
                <input
                  type="text"
                  value={empresaForm.cnpj}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>E-mail da Empresa</span>
                </label>
                <input
                  type="email"
                  value={empresaForm.email || ''}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Telefone</label>
                <input
                  type="text"
                  value={empresaForm.telefone}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, telefone: e.target.value })}
                  placeholder="(00) 0000-0000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={empresaForm.whatsapp}
                  onChange={(e) => setEmpresaForm({ ...empresaForm, whatsapp: e.target.value })}
                  placeholder="(00) 90000-0000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>Endereço Completo da Empresa</span>
              </label>
              <input
                type="text"
                value={empresaForm.endereco || ''}
                onChange={(e) => setEmpresaForm({ ...empresaForm, endereco: e.target.value })}
                placeholder="Ex: Av. Industrial, 1500 - Galpão 04, Bairro Industrial - São Paulo - SP"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Responsável Técnico / Contato</label>
              <input
                type="text"
                value={empresaForm.responsavel}
                onChange={(e) => setEmpresaForm({ ...empresaForm, responsavel: e.target.value })}
                placeholder="Ex: Eng. Ricardo Cabral"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados da Empresa</span>
          </button>
        </form>
      )}

      {/* SUBMENU 3: PORTABILIDADE & BACKUP */}
      {activeSubmenu === 'PORTABILIDADE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-fadeIn max-w-4xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Nuvem Firebase Firestore & Portabilidade de Dados</span>
          </h3>

          <div className="space-y-4">
            {/* Firebase Firestore Cloud Database Card */}
            <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-slate-800/80 dark:to-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/60 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Banco de Dados na Nuvem (Google Firebase Firestore)
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cloudStatus === 'connected'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : cloudStatus === 'connecting'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            cloudStatus === 'connected'
                              ? 'bg-emerald-500 animate-pulse'
                              : cloudStatus === 'connecting'
                              ? 'bg-amber-500 animate-spin'
                              : 'bg-slate-400'
                          }`}
                        />
                        {cloudStatus === 'connected'
                          ? 'Conectado em Tempo Real'
                          : cloudStatus === 'connecting'
                          ? 'Conectando...'
                          : 'Offline'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Todas as alterações em Obras, Compras, Requisições, Fluxo de Produção e Ferramentas são sincronizadas automaticamente na nuvem Firestore.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={isSyncingCloud}
                    onClick={handleManualCloudSync}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar Tudo na Nuvem'}</span>
                  </button>
                </div>
              </div>

              {syncSuccessMsg && (
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              {/* Collections stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px]">
                <div className="p-2 bg-white/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-semibold">Obras Cadastradas</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{obras.length} itens</span>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-semibold">Pedidos de Compras</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{compras.length} itens</span>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-semibold">Fornecedores</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{fornecedores.length} parceiros</span>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-semibold">Vendedores / Equipe</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{vendedores.length} membros</span>
                </div>
              </div>
            </div>

            {/* Backup JSON */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-purple-600" />
                  <span>Backup Completo do Sistema (JSON)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Exporta ou restaura com 100% de precisão todas as obras, compras, etapas do fluxo de produção e requisições.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadBackupJSON}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Backup</span>
                </button>

                <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center space-x-1 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImportBackupJSON(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Excel Export */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exportar / Importar Planilha Excel (.xlsx)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Exportação multi-abas profissional ou importação de lotes de obras e materiais direto do Excel.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>

                <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center space-x-1 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Excel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImportExcel(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Reset System Data */}
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-rose-800 dark:text-rose-200">
                  Redefinir Dados de Exemplo do Sistema
                </h4>
                <p className="text-[10px] text-rose-600 dark:text-rose-300 mt-0.5">
                  Restaura o banco de dados padrão de demonstração e fluxos de fábrica.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showConfirm(
                    'Tem certeza que deseja redefinir os dados para o estado inicial de demonstração? Esta ação substituirá os registros locais e na nuvem.',
                    {
                      title: 'Redefinir Dados',
                      type: 'danger',
                      confirmText: 'Redefinir Tudo',
                      cancelText: 'Cancelar'
                    }
                  );
                  if (confirmed) {
                    await storageService.resetAllData();
                    onReloadAllData();
                    showAlert('Dados do sistema redefinidos com sucesso!', { type: 'success' });
                  }
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Redefinir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
