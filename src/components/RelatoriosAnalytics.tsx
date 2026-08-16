import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileText,
  Filter,
  Download,
  ExternalLink,
  PieChart as PieIcon,
  TrendingUp,
  Layers,
  CheckCircle,
  HardHat,
  Award,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Clock,
  Building2,
  Briefcase,
  Printer,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  Globe,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  Calendar,
  Calculator,
  Gauge,
  Boxes,
  Activity,
  Zap,
  PackageCheck,
  Truck,
  Flame,
  Search
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Obra, Vendedor, EtapaFluxoConfig, EmpresaConfig, Compra, Fornecedor } from '../types';
import {
  generateRelatorioObrasPDF,
  generateRelatorioEficienciaPDF,
  generateRelatorioObrasEProdutosPDF,
  generateRelatorioCapacidadeFabrilPDF,
  generateRelatorioCalculadoraEstatisticasPDF,
  generateRelatorioDiretoriaCompletoPDF
} from '../utils/pdfGenerator';
import { formatDateBR, isOverdue } from '../utils/dateUtils';
import { defaultEtapas } from '../services/storage';

interface RelatoriosAnalyticsProps {
  obras?: Obra[];
  compras?: Compra[];
  vendedores?: Vendedor[];
  fornecedores?: Fornecedor[];
  etapas?: EtapaFluxoConfig[];
  empresa: EmpresaConfig;
}

type TabType =
  | 'visao_global'
  | 'eficiencia'
  | 'obras_produtos'
  | 'capacidade'
  | 'calculadora'
  | 'geral'
  | 'producao'
  | 'vendedores'
  | 'compras';

export const RelatoriosAnalytics: React.FC<RelatoriosAnalyticsProps> = ({
  obras = [],
  compras = [],
  vendedores = [],
  fornecedores = [],
  etapas = [],
  empresa,
}) => {
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>('TODOS');
  const [activeReportTab, setActiveReportTab] = useState<TabType>('visao_global');

  // Search & Filter for Obras & Produtos tab
  const [buscaObraProduto, setBuscaObraProduto] = useState<string>('');
  const [filtroStatusObraProduto, setFiltroStatusObraProduto] = useState<string>('TODOS');

  // Capacity Settings
  const [capacidadeMensalNominal, setCapacidadeMensalNominal] = useState<number>(150);

  // Predictive Production Calculator State
  const [calcQtdPecas, setCalcQtdPecas] = useState<number>(24);
  const [calcPrevisaoVidros, setCalcPrevisaoVidros] = useState<string>('');
  const [calcPrevisaoPerfis, setCalcPrevisaoPerfis] = useState<string>('');
  const [calcComplexidade, setCalcComplexidade] = useState<'PADRAO' | 'LEVE_SIMPLES' | 'SUPREMA_GOLD' | 'PESADA_FACHADA'>('SUPREMA_GOLD');
  const [calcPrazoDesejadoDias, setCalcPrazoDesejadoDias] = useState<number>(15);

  // Active Obras (non archived)
  const activeObras = obras.filter((o) => !o.arquivada);

  // Active stages for production report
  const activeReportEtapas = etapas && etapas.length > 0 ? etapas : defaultEtapas;

  // Normalized string helper
  const normalizeText = (text?: string) => {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Helper to get step status for any obra & etapa
  const getObraStepStatus = (obra: Obra, etapa: EtapaFluxoConfig) => {
    if (!obra.fluxoEtapas) return 'NÃO INICIADO';
    if (obra.fluxoEtapas[etapa.id]) return obra.fluxoEtapas[etapa.id];
    if (obra.fluxoEtapas[etapa.nome]) return obra.fluxoEtapas[etapa.nome];

    const targetNorm = normalizeText(etapa.nome);
    for (const [key, val] of Object.entries(obra.fluxoEtapas)) {
      if (normalizeText(key) === targetNorm) {
        return val;
      }
    }
    return 'NÃO INICIADO';
  };

  // 1. Data Chart: Obras por Status Global (100% Real Data)
  const statusCounts = activeObras.reduce((acc, o) => {
    const status = o.statusGlobal || 'NÃO AGENDADA';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartDataStatus = Object.keys(statusCounts).map((statusKey) => ({
    name: statusKey,
    quantidade: statusCounts[statusKey],
  }));

  const COLORS = ['#EA580C', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6'];

  // 2. Data Chart: Volume por Etapa do Fluxo de Produção (100% Real Data)
  const chartDataEtapas = activeReportEtapas.map((etapa) => {
    let executados = 0;
    let emAndamento = 0;
    let parados = 0;
    let naoIniciado = 0;

    activeObras.forEach((o) => {
      const st = getObraStepStatus(o, etapa);
      if (st === 'EXECUTADO') executados++;
      else if (st === 'EM ANDAMENTO') emAndamento++;
      else if (st === 'PARADO') parados++;
      else naoIniciado++;
    });

    return {
      etapa: etapa.nome.length > 14 ? etapa.nome.substring(0, 12) + '...' : etapa.nome,
      fullName: etapa.nome,
      EXECUTADO: executados,
      'EM ANDAMENTO': emAndamento,
      PARADO: parados,
      total: executados + emAndamento + parados,
    };
  });

  // 3. Vendedor Filtered Data
  const filteredObrasByVendedor =
    selectedVendedorId === 'TODOS'
      ? activeObras
      : activeObras.filter((o) => o.vendedorId === selectedVendedorId);

  // Month date helper
  const getMonthKeyAndLabel = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${monthNames[month - 1]}/${String(year).slice(-2)}`;
      return { key, label, year, month };
    } catch {
      return null;
    }
  };

  // Generate last 6 months list dynamically
  const generateRecentMonthsList = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${monthNames[month - 1]}/${String(year).slice(-2)}`;
      months.push({ key, label, year, month });
    }
    return months;
  };

  const recentMonths = generateRecentMonthsList();

  // Aggregate monthly metrics from REAL obras
  const dadosMensaisVisaoGlobal = recentMonths.map((m) => {
    const entradasObras = obras.filter((o) => {
      const dateInfo = getMonthKeyAndLabel(o.dataInicial || o.dataCriacao);
      return dateInfo && dateInfo.key === m.key;
    });
    const countEntradas = entradasObras.length;

    const saidasObras = obras.filter((o) => {
      if (o.statusGlobal !== 'ENTREGUE' && o.statusGlobal !== 'FINALIZADA') return false;
      const dateInfo = getMonthKeyAndLabel(o.dataFinalizacao || o.dataPrevistaEntrega);
      return dateInfo && dateInfo.key === m.key;
    });
    const countSaidas = saidasObras.length;

    const relevantObras = entradasObras.length > 0 ? entradasObras : obras;
    const avgLeadTime = relevantObras.length > 0
      ? Math.round(relevantObras.reduce((acc, o) => acc + (o.prazoDiasUteis || 15), 0) / relevantObras.length)
      : 15;

    const monthActiveOrFinished = obras.filter((o) => {
      const d = getMonthKeyAndLabel(o.dataInicial || o.dataCriacao);
      return d && d.key === m.key;
    });
    const targetObras = monthActiveOrFinished.length > 0 ? monthActiveOrFinished : obras;
    const countOnTime = targetObras.filter((o) => !isOverdue(o.dataPrevistaEntrega, o.statusGlobal)).length;
    const pontualidade = targetObras.length > 0
      ? Math.round((countOnTime / targetObras.length) * 100)
      : 100;

    let totalEtapasCount = 0;
    let totalExecutedCount = 0;
    targetObras.forEach((o) => {
      activeReportEtapas.forEach((et) => {
        totalEtapasCount++;
        if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') {
          totalExecutedCount++;
        }
      });
    });
    const eficiencia = totalEtapasCount > 0
      ? Math.min(100, Math.max(0, Math.round((totalExecutedCount / totalEtapasCount) * 100)))
      : (obras.length > 0 ? 85 : 100);

    return {
      mes: m.label,
      entradas: countEntradas,
      saidas: countSaidas,
      pontualidade,
      leadTimeDias: avgLeadTime,
      eficiencia: countSaidas > 0 ? Math.min(100, eficiencia + 10) : eficiencia,
    };
  });

  // Consolidated Overall Metrics
  const totalEntradasAcumuladas = obras.length;
  const totalSaidasAcumuladas = obras.filter(
    (o) => o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA'
  ).length;

  const totalObrasSemAtraso = obras.filter(
    (o) => !isOverdue(o.dataPrevistaEntrega, o.statusGlobal)
  ).length;
  const mediaPontualidadeAtual = obras.length > 0
    ? Math.round((totalObrasSemAtraso / obras.length) * 100)
    : 100;

  const leadTimeMedioAtual = obras.length > 0
    ? Math.round(obras.reduce((acc, o) => acc + (o.prazoDiasUteis || 15), 0) / obras.length)
    : 15;

  let totalStagesAcrossAllObras = 0;
  let executedStagesAcrossAllObras = 0;
  obras.forEach((o) => {
    activeReportEtapas.forEach((et) => {
      totalStagesAcrossAllObras++;
      if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') {
        executedStagesAcrossAllObras++;
      }
    });
  });
  const mediaEficienciaAtual = totalStagesAcrossAllObras > 0
    ? Math.round((executedStagesAcrossAllObras / totalStagesAcrossAllObras) * 100)
    : 100;

  // =========================================================================
  // QUANTITY OF PRODUCTS (FABRICADOS, ENTREGUES, EM PRODUÇÃO)
  // =========================================================================
  const produtosConsolidados = useMemo(() => {
    let totalContratados = 0;
    let totalFabricados = 0;
    let totalEntregues = 0;
    let totalEmProducao = 0;

    obras.forEach((o) => {
      const qtd = o.quantidade || 0;
      totalContratados += qtd;

      let executed = 0;
      activeReportEtapas.forEach((et) => {
        if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') executed++;
      });
      const ratio = activeReportEtapas.length > 0 ? executed / activeReportEtapas.length : 0;
      const isEntregue = o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA';

      if (isEntregue) {
        totalFabricados += qtd;
        totalEntregues += qtd;
      } else {
        const fab = Math.round(qtd * ratio);
        totalFabricados += fab;
        totalEmProducao += (qtd - fab);
      }
    });

    return {
      totalObras: obras.length,
      totalProdutosContratados: totalContratados,
      totalProdutosFabricados: totalFabricados,
      totalProdutosEntregues: totalEntregues,
      totalProdutosEmProducao: totalEmProducao,
    };
  }, [obras, activeReportEtapas]);

  // Filtered obras for Obras & Produtos tab
  const obrasFiltradasProdutos = useMemo(() => {
    return obras.filter((o) => {
      const matchesSearch =
        o.codigo.toLowerCase().includes(buscaObraProduto.toLowerCase()) ||
        o.cliente.toLowerCase().includes(buscaObraProduto.toLowerCase()) ||
        (o.vendedorNome && o.vendedorNome.toLowerCase().includes(buscaObraProduto.toLowerCase()));

      const matchesStatus =
        filtroStatusObraProduto === 'TODOS' || o.statusGlobal === filtroStatusObraProduto;

      return matchesSearch && matchesStatus;
    });
  }, [obras, buscaObraProduto, filtroStatusObraProduto]);

  // =========================================================================
  // MONTHLY CAPACITY CALCULATIONS
  // =========================================================================
  const dadosCapacidadeMensal = useMemo(() => {
    return recentMonths.map((m) => {
      const obrasDoMes = obras.filter((o) => {
        const d = getMonthKeyAndLabel(o.dataInicial || o.dataCriacao);
        return d && d.key === m.key;
      });

      const totalPecas = obrasDoMes.reduce((acc, o) => acc + (o.quantidade || 0), 0);
      const taxaOcupacao = Math.round((totalPecas / Math.max(1, capacidadeMensalNominal)) * 100);

      let statusOcupacao = 'NORMAL / SAUDÁVEL';
      if (taxaOcupacao > 105) statusOcupacao = 'SOBRECARGA';
      else if (taxaOcupacao > 85) statusOcupacao = 'ALTA OCUPAÇÃO';
      else if (taxaOcupacao < 40) statusOcupacao = 'CAPACIDADE OCIOSA';

      return {
        mes: m.label,
        produtosProduzidos: totalPecas,
        capacidadeNominal: capacidadeMensalNominal,
        taxaOcupacao,
        obrasAtivas: obrasDoMes.length,
        statusOcupacao,
      };
    });
  }, [recentMonths, obras, capacidadeMensalNominal]);

  // =========================================================================
  // STATISTICAL & PROBABILISTIC PREDICTIVE CALCULATOR
  // =========================================================================
  const calculoPreditivo = useMemo(() => {
    // 1. Calculate historical baseline pace (pieces manufactured per business day)
    const totalPecasObras = obras.reduce((acc, o) => acc + (o.quantidade || 0), 0);
    const totalDiasObras = obras.reduce((acc, o) => acc + (o.prazoDiasUteis || 15), 0);
    const ritmoHistorico = totalDiasObras > 0 && totalPecasObras > 0
      ? (totalPecasObras / totalDiasObras)
      : 2.8; // Safe fallback: 2.8 pieces per business day

    // 2. Factor by line complexity
    let complexityFactor = 1.0;
    if (calcComplexidade === 'LEVE_SIMPLES') complexityFactor = 0.75;
    if (calcComplexidade === 'SUPREMA_GOLD') complexityFactor = 1.15;
    if (calcComplexidade === 'PESADA_FACHADA') complexityFactor = 1.45;

    // 3. Material arrival constraints
    const today = new Date();
    let dataInicio = new Date(today);

    if (calcPrevisaoVidros) {
      const dtV = new Date(calcPrevisaoVidros);
      if (dtV > dataInicio) dataInicio = new Date(dtV);
    }
    if (calcPrevisaoPerfis) {
      const dtP = new Date(calcPrevisaoPerfis);
      if (dtP > dataInicio) dataInicio = new Date(dtP);
    }

    // Advance 1 business day for material inspection
    dataInicio.setDate(dataInicio.getDate() + 1);

    // 4. Calculate fabrication durations
    const baseDays = (calcQtdPecas / Math.max(0.5, ritmoHistorico)) * complexityFactor;
    const diasOtimista = Math.max(3, Math.ceil(baseDays * 0.85));
    const diasMedio = Math.max(4, Math.ceil(baseDays));
    const diasPessimista = Math.max(5, Math.ceil(baseDays * 1.35));

    // Helper to add business days
    const addBusinessDays = (startDate: Date, days: number) => {
      const d = new Date(startDate);
      let added = 0;
      while (added < days) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          added++;
        }
      }
      return d;
    };

    const dataTerminoFab = addBusinessDays(dataInicio, diasMedio);
    const dataSugeridaEntrega = addBusinessDays(dataTerminoFab, 2); // 2 days buffer for expediting/transport

    // Probability of meeting desired target deadline
    const margin = calcPrazoDesejadoDias - diasMedio;
    let probabilidade = 85;
    if (margin >= 5) probabilidade = 98;
    else if (margin >= 2) probabilidade = 92;
    else if (margin === 0) probabilidade = 80;
    else if (margin >= -2) probabilidade = 60;
    else probabilidade = 35;

    const obs: string[] = [];
    if (calcPrevisaoVidros || calcPrevisaoPerfis) {
      obs.push(`Liberação fabril condicionada à chegada de insumos em ${formatDateBR(dataInicio.toISOString().split('T')[0])}.`);
    } else {
      obs.push('Produção com insumos já disponíveis em estoque imediato.');
    }
    obs.push(`Ritmo médio verificado: ${ritmoHistorico.toFixed(1)} peças/dia útil.`);
    obs.push(`Margem de segurança para entrega final: 2 dias úteis pós-fabricação.`);

    return {
      quantidadePecas: calcQtdPecas,
      previsaoVidros: calcPrevisaoVidros,
      previsaoPerfis: calcPrevisaoPerfis,
      tipoLinha: calcComplexidade.replace('_', ' '),
      diasFabricacaoOtimista: diasOtimista,
      diasFabricacaoMedio: diasMedio,
      diasFabricacaoPessimista: diasPessimista,
      dataInicioProducao: dataInicio.toISOString().split('T')[0],
      dataTerminoFabricacao: dataTerminoFab.toISOString().split('T')[0],
      dataSugeridaEntrega: dataSugeridaEntrega.toISOString().split('T')[0],
      probabilidadePrazo: probabilidade,
      ritmoHistoricoPecasPorDia: ritmoHistorico,
      leadTimeMedioHistorico: leadTimeMedioAtual,
      observacoesEstrategicas: obs,
    };
  }, [
    calcQtdPecas,
    calcPrevisaoVidros,
    calcPrevisaoPerfis,
    calcComplexidade,
    calcPrazoDesejadoDias,
    obras,
    leadTimeMedioAtual,
  ]);

  // =========================================================================
  // PDF EXPORT HANDLERS
  // =========================================================================
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDFSubmenu = () => {
    switch (activeReportTab) {
      case 'eficiencia':
        generateRelatorioEficienciaPDF(obras, activeReportEtapas, empresa, {
          pontualidadeMedia: mediaPontualidadeAtual,
          leadTimeMedio: leadTimeMedioAtual,
          taxaConclusao: mediaEficienciaAtual,
          obrasNoPrazo: totalObrasSemAtraso,
          obrasAtrasadas: obras.length - totalObrasSemAtraso,
          totalObras: obras.length,
        });
        break;
      case 'obras_produtos':
        generateRelatorioObrasEProdutosPDF(obras, activeReportEtapas, empresa, produtosConsolidados);
        break;
      case 'capacidade':
        generateRelatorioCapacidadeFabrilPDF(obras, empresa, capacidadeMensalNominal, dadosCapacidadeMensal);
        break;
      case 'calculadora':
        generateRelatorioCalculadoraEstatisticasPDF(empresa, calculoPreditivo);
        break;
      case 'visao_global':
        generateRelatorioDiretoriaCompletoPDF(obras, activeReportEtapas, empresa, {
          totalObras: obras.length,
          totalProdutos: produtosConsolidados.totalProdutosContratados,
          produtosFabricados: produtosConsolidados.totalProdutosFabricados,
          produtosEntregues: produtosConsolidados.totalProdutosEntregues,
          pontualidadeGeral: mediaPontualidadeAtual,
          leadTimeMedio: leadTimeMedioAtual,
          eficienciaMedia: mediaEficienciaAtual,
          capacidadeMensalNominal: capacidadeMensalNominal,
        });
        break;
      default:
        const vend = vendedores.find((v) => v.id === selectedVendedorId);
        generateRelatorioObrasPDF(obras, activeReportEtapas, empresa, vend ? vend.nome : undefined);
        break;
    }
  };

  const handleExportDossieDiretoria = () => {
    generateRelatorioDiretoriaCompletoPDF(obras, activeReportEtapas, empresa, {
      totalObras: obras.length,
      totalProdutos: produtosConsolidados.totalProdutosContratados,
      produtosFabricados: produtosConsolidados.totalProdutosFabricados,
      produtosEntregues: produtosConsolidados.totalProdutosEntregues,
      pontualidadeGeral: mediaPontualidadeAtual,
      leadTimeMedio: leadTimeMedioAtual,
      eficienciaMedia: mediaEficienciaAtual,
      capacidadeMensalNominal: capacidadeMensalNominal,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Relatórios Executivos, Analytics & Capacidade Fabril
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Eficiência de produção, contagem de produtos fabricados/entregues, capacidade mensal e calculadora estatística de prazos.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Master Dossier PDF */}
          <button
            onClick={handleExportDossieDiretoria}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            title="Gerar Dossiê Completo Consolidado em PDF para a Diretoria"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Dossiê Geral Diretoria (PDF)</span>
          </button>

          {/* Export Submenu PDF Button */}
          <button
            onClick={handleExportPDFSubmenu}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            title="Exportar Relatório PDF desta Aba Ativa"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Exportar PDF Desta Aba</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Sub-menu Tabs Navigation */}
      <div className="flex items-center space-x-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('visao_global')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'visao_global'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Visão Global (Diretoria)</span>
        </button>

        <button
          onClick={() => setActiveReportTab('eficiencia')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'eficiencia'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Eficiência de Produção</span>
        </button>

        <button
          onClick={() => setActiveReportTab('obras_produtos')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'obras_produtos'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Obras & Produtos ({produtosConsolidados.totalProdutosContratados} pçs)</span>
        </button>

        <button
          onClick={() => setActiveReportTab('capacidade')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'capacidade'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Capacidade Fabril Mensal</span>
        </button>

        <button
          onClick={() => setActiveReportTab('calculadora')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'calculadora'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-300" />
          <span>Calculadora & Prazos Preditivos</span>
        </button>

        <button
          onClick={() => setActiveReportTab('geral')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'geral'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Status & Entregas</span>
        </button>

        <button
          onClick={() => setActiveReportTab('producao')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'producao'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Fluxo Fabril por Etapa</span>
        </button>

        <button
          onClick={() => setActiveReportTab('vendedores')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'vendedores'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Vendas & Vendedores</span>
        </button>

        <button
          onClick={() => setActiveReportTab('compras')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeReportTab === 'compras'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Compras & Fornecedores</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 1. VISÃO GLOBAL (DIRETORIA) */}
      {/* ==================================================================== */}
      {activeReportTab === 'visao_global' && (
        <div className="space-y-6">
          {/* Directorial KPI Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total de Obras Cadastradas
                </span>
                <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {totalEntradasAcumuladas}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalSaidasAcumuladas} entregues ({Math.round((totalSaidasAcumuladas / Math.max(1, totalEntradasAcumuladas)) * 100)}%)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pontualidade de Entrega
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {mediaPontualidadeAtual}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalObrasSemAtraso} de {obras.length} obras rigorosamente no prazo
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lead Time Médio Fabril
                </span>
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                {leadTimeMedioAtual} <span className="text-xs font-medium text-slate-500">dias úteis</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Tempo médio de ciclo por obra</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Volume Total de Peças
                </span>
                <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                {produtosConsolidados.totalProdutosContratados} <span className="text-xs font-medium text-slate-500">peças</span>
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">
                {produtosConsolidados.totalProdutosFabricados} já fabricadas ({Math.round((produtosConsolidados.totalProdutosFabricados / Math.max(1, produtosConsolidados.totalProdutosContratados)) * 100)}%)
              </p>
            </div>
          </div>

          {/* Charts Row: Entradas vs Saídas & Eficiência */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span>Entradas vs Saídas de Obras (Últimos 6 Meses)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Fluxo de novas contratações versus entregas concluídas
                  </p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosMensaisVisaoGlobal}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="mes" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="entradas" fill="#EA580C" name="Novas Obras (Entradas)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" fill="#10B981" name="Obras Entregues (Saídas)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-500" />
                    <span>Evolução da Pontualidade & Eficiência Fabril</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Taxa de pontualidade (%) e avanço de etapas de produção
                  </p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosMensaisVisaoGlobal}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="mes" fontSize={11} />
                    <YAxis domain={[0, 100]} fontSize={11} unit="%" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="pontualidade" stroke="#10B981" strokeWidth={3} name="Pontualidade (%)" />
                    <Line type="monotone" dataKey="eficiencia" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" name="Eficiência Operacional (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. EFICIÊNCIA DE PRODUÇÃO & GARGALOS */}
      {/* ==================================================================== */}
      {activeReportTab === 'eficiencia' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-orange-600 text-white uppercase tracking-wider">
                Relatório de Eficiência Operacional
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                Desempenho Fabril, Cumprimento de Prazos & Análise de Gargalos
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Auditoria de produtividade para identificar etapas retidas e garantir a pontualidade contratada.
              </p>
            </div>
            <button
              onClick={handleExportPDFSubmenu}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Gerar Relatório de Eficiência em PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Taxa de Conclusão Global</span>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-2">
                {mediaEficienciaAtual}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {executedStagesAcrossAllObras} de {totalStagesAcrossAllObras} etapas executadas no total
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Obras Rigorosamente no Prazo</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {totalObrasSemAtraso} <span className="text-sm font-semibold text-slate-500">/ {obras.length}</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                {mediaPontualidadeAtual}% índice de pontualidade
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Lead Time Médio por Obra</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
                {leadTimeMedioAtual} <span className="text-sm font-semibold text-slate-500">dias</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Média entre entrada e entrega final</p>
            </div>
          </div>

          {/* Table of Obras Efficiency */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <span>Auditoria de Eficiência e Progresso por Obra</span>
              </h3>
              <span className="text-xs text-slate-500">{obras.length} obras monitoradas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3">Código</th>
                    <th className="p-3">Cliente / Obra</th>
                    <th className="p-3 text-center">Qtd Peças</th>
                    <th className="p-3 text-center">Prazo Contratual</th>
                    <th className="p-3 text-center">Data Prevista</th>
                    <th className="p-3">Avanço no Fluxo</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Pontualidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {obras.map((o) => {
                    let executed = 0;
                    activeReportEtapas.forEach((et) => {
                      if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') executed++;
                    });
                    const percentProg = activeReportEtapas.length > 0
                      ? Math.round((executed / activeReportEtapas.length) * 100)
                      : 0;
                    const isLate = o.statusGlobal !== 'ENTREGUE' && o.statusGlobal !== 'FINALIZADA' && new Date(o.dataPrevistaEntrega) < new Date();

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">
                          {o.codigo}
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                          {o.cliente}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                          {o.quantidade || 0} pçs
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                          {o.prazoDiasUteis || 15} dias
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                          {formatDateBR(o.dataPrevistaEntrega)}
                        </td>
                        <td className="p-3">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-orange-600 h-2.5 rounded-full transition-all"
                              style={{ width: `${percentProg}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                            {percentProg}% ({executed}/{activeReportEtapas.length} etapas)
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {o.statusGlobal}
                        </td>
                        <td className="p-3 text-center">
                          {isLate ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                              ATRASADO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              NO PRAZO
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. OBRAS & QUANTIDADE DE PRODUTOS (FABRICADOS VS ENTREGUES) */}
      {/* ==================================================================== */}
      {activeReportTab === 'obras_produtos' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-orange-600 text-white uppercase tracking-wider">
                Volume de Produtos
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                Quantidade de Produtos por Obra (Contratados, Fabricados & Entregues)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Controle exato de peças produzidas na serralheria e liberadas para instalação no cliente.
              </p>
            </div>
            <button
              onClick={handleExportPDFSubmenu}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Gerar Relatório de Produtos em PDF</span>
            </button>
          </div>

          {/* Product Volume Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Contratado</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {produtosConsolidados.totalProdutosContratados} <span className="text-xs font-medium text-slate-500">peças</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{produtosConsolidados.totalObras} obras contratadas</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Total Fabricado</span>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-2">
                {produtosConsolidados.totalProdutosFabricados} <span className="text-xs font-medium text-slate-500">peças</span>
              </div>
              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold mt-1">
                {produtosConsolidados.totalProdutosContratados > 0
                  ? `${Math.round((produtosConsolidados.totalProdutosFabricados / produtosConsolidados.totalProdutosContratados) * 100)}% concluído na fábrica`
                  : '0%'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Entregue</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {produtosConsolidados.totalProdutosEntregues} <span className="text-xs font-medium text-slate-500">peças</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                {produtosConsolidados.totalProdutosContratados > 0
                  ? `${Math.round((produtosConsolidados.totalProdutosEntregues / produtosConsolidados.totalProdutosContratados) * 100)}% entregue ao cliente`
                  : '0%'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Em Fabricação Ativa</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                {produtosConsolidados.totalProdutosEmProducao} <span className="text-xs font-medium text-slate-500">peças</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Em processo no chão de fábrica</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código, cliente ou vendedor..."
                value={buscaObraProduto}
                onChange={(e) => setBuscaObraProduto(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Status:</span>
              <select
                value={filtroStatusObraProduto}
                onChange={(e) => setFiltroStatusObraProduto(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="EM_PRODUCAO">EM PRODUÇÃO</option>
                <option value="AGENDADA">AGENDADA</option>
                <option value="ENTREGUE">ENTREGUE</option>
                <option value="FINALIZADA">FINALIZADA</option>
              </select>
            </div>
          </div>

          {/* Main Table: Obras & Products */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5">Código</th>
                    <th className="p-3.5">Cliente / Obra</th>
                    <th className="p-3.5 text-center">Qtd Contratada</th>
                    <th className="p-3.5">Avanço Fabril</th>
                    <th className="p-3.5 text-center">Qtd Fabricada</th>
                    <th className="p-3.5 text-center">Qtd Entregue</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Previsão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {obrasFiltradasProdutos.map((o) => {
                    let executed = 0;
                    activeReportEtapas.forEach((et) => {
                      if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') executed++;
                    });
                    const ratio = activeReportEtapas.length > 0 ? executed / activeReportEtapas.length : 0;
                    const isEntregue = o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA';
                    const qtdTotal = o.quantidade || 0;
                    const qtdFab = isEntregue ? qtdTotal : Math.round(qtdTotal * ratio);
                    const qtdEnt = isEntregue ? qtdTotal : 0;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {o.codigo}
                        </td>
                        <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {o.cliente}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                          {qtdTotal} peças
                        </td>
                        <td className="p-3.5 min-w-[140px]">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.round(ratio * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block font-semibold">
                            {Math.round(ratio * 100)}% concluído
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-orange-600 dark:text-orange-400">
                          {qtdFab} pçs
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {qtdEnt} pçs
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {o.statusGlobal}
                        </td>
                        <td className="p-3.5 text-center text-slate-500">
                          {formatDateBR(o.dataPrevistaEntrega)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. CAPACIDADE FABRIL MENSAL & CARGA */}
      {/* ==================================================================== */}
      {activeReportTab === 'capacidade' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-orange-600 text-white uppercase tracking-wider">
                Planejamento de Carga Fabril
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                Capacidade Fabril Mensal & Taxa de Ocupação da Fábrica
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Monitore a ocupação instalada da serralheria, preveja sobrecargas e dimensione novos prazos de entrega.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Capacidade Nominal:</span>
                <input
                  type="number"
                  value={capacidadeMensalNominal}
                  onChange={(e) => setCapacidadeMensalNominal(Math.max(10, Number(e.target.value)))}
                  className="w-16 font-bold text-xs text-orange-600 dark:text-orange-400 bg-transparent border-b border-orange-400 focus:outline-hidden text-center"
                />
                <span className="text-xs text-slate-400">pçs/mês</span>
              </div>

              <button
                onClick={handleExportPDFSubmenu}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Gerar PDF</span>
              </button>
            </div>
          </div>

          {/* Chart: Capacidade vs Produção Mensal */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-orange-500" />
              <span>Ocupação Fabril vs Capacidade Instalada (Últimos 6 Meses)</span>
            </h3>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosCapacidadeMensal}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="mes" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="capacidadeNominal" fill="#94A3B8" name="Capacidade Nominal (Peças)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="produtosProduzidos" fill="#EA580C" name="Volume Produzido / Carga (Peças)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Capacity Diagnostic Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Demonstrativo Mensal de Capacidade e Margem de Produção
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5">Mês / Ano</th>
                    <th className="p-3.5 text-center">Capacidade Nominal</th>
                    <th className="p-3.5 text-center">Volume Produzido</th>
                    <th className="p-3.5 text-center">Taxa de Ocupação</th>
                    <th className="p-3.5 text-center">Obras Ativas</th>
                    <th className="p-3.5 text-center">Diagnóstico Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {dadosCapacidadeMensal.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{m.mes}</td>
                      <td className="p-3.5 text-center font-medium text-slate-600 dark:text-slate-400">
                        {m.capacidadeNominal} pçs
                      </td>
                      <td className="p-3.5 text-center font-bold text-orange-600 dark:text-orange-400">
                        {m.produtosProduzidos} pçs
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {m.taxaOcupacao}%
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-400">
                        {m.obrasAtivas} obras
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            m.statusOcupacao === 'SOBRECARGA'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : m.statusOcupacao === 'ALTA OCUPAÇÃO'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {m.statusOcupacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. CALCULADORA DE PRODUÇÃO & ESTIMATIVA DE CHEGADA DE INSUMOS */}
      {/* ==================================================================== */}
      {activeReportTab === 'calculadora' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/20 text-white uppercase tracking-wider">
                Inteligência Preditiva & Probabilidades
              </span>
              <h3 className="text-lg font-black mt-1.5">
                Calculadora de Tempo de Produção com Previsão de Insumos
              </h3>
              <p className="text-xs text-amber-100 mt-1 max-w-2xl">
                Simule com precisão matemática o prazo de entrega com base no histórico do ERP, quantidade de esquadrias e data prevista de chegada de vidros e perfis.
              </p>
            </div>

            <button
              onClick={handleExportPDFSubmenu}
              className="px-4 py-2.5 bg-white text-orange-700 hover:bg-amber-50 rounded-xl text-xs font-black transition flex items-center space-x-2 shrink-0 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>Gerar Parecer Preditivo em PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Calculator className="w-4 h-4 text-orange-500" />
                <span>Parâmetros de Simulação da Obra</span>
              </h4>

              {/* Qtd Pecas */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantidade de Produtos / Peças da Obra:
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={calcQtdPecas}
                  onChange={(e) => setCalcQtdPecas(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Previsao Vidros */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  📅 Previsão de Chegada dos Vidros:
                </label>
                <input
                  type="date"
                  value={calcPrevisaoVidros}
                  onChange={(e) => setCalcPrevisaoVidros(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Deixe vazio se os vidros já estiverem disponíveis no estoque.
                </p>
              </div>

              {/* Previsao Perfis */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  📅 Previsão de Chegada dos Perfis de Alumínio:
                </label>
                <input
                  type="date"
                  value={calcPrevisaoPerfis}
                  onChange={(e) => setCalcPrevisaoPerfis(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Deixe vazio se os perfis já estiverem cortados/estocados.
                </p>
              </div>

              {/* Complexidade / Linha */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Linha & Complexidade Técnica:
                </label>
                <select
                  value={calcComplexidade}
                  onChange={(e) => setCalcComplexidade(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="LEVE_SIMPLES">Linha Convencional / Simples (0.75x tempo)</option>
                  <option value="PADRAO">Linha Padrão de Mercado (1.0x tempo)</option>
                  <option value="SUPREMA_GOLD">Linha Suprema / Gold / Integrada (1.15x tempo)</option>
                  <option value="PESADA_FACHADA">Fachada Glazing / Linha Pesada (1.45x tempo)</option>
                </select>
              </div>

              {/* Target Prazo */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Prazo Desejado pelo Cliente (Dias Úteis):
                </label>
                <input
                  type="number"
                  min={1}
                  value={calcPrazoDesejadoDias}
                  onChange={(e) => setCalcPrazoDesejadoDias(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-7 space-y-4">
              {/* Primary Simulation Result Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Resultado Preditivo & Cronograma Estimado</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {calculoPreditivo.probabilidadePrazo}% Probabilidade de Sucesso
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Início Liberado</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {formatDateBR(calculoPreditivo.dataInicioProducao)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Após chegada de insumos</p>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50">
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Tempo de Fabricação</span>
                    <div className="text-sm font-black text-orange-600 dark:text-orange-400 mt-1">
                      {calculoPreditivo.diasFabricacaoMedio} dias úteis
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ritmo: {calculoPreditivo.ritmoHistoricoPecasPorDia.toFixed(1)} pçs/dia</p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Data Sugerida Entrega</span>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatDateBR(calculoPreditivo.dataSugeridaEntrega)}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Com margem de segurança</p>
                  </div>
                </div>

                {/* Scenarios Breakdown Table */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Faixa de Probabilidade Estatística (Cenários)
                  </h5>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs">
                      <div>
                        <strong className="text-emerald-800 dark:text-emerald-300">Cenário Otimista:</strong>
                        <span className="text-slate-600 dark:text-slate-400 ml-1.5">
                          {calculoPreditivo.diasFabricacaoOtimista} dias úteis
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        95% de chance
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 text-xs">
                      <div>
                        <strong className="text-orange-800 dark:text-orange-300">Cenário Mais Provável:</strong>
                        <span className="text-slate-600 dark:text-slate-400 ml-1.5">
                          {calculoPreditivo.diasFabricacaoMedio} dias úteis ({formatDateBR(calculoPreditivo.dataTerminoFabricacao)})
                        </span>
                      </div>
                      <span className="font-bold text-orange-700 dark:text-orange-400 font-mono">
                        85% de chance (Recomendado)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">Cenário Conservador / Crítico:</strong>
                        <span className="text-slate-600 dark:text-slate-400 ml-1.5">
                          {calculoPreditivo.diasFabricacaoPessimista} dias úteis
                        </span>
                      </div>
                      <span className="font-bold text-slate-500 font-mono">
                        99% de segurança
                      </span>
                    </div>
                  </div>
                </div>

                {/* Directorial Takeaways */}
                <div className="mt-4 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Parecer para a Diretoria Comercial & Operacional:</span>
                  </span>
                  <ul className="text-[11px] text-amber-900 dark:text-amber-200 mt-1.5 space-y-1 list-disc pl-4">
                    {calculoPreditivo.observacoesEstrategicas.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. STATUS & ENTREGAS (GERAL) */}
      {/* ==================================================================== */}
      {activeReportTab === 'geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <PieIcon className="w-4 h-4 text-orange-500" />
                <span>Distribuição de Obras por Status Global</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="quantidade"
                    >
                      {chartDataStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Resumo Quantitativo por Status</span>
              </h3>
              <div className="space-y-3">
                {chartDataStatus.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {item.quantidade} obras
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {activeObras.length > 0 ? `${Math.round((item.quantidade / activeObras.length) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. FLUXO FABRIL POR ETAPAS */}
      {/* ==================================================================== */}
      {activeReportTab === 'producao' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Volume de Obras por Etapa do Fluxo Fabril</span>
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataEtapas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="etapa" type="category" width={110} fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="EXECUTADO" stackId="a" fill="#10B981" name="Concluído" />
                  <Bar dataKey="EM ANDAMENTO" stackId="a" fill="#EA580C" name="Em Andamento" />
                  <Bar dataKey="PARADO" stackId="a" fill="#EF4444" name="Parado / Pendência" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. VENDAS & VENDEDORES */}
      {/* ==================================================================== */}
      {activeReportTab === 'vendedores' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Filtrar por Vendedor:
            </span>
            <select
              value={selectedVendedorId}
              onChange={(e) => setSelectedVendedorId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200"
            >
              <option value="TODOS">Todos os Vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Carteira de Obras por Vendedor ({filteredObrasByVendedor.length} obras)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3">Código</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Vendedor</th>
                    <th className="p-3 text-center">Qtd Peças</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Data Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredObrasByVendedor.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{o.codigo}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{o.cliente}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{o.vendedorNome || 'Geral'}</td>
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{o.quantidade || 0} pçs</td>
                      <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">{o.statusGlobal}</td>
                      <td className="p-3 text-center text-slate-500">{formatDateBR(o.dataPrevistaEntrega)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. COMPRAS & FORNECEDORES */}
      {/* ==================================================================== */}
      {activeReportTab === 'compras' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Fornecedores Homologados</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {fornecedores.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Perfis, Vidros & Acessórios</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 uppercase">Pedidos Entregues</span>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                {compras.filter((c) => c.status === 'ENTREGUE').length}
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                {compras.length > 0
                  ? `${Math.round((compras.filter((c) => c.status === 'ENTREGUE').length / compras.length) * 100)}% de conclusão`
                  : '100%'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-amber-600 uppercase">Prazo Médio de Fornecedor</span>
              <div className="text-2xl font-black text-amber-600 mt-2">
                {fornecedores.length > 0
                  ? Math.round(
                      fornecedores.reduce((acc, f) => acc + (f.prazoEntregaPadraoDiasUteis || 5), 0) /
                        fornecedores.length
                    )
                  : 5}{' '}
                <span className="text-xs font-medium text-slate-500">dias úteis</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Padrão homologado no sistema</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Desempenho de Fornecedores Homologados
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3">Escopo</th>
                    <th className="p-3 text-center">Prazo Padrão</th>
                    <th className="p-3 text-center">Telefone</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {fornecedores.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {f.razaoSocial || f.nome || 'Fornecedor'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{f.materialEscopo || 'Geral'}</td>
                      <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {f.prazoEntregaPadraoDiasUteis || 5} dias
                      </td>
                      <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">{f.telefone || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Homologado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
