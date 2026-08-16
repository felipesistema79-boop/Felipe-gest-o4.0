import React, { useState, useEffect, useMemo } from 'react';
import { storageService, initFirestoreLiveSync } from './services/storage';
import {
  Obra,
  Compra,
  RequisicaoMaterial,
  Vendedor,
  Fornecedor,
  PDCAItem,
  EisenhowerItem,
  GUTItem,
  FiveWTwoHItem,
  BrainstormingIdea,
  DecisaoAprendizado,
  RegistroRapidoItem,
  EmpresaConfig,
  EtapaFluxoConfig
} from './types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ObrasManager } from './components/ObrasManager';
import { ObraFormModal } from './components/ObraFormModal';
import { ComprasManager } from './components/ComprasManager';
import { RequisicaoMateriais } from './components/RequisicaoMateriais';
import { InteligenciaDecisao } from './components/InteligenciaDecisao';
import { RelatoriosAnalytics } from './components/RelatoriosAnalytics';
import { CadastrosAuxiliares } from './components/CadastrosAuxiliares';
import { ManutencaoManager } from './components/ManutencaoManager';
import { Configuracoes } from './components/Configuracoes';
import { NotificationModal } from './components/NotificationModal';
import { WorkspaceModal } from './components/WorkspaceModal';

export function App() {
  // Read initial tab from URL parameter (?tab=obras, ?tab=compras, etc.)
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const validTabs = [
        'dashboard',
        'obras',
        'compras',
        'requisicao',
        'inteligencia',
        'decisao',
        'relatorios',
        'cadastros',
        'manutencao',
        'configuracoes',
      ];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam;
      }
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Tab navigation handler with URL query sync
  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'dashboard') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Sync state if user clicks browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Read-Only View Mode (strictly detected ONLY when ?mode=view or ?readonly=true or ?readonly=1)
  const isReadOnly = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('mode') === 'view' ||
        params.get('readonly') === 'true' ||
        params.get('readonly') === '1'
      );
    }
    return false;
  }, []);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sgm_theme');
    if (saved) return saved === 'dark';
    return false; // Default to Light theme
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('sgm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('sgm_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Core Data States
  const [obras, setObras] = useState<Obra[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [requisicoes, setRequisicoes] = useState<RequisicaoMaterial[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [pdcaList, setPdcaList] = useState<PDCAItem[]>([]);
  const [eisenhowerList, setEisenhowerList] = useState<EisenhowerItem[]>([]);
  const [gutList, setGutList] = useState<GUTItem[]>([]);
  const [fiveWTwoHList, setFiveWTwoHList] = useState<FiveWTwoHItem[]>([]);
  const [brainstormingList, setBrainstormingList] = useState<BrainstormingIdea[]>([]);
  const [aprendizadosList, setAprendizadosList] = useState<DecisaoAprendizado[]>([]);
  const [registrosRapidosList, setRegistrosRapidosList] = useState<RegistroRapidoItem[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaConfig>(storageService.getEmpresaConfig());
  const [etapas, setEtapas] = useState<EtapaFluxoConfig[]>(storageService.getEtapasFluxo());

  // Modal States
  const [showObraModal, setShowObraModal] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  // Load / Reload Data from Storage
  const loadAllData = () => {
    setObras(storageService.getObras());
    setCompras(storageService.getCompras());
    setRequisicoes(storageService.getRequisicoes());
    setVendedores(storageService.getVendedores());
    setFornecedores(storageService.getFornecedores());
    setPdcaList(storageService.getPDCA());
    setEisenhowerList(storageService.getEisenhower());
    setGutList(storageService.getGUT());
    setFiveWTwoHList(storageService.getFiveWTwoH());
    setBrainstormingList(storageService.getBrainstorming());
    setAprendizadosList(storageService.getAprendizados());
    setRegistrosRapidosList(storageService.getRegistrosRapidos());
    setEmpresa(storageService.getEmpresaConfig());
    setEtapas(storageService.getEtapasFluxo());
  };

  useEffect(() => {
    loadAllData();
    // Initialize Firebase Firestore Real-time Cloud Sync
    initFirestoreLiveSync();

    // Event listener for reactive localStorage updates
    const handleStorageUpdate = () => {
      loadAllData();
    };

    window.addEventListener('sgm_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('sgm_storage_updated', handleStorageUpdate);
    };
  }, []);

  // Obras Handlers
  const handleOpenNewObra = () => {
    if (isReadOnly) return;
    setEditingObra(null);
    setShowObraModal(true);
  };

  const handleOpenEditObra = (obra: Obra) => {
    if (isReadOnly) return;
    setEditingObra(obra);
    setShowObraModal(true);
  };

  const handleSaveObra = (obraData: Obra) => {
    if (isReadOnly) return;
    storageService.saveObra(obraData);
    setObras((prev) => {
      const idx = prev.findIndex((o) => o.id === obraData.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = obraData;
        return next;
      }
      return [obraData, ...prev];
    });
    setShowObraModal(false);
  };

  const handleDeleteObra = (id: string) => {
    storageService.deleteObra(id);
    setObras((prev) => prev.filter((o) => o.id !== id));
  };

  const handleArchiveObra = (id: string) => {
    const target = obras.find((o) => o.id === id);
    if (target) {
      const updated = { ...target, arquivada: true };
      storageService.saveObra(updated);
      setObras((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  };

  const handleUnarchiveObra = (id: string) => {
    const target = obras.find((o) => o.id === id);
    if (target) {
      const updated = { ...target, arquivada: false };
      storageService.saveObra(updated);
      setObras((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  };

  // Compras Handlers
  const handleSaveCompra = (compra: Compra) => {
    storageService.saveCompra(compra);
    setCompras((prev) => {
      const idx = prev.findIndex((c) => c.id === compra.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = compra;
        return next;
      }
      return [compra, ...prev];
    });
  };

  const handleDeleteCompra = (id: string) => {
    storageService.deleteCompra(id);
    setCompras((prev) => prev.filter((c) => c.id !== id));
  };

  // Requisicoes Handlers
  const handleSaveRequisicao = (req: RequisicaoMaterial) => {
    storageService.saveRequisicao(req);
    setRequisicoes((prev) => {
      const idx = prev.findIndex((r) => r.id === req.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = req;
        return next;
      }
      return [req, ...prev];
    });
  };

  const handleDeleteRequisicao = (id: string) => {
    storageService.deleteRequisicao(id);
    setRequisicoes((prev) => prev.filter((r) => r.id !== id));
  };

  // Cadastros Auxiliares Handlers
  const handleSaveVendedor = (v: Vendedor) => {
    storageService.saveVendedor(v);
  };

  const handleDeleteVendedor = (id: string) => {
    storageService.deleteVendedor(id);
    setVendedores((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSaveFornecedor = (f: Fornecedor) => {
    storageService.saveFornecedor(f);
  };

  const handleDeleteFornecedor = (id: string) => {
    storageService.deleteFornecedor(id);
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
  };

  // Inteligencia Decisão Handlers
  const handleSavePDCA = (item: PDCAItem) => {
    storageService.savePDCA(item);
    setPdcaList(storageService.getPDCA());
  };

  const handleDeletePDCA = (id: string) => {
    storageService.deletePDCA(id);
    setPdcaList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveEisenhower = (item: EisenhowerItem) => {
    storageService.saveEisenhower(item);
    setEisenhowerList(storageService.getEisenhower());
  };

  const handleDeleteEisenhower = (id: string) => {
    storageService.deleteEisenhower(id);
    setEisenhowerList((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveGUT = (item: GUTItem) => {
    storageService.saveGUT(item);
    setGutList(storageService.getGUT());
  };

  const handleDeleteGUT = (id: string) => {
    storageService.deleteGUT(id);
    setGutList((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSaveFiveWTwoH = (item: FiveWTwoHItem) => {
    storageService.saveFiveWTwoH(item);
    setFiveWTwoHList(storageService.getFiveWTwoH());
  };

  const handleDeleteFiveWTwoH = (id: string) => {
    storageService.deleteFiveWTwoH(id);
    setFiveWTwoHList((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSaveBrainstorming = (item: BrainstormingIdea) => {
    storageService.saveBrainstorming(item);
    setBrainstormingList(storageService.getBrainstorming());
  };

  const handleDeleteBrainstorming = (id: string) => {
    storageService.deleteBrainstorming(id);
    setBrainstormingList((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSaveAprendizado = (item: DecisaoAprendizado) => {
    storageService.saveAprendizado(item);
    setAprendizadosList(storageService.getAprendizados());
  };

  const handleDeleteAprendizado = (id: string) => {
    storageService.deleteAprendizado(id);
    setAprendizadosList((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveRegistroRapido = (item: RegistroRapidoItem) => {
    storageService.saveRegistroRapido(item);
    setRegistrosRapidosList(storageService.getRegistrosRapidos());
  };

  const handleDeleteRegistroRapido = (id: string) => {
    storageService.deleteRegistroRapido(id);
    setRegistrosRapidosList((prev) => prev.filter((r) => r.id !== id));
  };

  // Empresa & Config Handlers
  const handleSaveEmpresa = (emp: EmpresaConfig) => {
    storageService.saveEmpresaConfig(emp);
    setEmpresa(emp);
  };

  const handleSaveEtapas = (etapasList: EtapaFluxoConfig[]) => {
    storageService.saveEtapasFluxo(etapasList);
    setEtapas(etapasList);
  };

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <Header
        empresa={empresa}
        obras={obras}
        compras={compras}
        fornecedores={fornecedores}
        darkMode={darkMode}
        isReadOnly={isReadOnly}
        activeTab={activeTab}
        onToggleDarkMode={toggleDarkMode}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenWorkspace={() => setShowWorkspaceModal(true)}
        onNavigateToTab={handleNavigateTab}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto px-2 sm:px-4 py-4 gap-4">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={handleNavigateTab} primaryColor={empresa.corTemaHex || '#EA580C'} />

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              obras={obras}
              compras={compras}
              vendedores={vendedores}
              etapas={etapas}
              onNavigateTab={handleNavigateTab}
              onNavigateObras={() => handleNavigateTab('obras')}
              onNavigateCompras={() => handleNavigateTab('compras')}
            />
          )}

          {activeTab === 'obras' && (
            <ObrasManager
              obras={obras}
              vendedores={vendedores}
              etapas={etapas}
              isReadOnly={isReadOnly}
              onOpenNewObra={handleOpenNewObra}
              onOpenEditObra={handleOpenEditObra}
              onDeleteObra={handleDeleteObra}
              onArchiveObra={handleArchiveObra}
              onUnarchiveObra={handleUnarchiveObra}
              onSaveObra={handleSaveObra}
            />
          )}

          {activeTab === 'compras' && (
            <ComprasManager
              compras={compras}
              fornecedores={fornecedores}
              onSaveCompra={handleSaveCompra}
              onDeleteCompra={handleDeleteCompra}
            />
          )}

          {activeTab === 'requisicao' && (
            <RequisicaoMateriais
              requisicoes={requisicoes}
              fornecedores={fornecedores}
              obras={obras}
              empresa={empresa}
              onSaveRequisicao={handleSaveRequisicao}
              onGerarCompraAuto={handleSaveCompra}
              onDeleteRequisicao={handleDeleteRequisicao}
            />
          )}

          {(activeTab === 'inteligencia' || activeTab === 'decisao') && (
            <InteligenciaDecisao
              pdcaList={pdcaList}
              eisenhowerList={eisenhowerList}
              gutList={gutList}
              fiveWTwoHList={fiveWTwoHList}
              brainstormingList={brainstormingList}
              obras={obras}
              onSavePDCA={handleSavePDCA}
              onDeletePDCA={handleDeletePDCA}
              onSaveEisenhower={handleSaveEisenhower}
              onDeleteEisenhower={handleDeleteEisenhower}
              onSaveGUT={handleSaveGUT}
              onDeleteGUT={handleDeleteGUT}
              onSaveFiveWTwoH={handleSaveFiveWTwoH}
              onDeleteFiveWTwoH={handleDeleteFiveWTwoH}
              onSaveBrainstorming={handleSaveBrainstorming}
              onDeleteBrainstorming={handleDeleteBrainstorming}
              aprendizadosList={aprendizadosList}
              onSaveAprendizado={handleSaveAprendizado}
              onDeleteAprendizado={handleDeleteAprendizado}
              registrosRapidosList={registrosRapidosList}
              onSaveRegistroRapido={handleSaveRegistroRapido}
              onDeleteRegistroRapido={handleDeleteRegistroRapido}
            />
          )}

          {activeTab === 'relatorios' && (
            <RelatoriosAnalytics
              obras={obras}
              compras={compras}
              vendedores={vendedores}
              fornecedores={fornecedores}
              etapas={etapas}
              empresa={empresa}
            />
          )}

          {activeTab === 'cadastros' && (
            <CadastrosAuxiliares
              vendedores={vendedores}
              fornecedores={fornecedores}
              onSaveVendedor={handleSaveVendedor}
              onDeleteVendedor={handleDeleteVendedor}
              onSaveFornecedor={handleSaveFornecedor}
              onDeleteFornecedor={handleDeleteFornecedor}
            />
          )}

          {activeTab === 'manutencao' && (
            <ManutencaoManager isReadOnly={isReadOnly} />
          )}

          {activeTab === 'configuracoes' && (
            <Configuracoes
              empresa={empresa}
              etapas={etapas}
              obras={obras}
              compras={compras}
              vendedores={vendedores}
              fornecedores={fornecedores}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              onSaveEmpresa={handleSaveEmpresa}
              onSaveEtapas={handleSaveEtapas}
              onReloadAllData={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Obra Modal */}
      {showObraModal && (
        <ObraFormModal
          isOpen={showObraModal}
          onClose={() => setShowObraModal(false)}
          onSave={handleSaveObra}
          editingObra={editingObra}
          vendedores={vendedores}
          etapas={etapas}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          obras={obras}
          compras={compras}
          fornecedores={fornecedores}
          onOpenWorkspace={() => setShowWorkspaceModal(true)}
          onNavigateToTab={handleNavigateTab}
        />
      )}

      {/* Workspace Modal */}
      {showWorkspaceModal && (
        <WorkspaceModal
          isOpen={showWorkspaceModal}
          onClose={() => setShowWorkspaceModal(false)}
          empresa={empresa}
          obras={obras}
          compras={compras}
        />
      )}
    </div>
  );
}

export default App;
