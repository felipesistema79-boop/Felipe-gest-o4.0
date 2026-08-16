import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  RotateCw,
  Grid2X2,
  ListOrdered,
  Plus,
  CheckCircle,
  AlertOctagon,
  Trash2,
  X,
  Save,
  HardHat,
  Sparkles,
  Zap,
  Target,
  Lightbulb,
  Clock,
  Play,
  Pause,
  RotateCcw,
  ThumbsUp,
  FileText,
  CheckSquare,
  ArrowRight,
  Volume2,
  HelpCircle,
  Check,
  User,
  DollarSign,
  MapPin,
  Calendar,
  Edit,
  Workflow,
  Sliders,
  Award,
  BookOpen,
  Tag,
  Star,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  Users
} from 'lucide-react';
import {
  PDCAItem,
  EisenhowerItem,
  GUTItem,
  FiveWTwoHItem,
  BrainstormingIdea,
  Obra,
  DecisaoAprendizado,
  RegistroRapidoItem
} from '../types';
import { storageService } from '../services/storage';
import { formatDateBR } from '../utils/dateUtils';
import { RegistroRapidoTab } from './RegistroRapidoTab';

interface InteligenciaDecisaoProps {
  pdcaList?: PDCAItem[];
  eisenhowerList?: EisenhowerItem[];
  gutList?: GUTItem[];
  fiveWTwoHList?: FiveWTwoHItem[];
  brainstormingList?: BrainstormingIdea[];
  aprendizadosList?: DecisaoAprendizado[];
  registrosRapidosList?: RegistroRapidoItem[];
  obras?: Obra[];
  onSavePDCA: (item: PDCAItem) => void;
  onDeletePDCA: (id: string) => void;
  onSaveEisenhower: (item: EisenhowerItem) => void;
  onDeleteEisenhower: (id: string) => void;
  onSaveGUT: (item: GUTItem) => void;
  onDeleteGUT: (id: string) => void;
  onSaveFiveWTwoH: (item: FiveWTwoHItem) => void;
  onDeleteFiveWTwoH: (id: string) => void;
  onSaveBrainstorming: (item: BrainstormingIdea) => void;
  onDeleteBrainstorming: (id: string) => void;
  onSaveAprendizado?: (item: DecisaoAprendizado) => void;
  onDeleteAprendizado?: (id: string) => void;
  onSaveRegistroRapido?: (item: RegistroRapidoItem) => void;
  onDeleteRegistroRapido?: (id: string) => void;
}

export const InteligenciaDecisao: React.FC<InteligenciaDecisaoProps> = ({
  pdcaList = [],
  eisenhowerList = [],
  gutList = [],
  fiveWTwoHList = [],
  brainstormingList = [],
  aprendizadosList: propsAprendizados,
  registrosRapidosList: propsRegistrosRapidos,
  obras = [],
  onSavePDCA,
  onDeletePDCA,
  onSaveEisenhower,
  onDeleteEisenhower,
  onSaveGUT,
  onDeleteGUT,
  onSaveFiveWTwoH,
  onDeleteFiveWTwoH,
  onSaveBrainstorming,
  onDeleteBrainstorming,
  onSaveAprendizado,
  onDeleteAprendizado,
  onSaveRegistroRapido,
  onDeleteRegistroRapido,
}) => {
  const [activeTab, setActiveTab] = useState<'registro_rapido' | 'pdca' | 'eisenhower' | 'gut' | '5w2h' | 'brainstorming' | 'aprendizados'>('registro_rapido');

  // Internal state for aprendizados if not passed by props
  const [internalAprendizados, setInternalAprendizados] = useState<DecisaoAprendizado[]>(() =>
    propsAprendizados && propsAprendizados.length > 0 ? propsAprendizados : storageService.getAprendizados()
  );

  const aprendizados = propsAprendizados && propsAprendizados.length > 0 ? propsAprendizados : internalAprendizados;

  const handleSaveAprendizadoInternal = (item: DecisaoAprendizado) => {
    if (onSaveAprendizado) {
      onSaveAprendizado(item);
    } else {
      storageService.saveAprendizado(item);
      setInternalAprendizados(storageService.getAprendizados());
    }
  };

  const handleDeleteAprendizadoInternal = (id: string) => {
    if (onDeleteAprendizado) {
      onDeleteAprendizado(id);
    } else {
      storageService.deleteAprendizado(id);
      setInternalAprendizados(storageService.getAprendizados());
    }
  };

  // Internal state for registros rápidos if not passed by props
  const [internalRegistrosRapidos, setInternalRegistrosRapidos] = useState<RegistroRapidoItem[]>(() =>
    propsRegistrosRapidos && propsRegistrosRapidos.length > 0
      ? propsRegistrosRapidos
      : storageService.getRegistrosRapidos()
  );

  const registrosRapidos =
    propsRegistrosRapidos && propsRegistrosRapidos.length > 0
      ? propsRegistrosRapidos
      : internalRegistrosRapidos;

  const handleSaveRegistroRapidoInternal = (item: RegistroRapidoItem) => {
    if (onSaveRegistroRapido) {
      onSaveRegistroRapido(item);
    } else {
      storageService.saveRegistroRapido(item);
      setInternalRegistrosRapidos(storageService.getRegistrosRapidos());
    }
  };

  const handleDeleteRegistroRapidoInternal = (id: string) => {
    if (onDeleteRegistroRapido) {
      onDeleteRegistroRapido(id);
    } else {
      storageService.deleteRegistroRapido(id);
      setInternalRegistrosRapidos(storageService.getRegistrosRapidos());
    }
  };

  // PDCA Form State
  const [showPDCAModal, setShowPDCAModal] = useState(false);
  const [editingPDCA, setEditingPDCA] = useState<PDCAItem | null>(null);
  const [pdcaTitulo, setPdcaTitulo] = useState('');
  const [pdcaPlan, setPdcaPlan] = useState('');
  const [pdcaDo, setPdcaDo] = useState('');
  const [pdcaCheck, setPdcaCheck] = useState('');
  const [pdcaAct, setPdcaAct] = useState('');
  const [pdcaStatus, setPdcaStatus] = useState<string>('EM ANDAMENTO');

  // Eisenhower Form State
  const [showEisModal, setShowEisModal] = useState(false);
  const [editingEis, setEditingEis] = useState<EisenhowerItem | null>(null);
  const [eisTitulo, setEisTitulo] = useState('');
  const [eisDesc, setEisDesc] = useState('');
  const [eisUrgente, setEisUrgente] = useState(true);
  const [eisImportante, setEisImportante] = useState(true);

  // GUT Form State
  const [showGUTModal, setShowGUTModal] = useState(false);
  const [editingGUT, setEditingGUT] = useState<GUTItem | null>(null);
  const [gutProblema, setGutProblema] = useState('');
  const [gutGravidade, setGutGravidade] = useState<number>(3);
  const [gutUrgencia, setGutUrgencia] = useState<number>(3);
  const [gutTendencia, setGutTendencia] = useState<number>(3);
  const [gutAcao, setGutAcao] = useState('');
  const [gutResp, setGutResp] = useState('');

  // 5W2H Form State
  const [show5W2HModal, setShow5W2HModal] = useState(false);
  const [editing5W2H, setEditing5W2H] = useState<FiveWTwoHItem | null>(null);
  const [fiveWhat, setFiveWhat] = useState('');
  const [fiveWhy, setFiveWhy] = useState('');
  const [fiveWhere, setFiveWhere] = useState('');
  const [fiveWhen, setFiveWhen] = useState('');
  const [fiveWho, setFiveWho] = useState('');
  const [fiveHow, setFiveHow] = useState('');
  const [fiveHowMuch, setFiveHowMuch] = useState('');
  const [fiveStatus, setFiveStatus] = useState<'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDO'>('PENDENTE');

  // Brainstorming Form State
  const [showBrainModal, setShowBrainModal] = useState(false);
  const [editingBrain, setEditingBrain] = useState<BrainstormingIdea | null>(null);
  const [brainTopico, setBrainTopico] = useState('');
  const [brainIdeia, setBrainIdeia] = useState('');
  const [brainAutor, setBrainAutor] = useState('');

  // Aprendizado / Feedback Modal State
  const [showAprModal, setShowAprModal] = useState(false);
  const [editingApr, setEditingApr] = useState<DecisaoAprendizado | null>(null);
  const [aprOrigemTipo, setAprOrigemTipo] = useState<'PDCA' | 'EISENHOWER' | 'GUT' | '5W2H' | 'BRAINSTORMING' | 'DIRETO'>('PDCA');
  const [aprOrigemId, setAprOrigemId] = useState<string | undefined>(undefined);
  const [aprTitulo, setAprTitulo] = useState('');
  const [aprSolucao, setAprSolucao] = useState('');
  const [aprResultado, setAprResultado] = useState('');
  const [aprEficacia, setAprEficacia] = useState<'ALTAMENTE_EFICAZ' | 'MUITO_BOM' | 'PARCIALMENTE_EFICAZ' | 'INEFICAZ'>('ALTAMENTE_EFICAZ');
  const [aprCategoria, setAprCategoria] = useState<string>('GERAL');
  const [aprImpactoDias, setAprImpactoDias] = useState<number>(3);
  const [aprAutor, setAprAutor] = useState('Felipe Martinelli');
  const [aprTags, setAprTags] = useState('producao, melhoria');

  // Filter for Aprendizados tab
  const [aprSearchTerm, setAprSearchTerm] = useState('');
  const [aprFilterCategory, setAprFilterCategory] = useState<string>('TODAS');

  // Timer Brainstorming
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Diagnostic notification status
  const [diagnosticoStatus, setDiagnosticoStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = (sec = 300) => {
    setIsTimerRunning(false);
    setTimerSeconds(sec);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Automatic AI / Rule Diagnostic from Works
  const handleGerarDiagnosticoIA = () => {
    setDiagnosticoStatus('Analisando gargalos fabris, compras pendentes e histórico de sucessos...');

    setTimeout(() => {
      let gargalosGerados = 0;
      obras.forEach((obra) => {
        const temEtapaParada = Object.values(obra.fluxoEtapas || {}).includes('PARADO');
        if (temEtapaParada) {
          gargalosGerados++;
          onSaveGUT({
            id: `gut-auto-${Date.now()}-${obra.id}`,
            problema: `Gargalo no fluxo da obra ${obra.codigo} (${obra.cliente})`,
            gravidade: 5,
            urgencia: 5,
            tendencia: 4,
            acaoProposta: `Verificar pendência de insumos/projeto para destravar a obra ${obra.codigo}`,
            responsavel: obra.vendedorNome || 'Gerência de Produção',
          });

          onSaveFiveWTwoH({
            id: `five-auto-${Date.now()}-${obra.id}`,
            what: `Destravar etapa parada na obra ${obra.codigo}`,
            why: `Evitar atraso no cronograma de instalação da obra ${obra.cliente}`,
            where: `Fábrica / Setor responsável`,
            when: new Date().toISOString().split('T')[0],
            who: obra.vendedorNome || 'Encarregado PCP',
            how: `Reorganizar ordem de produção ou aplicar solução comprovada de histórico`,
            howMuch: 'R$ 0,00',
            status: 'PENDENTE',
            dataCriacao: new Date().toISOString().split('T')[0],
            obraId: obra.id,
          });
        }
      });

      setDiagnosticoStatus(
        gargalosGerados > 0
          ? `Diagnóstico concluído! ${gargalosGerados} gargalos convertidos em Matriz GUT e Planos 5W2H.`
          : 'Diagnóstico concluído! Nenhuma etapa parada detectada no momento.'
      );
      setTimeout(() => setDiagnosticoStatus(null), 5000);
    }, 1000);
  };

  // Handlers PDCA
  const handleOpenNewPDCA = () => {
    setEditingPDCA(null);
    setPdcaTitulo('');
    setPdcaPlan('');
    setPdcaDo('');
    setPdcaCheck('');
    setPdcaAct('');
    setPdcaStatus('EM ANDAMENTO');
    setShowPDCAModal(true);
  };

  const handleOpenEditPDCA = (item: PDCAItem) => {
    setEditingPDCA(item);
    setPdcaTitulo(item.titulo || '');
    setPdcaPlan(item.plan || '');
    setPdcaDo(item.do || '');
    setPdcaCheck(item.check || '');
    setPdcaAct(item.act || '');
    setPdcaStatus(item.status || 'EM ANDAMENTO');
    setShowPDCAModal(true);
  };

  const handleSavePDCA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdcaTitulo.trim()) return;
    const newItem: PDCAItem = {
      id: editingPDCA?.id || `pdca-${Date.now()}`,
      titulo: pdcaTitulo.trim(),
      plan: pdcaPlan.trim(),
      do: pdcaDo.trim(),
      check: pdcaCheck.trim(),
      act: pdcaAct.trim(),
      status: (pdcaStatus || 'EM ANDAMENTO') as any,
      dataCriacao: editingPDCA?.dataCriacao || new Date().toISOString().split('T')[0],
    };
    onSavePDCA(newItem);
    setShowPDCAModal(false);
    setEditingPDCA(null);
    setPdcaTitulo('');
    setPdcaPlan('');
    setPdcaDo('');
    setPdcaCheck('');
    setPdcaAct('');
  };

  // Handlers Eisenhower
  const handleOpenNewEis = () => {
    setEditingEis(null);
    setEisTitulo('');
    setEisDesc('');
    setEisUrgente(true);
    setEisImportante(true);
    setShowEisModal(true);
  };

  const handleOpenEditEis = (item: EisenhowerItem) => {
    setEditingEis(item);
    setEisTitulo(item.titulo || '');
    setEisDesc(item.descricao || '');
    setEisUrgente(item.urgente);
    setEisImportante(item.importante);
    setShowEisModal(true);
  };

  const handleSaveEis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eisTitulo.trim()) return;
    const newItem: EisenhowerItem = {
      id: editingEis?.id || `eis-${Date.now()}`,
      titulo: eisTitulo.trim(),
      descricao: eisDesc.trim(),
      urgente: eisUrgente,
      importante: eisImportante,
      dataCriacao: editingEis?.dataCriacao || new Date().toISOString().split('T')[0],
    };
    onSaveEisenhower(newItem);
    setShowEisModal(false);
    setEditingEis(null);
    setEisTitulo('');
    setEisDesc('');
  };

  // Handlers GUT
  const handleOpenNewGUT = () => {
    setEditingGUT(null);
    setGutProblema('');
    setGutGravidade(3);
    setGutUrgencia(3);
    setGutTendencia(3);
    setGutAcao('');
    setGutResp('');
    setShowGUTModal(true);
  };

  const handleOpenEditGUT = (item: GUTItem) => {
    setEditingGUT(item);
    setGutProblema(item.problema || '');
    setGutGravidade(item.gravidade || 3);
    setGutUrgencia(item.urgencia || 3);
    setGutTendencia(item.tendencia || 3);
    setGutAcao(item.acaoProposta || '');
    setGutResp(item.responsavel || '');
    setShowGUTModal(true);
  };

  const handleSaveGUTForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gutProblema.trim()) return;
    const newItem: GUTItem = {
      id: editingGUT?.id || `gut-${Date.now()}`,
      problema: gutProblema.trim(),
      gravidade: Number(gutGravidade),
      urgencia: Number(gutUrgencia),
      tendencia: Number(gutTendencia),
      acaoProposta: gutAcao.trim(),
      responsavel: gutResp.trim(),
      dataCriacao: editingGUT?.dataCriacao || new Date().toISOString().split('T')[0],
    };
    onSaveGUT(newItem);
    setShowGUTModal(false);
    setEditingGUT(null);
    setGutProblema('');
    setGutAcao('');
    setGutResp('');
  };

  // Handlers 5W2H
  const handleOpenNew5W2H = () => {
    setEditing5W2H(null);
    setFiveWhat('');
    setFiveWhy('');
    setFiveWhere('');
    setFiveWhen(new Date().toISOString().split('T')[0]);
    setFiveWho('');
    setFiveHow('');
    setFiveHowMuch('');
    setFiveStatus('PENDENTE');
    setShow5W2HModal(true);
  };

  const handleOpenEdit5W2H = (item: FiveWTwoHItem) => {
    setEditing5W2H(item);
    setFiveWhat(item.what || '');
    setFiveWhy(item.why || '');
    setFiveWhere(item.where || '');
    setFiveWhen(item.when || new Date().toISOString().split('T')[0]);
    setFiveWho(item.who || '');
    setFiveHow(item.how || '');
    setFiveHowMuch(item.howMuch || '');
    setFiveStatus(item.status || 'PENDENTE');
    setShow5W2HModal(true);
  };

  const handleSave5W2HForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiveWhat.trim()) return;
    const newItem: FiveWTwoHItem = {
      id: editing5W2H?.id || `five-${Date.now()}`,
      what: fiveWhat.trim(),
      why: fiveWhy.trim(),
      where: fiveWhere.trim(),
      when: fiveWhen || new Date().toISOString().split('T')[0],
      who: fiveWho.trim(),
      how: fiveHow.trim(),
      howMuch: fiveHowMuch.trim() || 'R$ 0,00',
      status: fiveStatus,
      dataCriacao: editing5W2H?.dataCriacao || new Date().toISOString().split('T')[0],
      obraId: editing5W2H?.obraId,
    };
    onSaveFiveWTwoH(newItem);
    setShow5W2HModal(false);
    setEditing5W2H(null);
    setFiveWhat('');
    setFiveWhy('');
    setFiveWhere('');
    setFiveWhen('');
    setFiveWho('');
    setFiveHow('');
    setFiveHowMuch('');
  };

  // Handlers Brainstorming
  const handleOpenNewBrain = () => {
    setEditingBrain(null);
    setBrainTopico('');
    setBrainIdeia('');
    setBrainAutor('');
    setShowBrainModal(true);
  };

  const handleOpenEditBrain = (idea: BrainstormingIdea) => {
    setEditingBrain(idea);
    setBrainTopico(idea.topico || '');
    setBrainIdeia(idea.ideia || '');
    setBrainAutor(idea.autor || '');
    setShowBrainModal(true);
  };

  const handleSaveBrainIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainIdeia.trim()) return;
    const newItem: BrainstormingIdea = {
      id: editingBrain?.id || `brain-${Date.now()}`,
      topico: brainTopico.trim() || 'Melhorias Gerais na Fábrica',
      ideia: brainIdeia.trim(),
      autor: brainAutor.trim() || 'Equipe',
      votos: editingBrain ? editingBrain.votos : 1,
      status: editingBrain ? editingBrain.status : 'SELECIONADA',
      dataCriacao: editingBrain?.dataCriacao || new Date().toISOString().split('T')[0],
    };
    onSaveBrainstorming(newItem);
    setShowBrainModal(false);
    setEditingBrain(null);
    setBrainTopico('');
    setBrainIdeia('');
    setBrainAutor('');
  };

  const handleVoteIdea = (idea: BrainstormingIdea) => {
    onSaveBrainstorming({
      ...idea,
      votos: idea.votos + 1,
    });
  };

  const handleConvertIdeaTo5W2H = (idea: BrainstormingIdea) => {
    setFiveWhat(idea.ideia);
    setFiveWhy(`Ideia originada do Brainstorming sobre "${idea.topico}"`);
    setFiveWho(idea.autor);
    setFiveWhere('Fábrica / Produção');
    setFiveWhen(new Date().toISOString().split('T')[0]);
    setFiveHow('A ser estruturado conforme o plano de ação.');
    setFiveHowMuch('A calcular');
    setFiveStatus('PENDENTE');
    setShow5W2HModal(true);
  };

  // ==========================================
  // APRENDIZADO & FEEDBACK LOOP HANDLERS
  // ==========================================
  const handleOpenFeedbackFromTool = (
    origem: 'PDCA' | 'EISENHOWER' | 'GUT' | '5W2H' | 'BRAINSTORMING',
    id: string,
    tituloProblema: string,
    solucao?: string
  ) => {
    setEditingApr(null);
    setAprOrigemTipo(origem);
    setAprOrigemId(id);
    setAprTitulo(tituloProblema);
    setAprSolucao(solucao || '');
    setAprResultado('Decisão validada com sucesso na prática. Reduziu retrabalhos e aumentou a produtividade.');
    setAprEficacia('ALTAMENTE_EFICAZ');
    setAprCategoria('GERAL');
    setAprImpactoDias(3);
    setAprAutor('Felipe Martinelli');
    setAprTags('melhoria, decisao_sucesso');
    setShowAprModal(true);
  };

  const handleOpenNewAprendizadoDirect = () => {
    setEditingApr(null);
    setAprOrigemTipo('DIRETO');
    setAprOrigemId(undefined);
    setAprTitulo('');
    setAprSolucao('');
    setAprResultado('');
    setAprEficacia('ALTAMENTE_EFICAZ');
    setAprCategoria('GERAL');
    setAprImpactoDias(2);
    setAprAutor('Felipe Martinelli');
    setAprTags('');
    setShowAprModal(true);
  };

  const handleOpenEditAprendizado = (apr: DecisaoAprendizado) => {
    setEditingApr(apr);
    setAprOrigemTipo(apr.origemTipo);
    setAprOrigemId(apr.origemId);
    setAprTitulo(apr.tituloProblema);
    setAprSolucao(apr.solucaoAplicada);
    setAprResultado(apr.resultadoObtido);
    setAprEficacia(apr.avaliacaoEficacia);
    setAprCategoria(apr.categoria || 'GERAL');
    setAprImpactoDias(apr.impactoDiasEconomizados || 0);
    setAprAutor(apr.autor || '');
    setAprTags((apr.tags || []).join(', '));
    setShowAprModal(true);
  };

  const handleSaveAprendizadoForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aprTitulo.trim() || !aprSolucao.trim()) return;

    const tagsArray = aprTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newApr: DecisaoAprendizado = {
      id: editingApr?.id || `apr-${Date.now()}`,
      origemTipo: aprOrigemTipo,
      origemId: aprOrigemId,
      tituloProblema: aprTitulo.trim(),
      solucaoAplicada: aprSolucao.trim(),
      resultadoObtido: aprResultado.trim() || 'Solução registrada com êxito.',
      avaliacaoEficacia: aprEficacia,
      categoria: aprCategoria,
      impactoDiasEconomizados: Number(aprImpactoDias) || 0,
      dataRegistro: editingApr?.dataRegistro || new Date().toISOString().split('T')[0],
      autor: aprAutor.trim() || 'Felipe Martinelli',
      tags: tagsArray,
    };

    handleSaveAprendizadoInternal(newApr);
    setShowAprModal(false);
    setEditingApr(null);
  };

  // Filtered Aprendizados List
  const filteredAprendizados = aprendizados.filter((a) => {
    const matchSearch =
      aprSearchTerm.trim() === '' ||
      a.tituloProblema.toLowerCase().includes(aprSearchTerm.toLowerCase()) ||
      a.solucaoAplicada.toLowerCase().includes(aprSearchTerm.toLowerCase()) ||
      a.resultadoObtido.toLowerCase().includes(aprSearchTerm.toLowerCase()) ||
      (a.tags || []).some((t) => t.toLowerCase().includes(aprSearchTerm.toLowerCase()));

    const matchCategory =
      aprFilterCategory === 'TODAS' || (a.categoria || 'GERAL') === aprFilterCategory;

    return matchSearch && matchCategory;
  });

  // Aprendizados Totals
  const totalAltaEficacia = aprendizados.filter(
    (a) => a.avaliacaoEficacia === 'ALTAMENTE_EFICAZ' || a.avaliacaoEficacia === 'MUITO_BOM'
  ).length;
  const taxaSucesso = aprendizados.length > 0 ? Math.round((totalAltaEficacia / aprendizados.length) * 100) : 100;
  const totalDiasEconomizados = aprendizados.reduce((acc, a) => acc + (a.impactoDiasEconomizados || 0), 0);

  // Helper para aplicar sugestão aprendida em 5W2H
  const handleApplyAprendizadoTo5W2H = (apr: DecisaoAprendizado) => {
    setFiveWhat(apr.solucaoAplicada);
    setFiveWhy(`Aplicação de solução de alta eficácia comprovada no histórico: ${apr.tituloProblema}`);
    setFiveWhere('Fábrica / PCP');
    setFiveWhen(new Date().toISOString().split('T')[0]);
    setFiveWho(apr.autor || 'Equipe');
    setFiveHow(apr.solucaoAplicada);
    setFiveHowMuch('R$ 0,00');
    setFiveStatus('PENDENTE');
    setShow5W2HModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Inteligência de Negócios, Decisões & Aprendizado Contínuo
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ferramentas integradas de qualidade: PDCA, Eisenhower, GUT, 5W2H, Brainstorming e Banco de Lições Aprendidas.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full lg:w-auto flex-wrap sm:flex-nowrap justify-end">
          {/* AI Diagnostic Button */}
          <button
            onClick={handleGerarDiagnosticoIA}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Diagnóstico de Gargalos</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('registro_rapido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'registro_rapido'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Registro Rápido ({registrosRapidos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pdca')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'pdca'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>PDCA</span>
            </button>

            <button
              onClick={() => setActiveTab('eisenhower')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'eisenhower'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span>Eisenhower</span>
            </button>

            <button
              onClick={() => setActiveTab('gut')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'gut'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>GUT</span>
            </button>

            <button
              onClick={() => setActiveTab('5w2h')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === '5w2h'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Plano 5W2H</span>
            </button>

            <button
              onClick={() => setActiveTab('brainstorming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'brainstorming'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Brainstorming</span>
            </button>

            <button
              onClick={() => setActiveTab('aprendizados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'aprendizados'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
              <span>🧠 Aprendizados & Lições ({aprendizados.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic notification feedback */}
      {diagnosticoStatus && (
        <div className="p-3 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-bold text-orange-800 dark:text-orange-200 flex items-center space-x-2 animate-fadeIn">
          <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-bounce" />
          <span>{diagnosticoStatus}</span>
        </div>
      )}

      {/* ASSISTANT SMART RECOMMENDATION BANNER (Shows in PDCA, GUT, 5W2H, Eisenhower) */}
      {activeTab !== 'aprendizados' && aprendizados.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                    SISTEMA DE APRENDIZADO ATIVO
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {aprendizados.length} Lições de Sucesso Registradas no Histórico
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Exemplo de solução eficaz comprovada: <strong>"{aprendizados[0].tituloProblema}"</strong> → <em>"{aprendizados[0].solucaoAplicada}"</em> ({aprendizados[0].impactoDiasEconomizados} dias economizados).
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('aprendizados')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <span>Consultar Soluções de Sucesso</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 0: REGISTRO RÁPIDO */}
      {/* ========================================== */}
      {activeTab === 'registro_rapido' && (
        <RegistroRapidoTab
          registros={registrosRapidos}
          onSaveRegistro={handleSaveRegistroRapidoInternal}
          onDeleteRegistro={handleDeleteRegistroRapidoInternal}
          onConvertToPDCA={(pdca) => {
            onSavePDCA(pdca);
            setActiveTab('pdca');
          }}
          onConvertToGUT={(gut) => {
            onSaveGUT(gut);
            setActiveTab('gut');
          }}
          onConvertTo5W2H={(fiveW) => {
            onSaveFiveWTwoH(fiveW);
            setActiveTab('5w2h');
          }}
          onConvertToBrainstorming={(idea) => {
            onSaveBrainstorming(idea);
            setActiveTab('brainstorming');
          }}
          onConvertToEisenhower={(eis) => {
            onSaveEisenhower(eis);
            setActiveTab('eisenhower');
          }}
        />
      )}

      {/* ========================================== */}
      {/* TAB 1: CICLO PDCA */}
      {/* ========================================== */}
      {activeTab === 'pdca' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Ciclo PDCA (Plan, Do, Check, Act) - Melhoria Contínua
              </h3>
              <p className="text-xs text-slate-500">Clique em qualquer card para editar ou registrar o aprendizado de sucesso.</p>
            </div>
            <button
              onClick={handleOpenNewPDCA}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Plano PDCA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdcaList.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                Nenhum ciclo PDCA registrado. Clique em "Novo Plano PDCA" para iniciar.
              </div>
            ) : (
              pdcaList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenEditPDCA(item)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 p-4 flex flex-col justify-between space-y-3 relative group cursor-pointer transition"
                >
                  <div className="absolute top-3 right-3 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditPDCA(item);
                      }}
                      className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition"
                      title="Editar PDCA"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePDCA(item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                      title="Excluir PDCA"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pr-14">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {item.status}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5 group-hover:text-purple-600 transition">
                      {item.titulo}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <strong className="text-blue-600 dark:text-blue-400 block text-[10px] uppercase">Plan (Planejar)</strong>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{item.plan || '-'}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <strong className="text-amber-600 dark:text-amber-400 block text-[10px] uppercase">Do (Executar)</strong>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{item.do || '-'}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <strong className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase">Check (Checar)</strong>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{item.check || '-'}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <strong className="text-purple-600 dark:text-purple-400 block text-[10px] uppercase">Act (Agir)</strong>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{item.act || '-'}</p>
                    </div>
                  </div>

                  {/* Feedback / Save to Learning Repository Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFeedbackFromTool('PDCA', item.id, item.titulo, item.plan || item.act);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition"
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>🌟 Deu Certo! / Salvar Aprendizado</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: MATRIZ EISENHOWER */}
      {/* ========================================== */}
      {activeTab === 'eisenhower' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Matriz Eisenhower - Matriz de Urgência vs Importância
              </h3>
              <p className="text-xs text-slate-500">Classificação rápida de tarefas prioritárias.</p>
            </div>
            <button
              onClick={handleOpenNewEis}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Q1: Urgente e Importante */}
            <div className="bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>1. Fazer Agora (Urgente & Importante)</span>
                </h4>
              </div>
              <div className="space-y-2">
                {eisenhowerList
                  .filter((i) => i.urgente && i.importante)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenEditEis(item)}
                      className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 flex justify-between items-start shadow-xs hover:border-rose-400 cursor-pointer transition group"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-rose-600 transition">{item.titulo}</div>
                        {item.descricao && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.descricao}</div>}
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFeedbackFromTool('EISENHOWER', item.id, item.titulo, item.descricao);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Registrar Sucesso"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEisenhower(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q2: Não Urgente mas Importante */}
            <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>2. Agendar / Planejar (Não Urgente & Importante)</span>
              </h4>
              <div className="space-y-2">
                {eisenhowerList
                  .filter((i) => !i.urgente && i.importante)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenEditEis(item)}
                      className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-start shadow-xs hover:border-blue-400 cursor-pointer transition group"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition">{item.titulo}</div>
                        {item.descricao && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.descricao}</div>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEisenhower(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q3: Urgente mas Não Importante */}
            <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>3. Delegar (Urgente & Não Importante)</span>
              </h4>
              <div className="space-y-2">
                {eisenhowerList
                  .filter((i) => i.urgente && !i.importante)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenEditEis(item)}
                      className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 flex justify-between items-start shadow-xs hover:border-amber-400 cursor-pointer transition group"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition">{item.titulo}</div>
                        {item.descricao && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.descricao}</div>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEisenhower(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q4: Nem Urgente Nem Importante */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>4. Eliminar / Arquivar (Não Urgente & Não Importante)</span>
              </h4>
              <div className="space-y-2">
                {eisenhowerList
                  .filter((i) => !i.urgente && !i.importante)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenEditEis(item)}
                      className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-start shadow-xs hover:border-slate-400 cursor-pointer transition group"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{item.titulo}</div>
                        {item.descricao && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.descricao}</div>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEisenhower(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: MATRIZ GUT */}
      {/* ========================================== */}
      {activeTab === 'gut' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Matriz GUT (Gravidade x Urgência x Tendência) - Priorização de Gargalos
              </h3>
              <p className="text-xs text-slate-500">Ordenado pelo score GUT (G x U x T).</p>
            </div>
            <button
              onClick={handleOpenNewGUT}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Problema GUT</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3">Problema / Desafio</th>
                    <th className="p-3 text-center w-16">G</th>
                    <th className="p-3 text-center w-16">U</th>
                    <th className="p-3 text-center w-16">T</th>
                    <th className="p-3 text-center w-24">Score</th>
                    <th className="p-3">Ação Proposta</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3 text-center w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {gutList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500">
                        Nenhum problema registrado na Matriz GUT.
                      </td>
                    </tr>
                  ) : (
                    [...gutList]
                      .sort((a, b) => (b.gravidade * b.urgencia * b.tendencia) - (a.gravidade * a.urgencia * a.tendencia))
                      .map((item) => {
                        const score = (item.gravidade || 1) * (item.urgencia || 1) * (item.tendencia || 1);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {item.problema}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.gravidade}</td>
                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.urgencia}</td>
                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.tendencia}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                                score >= 60 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                score >= 30 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {score}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{item.acaoProposta || '-'}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{item.responsavel || '-'}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleOpenFeedbackFromTool('GUT', item.id, item.problema, item.acaoProposta)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="🌟 Deu Certo! / Salvar no Banco de Aprendizados"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditGUT(item)}
                                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteGUT(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: PLANO 5W2H */}
      {/* ========================================== */}
      {activeTab === '5w2h' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Plano de Ação 5W2H (What, Why, Where, When, Who, How, How Much)
              </h3>
              <p className="text-xs text-slate-500">Planos de ação estruturados para a fábrica e projetos.</p>
            </div>
            <button
              onClick={handleOpenNew5W2H}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Plano 5W2H</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fiveWTwoHList.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                Nenhum plano 5W2H registrado.
              </div>
            ) : (
              fiveWTwoHList.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleOpenEdit5W2H(f)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-400 space-y-3 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        f.status === 'CONCLUÍDO'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : f.status === 'EM ANDAMENTO'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {f.status}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                        {f.what}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFeedbackFromTool('5W2H', f.id, f.what, f.how);
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="🌟 Deu Certo! / Salvar no Banco de Aprendizados"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFiveWTwoH(f.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 font-semibold block">Por quê (Why):</span>
                      <span className="text-slate-700 dark:text-slate-300">{f.why || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Onde (Where):</span>
                      <span className="text-slate-700 dark:text-slate-300">{f.where || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Quando (When):</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">{formatDateBR(f.when)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Quem (Who):</span>
                      <span className="text-slate-700 dark:text-slate-300">{f.who || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-semibold block">Como (How):</span>
                      <span className="text-slate-700 dark:text-slate-300">{f.how || '-'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: BRAINSTORMING */}
      {/* ========================================== */}
      {activeTab === 'brainstorming' && (
        <div className="space-y-6">
          {/* Timer & Controls */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-base tracking-tight">Sessão Rápida de Brainstorming com Timer</h4>
                <p className="text-xs text-amber-100">Foque a equipe por 5 a 10 minutos para gerar soluções sem julgamentos.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="font-mono text-2xl font-black px-4 py-1.5 bg-black/20 rounded-xl border border-white/20">
                {formatTimer(timerSeconds)}
              </div>
              {isTimerRunning ? (
                <button
                  onClick={handlePauseTimer}
                  className="p-2 bg-white text-orange-600 rounded-xl font-bold hover:bg-amber-50 transition cursor-pointer"
                  title="Pausar"
                >
                  <Pause className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  className="p-2 bg-white text-orange-600 rounded-xl font-bold hover:bg-amber-50 transition cursor-pointer"
                  title="Iniciar"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => handleResetTimer(300)}
                className="p-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition cursor-pointer"
                title="Resetar 5 Min"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Mural de Ideias e Propostas de Melhoria
            </h3>
            <button
              onClick={handleOpenNewBrain}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Nova Ideia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brainstormingList.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                Nenhuma ideia registrada no momento. Clique em "Lançar Nova Ideia".
              </div>
            ) : (
              brainstormingList.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {idea.topico}
                      </span>
                      <button
                        onClick={() => onDeleteBrainstorming(idea.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-white mt-2 leading-relaxed">
                      "{idea.ideia}"
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Por: <strong>{idea.autor}</strong>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleVoteIdea(idea)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 hover:text-purple-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{idea.votos} Votos</span>
                    </button>

                    <button
                      onClick={() => handleConvertIdeaTo5W2H(idea)}
                      className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 rounded-lg text-[10px] font-bold hover:bg-purple-100 transition cursor-pointer"
                    >
                      Virar Plano 5W2H →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: BANCO DE APRENDIZADOS & LIÇÕES (FEEDBACK LOOP) */}
      {/* ========================================== */}
      {activeTab === 'aprendizados' && (
        <div className="space-y-6">
          {/* Learning KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lições Aprendidas
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {aprendizados.length}
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-1">
                Taxa de Eficácia Histórica: {taxaSucesso}%
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dias Economizados no Cronograma
                </span>
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {totalDiasEconomizados} <span className="text-xs font-medium text-slate-500">dias úteis</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Impacto direto no lead time de entrega</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Motor de Decisão
                </span>
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="text-base font-black text-purple-700 dark:text-purple-300 mt-2">
                Auto-Sugestão Ativa
              </div>
              <p className="text-xs text-slate-500 mt-1">Aprende com respostas bem-sucedidas</p>
            </div>
          </div>

          {/* Search, Filters & Action Button */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar lição, problema ou solução..."
                  value={aprSearchTerm}
                  onChange={(e) => setAprSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={aprFilterCategory}
                onChange={(e) => setAprFilterCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODAS">Todas as Categorias</option>
                <option value="CORTE">Corte & Perfis</option>
                <option value="VIDRO">Vidros & Fornecedores</option>
                <option value="FORNECEDOR">Fornecedores & Compras</option>
                <option value="PROJETO">Projeto & Vãos</option>
                <option value="MONTAGEM">Montagem de Esquadrias</option>
                <option value="INSTALACAO">Instalação na Obra</option>
                <option value="GERAL">Geral</option>
              </select>
            </div>

            <button
              onClick={handleOpenNewAprendizadoDirect}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nova Lição de Sucesso</span>
            </button>
          </div>

          {/* Cards of Lessons Learned */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAprendizados.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                Nenhum aprendizado encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredAprendizados.map((apr) => (
                <div
                  key={apr.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 space-y-3 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {apr.categoria || 'GERAL'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          Origem: {apr.origemTipo} • {formatDateBR(apr.dataRegistro)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditAprendizado(apr)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAprendizadoInternal(apr.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      🔴 Desafio: {apr.tituloProblema}
                    </h4>

                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-1.5 text-xs">
                      <div>
                        <strong className="text-emerald-800 dark:text-emerald-300 block text-[11px] uppercase tracking-wider">
                          💡 Solução Comprovada Aplicada:
                        </strong>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {apr.solucaoAplicada}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                        <strong className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase">
                          ✓ Resultado & Ganho:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                          {apr.resultadoObtido}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        ⚡ Economizou {apr.impactoDiasEconomizados} dias
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Por: {apr.autor}
                      </span>
                    </div>

                    <button
                      onClick={() => handleApplyAprendizadoTo5W2H(apr)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                      title="Replicar esta solução em um novo plano 5W2H"
                    >
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Replicar Solução (5W2H)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL PDCA */}
      {/* ========================================== */}
      {showPDCAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-purple-600" />
                <span>{editingPDCA ? 'Visualizar e Editar Ciclo PDCA' : 'Novo Ciclo PDCA'}</span>
              </h3>
              <button onClick={() => setShowPDCAModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePDCA} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do Ciclo / Gargalo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Otimização do corte de perfis de esquadrias"
                  value={pdcaTitulo}
                  onChange={(e) => setPdcaTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">P - Plan (Planejar - O que fazer e como?)</label>
                <textarea
                  rows={2}
                  placeholder="Definir metas e métodos de trabalho..."
                  value={pdcaPlan}
                  onChange={(e) => setPdcaPlan(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">D - Do (Executar - Treinar e colocar em prática)</label>
                <textarea
                  rows={2}
                  placeholder="Executar o plano e coletar dados..."
                  value={pdcaDo}
                  onChange={(e) => setPdcaDo(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">C - Check (Checar - Avaliar os resultados)</label>
                <textarea
                  rows={2}
                  placeholder="Verificar se os resultados alcançaram as metas..."
                  value={pdcaCheck}
                  onChange={(e) => setPdcaCheck(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">A - Act (Agir - Padronizar ou corrigir)</label>
                <textarea
                  rows={2}
                  placeholder="Padronizar a solução bem-sucedida ou reiniciar ciclo..."
                  value={pdcaAct}
                  onChange={(e) => setPdcaAct(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={pdcaStatus}
                  onChange={(e) => setPdcaStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold"
                >
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                  <option value="CONCLUÍDO">CONCLUÍDO</option>
                  <option value="PLANEJADO">PLANEJADO</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPDCAModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-purple-700">
                  {editingPDCA ? 'Salvar Alterações' : 'Salvar PDCA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL EISENHOWER */}
      {/* ========================================== */}
      {showEisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Grid2X2 className="w-4 h-4 text-purple-600" />
                <span>{editingEis ? 'Visualizar e Editar Tarefa' : 'Nova Tarefa - Matriz Eisenhower'}</span>
              </h3>
              <button onClick={() => setShowEisModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEis} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cobrar entrega de vidro temperado da obra 102"
                  value={eisTitulo}
                  onChange={(e) => setEisTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detalhes / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Informações complementares..."
                  value={eisDesc}
                  onChange={(e) => setEisDesc(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={eisUrgente}
                    onChange={(e) => setEisUrgente(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">É Urgente?</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={eisImportante}
                    onChange={(e) => setEisImportante(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">É Importante?</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEisModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-purple-700">
                  {editingEis ? 'Salvar Alterações' : 'Salvar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL GUT */}
      {/* ========================================== */}
      {showGUTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-purple-600" />
                <span>{editingGUT ? 'Visualizar e Editar GUT' : 'Adicionar Problema - Matriz GUT'}</span>
              </h3>
              <button onClick={() => setShowGUTModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGUTForm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Problema / Desafio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Falta de perfis de alumínio para a linha Suprema"
                  value={gutProblema}
                  onChange={(e) => setGutProblema(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Gravidade (1-5)</label>
                  <select
                    value={gutGravidade}
                    onChange={(e) => setGutGravidade(Number(e.target.value))}
                    className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-bold"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Urgência (1-5)</label>
                  <select
                    value={gutUrgencia}
                    onChange={(e) => setGutUrgencia(Number(e.target.value))}
                    className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-bold"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tendência (1-5)</label>
                  <select
                    value={gutTendencia}
                    onChange={(e) => setGutTendencia(Number(e.target.value))}
                    className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-bold"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ação Proposta</label>
                <input
                  type="text"
                  placeholder="Ex: Homologar fornecedor secundário"
                  value={gutAcao}
                  onChange={(e) => setGutAcao(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos (Compras)"
                  value={gutResp}
                  onChange={(e) => setGutResp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGUTModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-purple-700"
                >
                  {editingGUT ? 'Salvar Alterações' : 'Salvar GUT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5W2H */}
      {/* ========================================== */}
      {show5W2HModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-xl w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span>{editing5W2H ? 'Visualizar e Editar Plano 5W2H' : 'Cadastrar Plano de Ação 5W2H'}</span>
              </h3>
              <button onClick={() => setShow5W2HModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave5W2HForm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">1. O Quê? (What) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Adquirir gabarito usinado para furação"
                  value={fiveWhat}
                  onChange={(e) => setFiveWhat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">2. Por Quê? (Why)</label>
                <input
                  type="text"
                  placeholder="Ex: Eliminar refugos e atrasos na montagem"
                  value={fiveWhy}
                  onChange={(e) => setFiveWhy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">3. Onde? (Where)</label>
                  <input
                    type="text"
                    placeholder="Ex: Setor de Usinagem"
                    value={fiveWhere}
                    onChange={(e) => setFiveWhere(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">4. Quando? (When)</label>
                  <input
                    type="date"
                    value={fiveWhen}
                    onChange={(e) => setFiveWhen(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">5. Quem? (Who)</label>
                  <input
                    type="text"
                    placeholder="Ex: Eng. Ricardo & Marcos"
                    value={fiveWho}
                    onChange={(e) => setFiveWho(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">7. Quanto custa? (How Much)</label>
                  <input
                    type="text"
                    placeholder="Ex: R$ 1.500,00"
                    value={fiveHowMuch}
                    onChange={(e) => setFiveHowMuch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">6. Como? (How)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Encomendar junto ao fabricante de ferramentas e agendar treinamento"
                  value={fiveHow}
                  onChange={(e) => setFiveHow(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={fiveStatus}
                  onChange={(e) => setFiveStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                  <option value="CONCLUÍDO">CONCLUÍDO</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShow5W2HModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-purple-700">
                  {editing5W2H ? 'Salvar Alterações' : 'Salvar Plano 5W2H'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL BRAINSTORMING */}
      {/* ========================================== */}
      {showBrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{editingBrain ? 'Visualizar e Editar Ideia' : 'Lançar Ideia / Proposta'}</span>
              </h3>
              <button onClick={() => setShowBrainModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBrainIdea} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tópico / Desafio</label>
                <input
                  type="text"
                  placeholder="Ex: Como reduzir desperdício de perfis?"
                  value={brainTopico}
                  onChange={(e) => setBrainTopico(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sua Ideia / Proposta de Solução *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva a ideia de forma objetiva..."
                  value={brainIdeia}
                  onChange={(e) => setBrainIdeia(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Seu Nome / Departamento</label>
                <input
                  type="text"
                  placeholder="Ex: Marcos (Produção)"
                  value={brainAutor}
                  onChange={(e) => setBrainAutor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBrainModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-purple-700">
                  {editingBrain ? 'Salvar Alterações' : 'Lançar no Mural'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE APRENDIZADO & DECISÕES DE SUCESSO */}
      {/* ========================================== */}
      {showAprModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Star className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingApr ? 'Editar Registro de Aprendizado' : '🌟 Registrar Decisão de Sucesso no Motor de Inteligência'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    O sistema utilizará esta resposta para sugerir soluções comprovadas nas próximas decisões.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAprModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAprendizadoForm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Qual era o Gargalo / Problema Original? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Perda de tempo e trocas de perfis na bancada de corte"
                  value={aprTitulo}
                  onChange={(e) => setAprTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                  2. Qual Solução foi Aplicada e Deu Certo? *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Etiquetagem individual com código de corte e lote na saída da serra."
                  value={aprSolucao}
                  onChange={(e) => setAprSolucao(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Resultado & Ganho Obtido (Métricas)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Reduziu em 95% os erros de montagem e economizou 3 dias no cronograma global."
                  value={aprResultado}
                  onChange={(e) => setAprResultado(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria da Solução
                  </label>
                  <select
                    value={aprCategoria}
                    onChange={(e) => setAprCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold"
                  >
                    <option value="CORTE">Corte & Perfis</option>
                    <option value="VIDRO">Vidros & Temperas</option>
                    <option value="FORNECEDOR">Fornecedor & Compras</option>
                    <option value="PROJETO">Projeto & Vãos</option>
                    <option value="MONTAGEM">Montagem de Esquadrias</option>
                    <option value="INSTALACAO">Instalação na Obra</option>
                    <option value="GERAL">Geral / Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Avaliação de Eficácia
                  </label>
                  <select
                    value={aprEficacia}
                    onChange={(e) => setAprEficacia(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-emerald-600"
                  >
                    <option value="ALTAMENTE_EFICAZ">🌟 Altamente Eficaz (Excelente)</option>
                    <option value="MUITO_BOM">✓ Muito Bom</option>
                    <option value="PARCIALMENTE_EFICAZ">Parcialmente Eficaz</option>
                    <option value="INEFICAZ">Ineficaz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Impacto: Dias Economizados
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={aprImpactoDias}
                    onChange={(e) => setAprImpactoDias(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Autor da Decisão / Responsável
                  </label>
                  <input
                    type="text"
                    value={aprAutor}
                    onChange={(e) => setAprAutor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Palavras-chave / Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: corte, etiquetas, esquadrias, perda_zero"
                  value={aprTags}
                  onChange={(e) => setAprTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAprModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:from-emerald-700 hover:to-teal-700 shadow-xs flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingApr ? 'Salvar Alterações' : 'Salvar no Motor de Aprendizado'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
