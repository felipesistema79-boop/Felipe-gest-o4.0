import React, { useState, useEffect } from 'react';
import {
  HardHat,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Award,
  Layers,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Activity
} from 'lucide-react';
import { Obra, Compra, Vendedor, EtapaFluxoConfig, ConfigGargalosDashboard, GargaloConfig } from '../types';
import { isOverdue, formatDateBR } from '../utils/dateUtils';
import { storageService } from '../services/storage';

interface DashboardProps {
  obras?: Obra[];
  compras?: Compra[];
  vendedores?: Vendedor[];
  etapas?: EtapaFluxoConfig[];
  onNavigateTab?: (tab: string) => void;
  onNavigateObras?: () => void;
  onNavigateCompras?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  obras = [],
  compras = [],
  vendedores = [],
  etapas = [],
  onNavigateTab,
  onNavigateObras,
  onNavigateCompras,
}) => {
  const [configGargalos, setConfigGargalos] = useState<ConfigGargalosDashboard>(() =>
    storageService.getConfigGargalos()
  );
  const [gargalosCadastrados, setGargalosCadastrados] = useState<GargaloConfig[]>(() =>
    storageService.getGargalos()
  );

  useEffect(() => {
    const handleStorageUpdate = () => {
      setConfigGargalos(storageService.getConfigGargalos());
      setGargalosCadastrados(storageService.getGargalos());
    };
    window.addEventListener('sgm_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('sgm_storage_updated', handleStorageUpdate);
  }, []);

  const navigateTo = (tab: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (tab === 'obras' && onNavigateObras) {
      onNavigateObras();
    } else if (tab === 'compras' && onNavigateCompras) {
      onNavigateCompras();
    }
  };
  // Exclude archived obras from metrics per requirement
  const activeObras = obras.filter((o) => !o.arquivada);

  // 1. Obras em Produção
  const obrasEmProducao = activeObras.filter(
    (o) => o.statusGlobal === 'AGENDADA' || o.statusGlobal === 'PENDENCIA' || o.statusGlobal === 'NÃO AGENDADA'
  );

  // 2. Obras Atrasadas
  const obrasAtrasadas = activeObras.filter((o) => isOverdue(o.dataPrevistaEntrega, o.statusGlobal));

  // 3. Obras Entregues / Finalizadas
  const obrasEntregues = activeObras.filter(
    (o) => o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA'
  );

  // 4. Compras status metrics
  const comprasCotacao = compras.filter((c) => c.status === 'EM COTAÇÃO').length;
  const comprasAprovadas = compras.filter((c) => c.status === 'APROVADO').length;
  const comprasEntregues = compras.filter((c) => c.status === 'ENTREGUE').length;
  const comprasAtrasadas = compras.filter((c) => {
    if (c.status === 'ENTREGUE') return false;
    return isOverdue(c.dataEntregaPrevista, c.status);
  }).length;

  // 5. Gargalos de Produção com Base nas Configurações Personalizadas
  const etapasVisiveis = etapas.filter((e) => !(configGargalos.etapasOcultadas || []).includes(e.id));

  const gargalosCalculados = etapasVisiveis
    .map((etapa) => {
      let parados = 0;
      let emAndamento = 0;

      activeObras.forEach((o) => {
        const st = o.fluxoEtapas?.[etapa.id];
        if (st === 'PARADO') parados++;
        if (st === 'EM ANDAMENTO') emAndamento++;
      });

      const pesoP = configGargalos.pesoParado ?? 2;
      const pesoA = configGargalos.pesoAndamento ?? 1;
      const totalGargalo = parados * pesoP + emAndamento * pesoA;
      const metaDias = configGargalos.diasMaximosSugeridosPorEtapa?.[etapa.id];

      const isCritico = parados >= (configGargalos.limiteCriticoParadas ?? 1);
      const isAtencao =
        emAndamento >= (configGargalos.limiteAtencaoAndamento ?? 3) && !isCritico;

      return {
        etapaId: etapa.id,
        nome: etapa.nome,
        parados,
        emAndamento,
        totalGargalo,
        metaDias,
        isCritico,
        isAtencao,
      };
    })
    .filter((item) => {
      if (configGargalos.mostrarApenasGargalosAtivos) {
        return item.parados > 0 || item.emAndamento > 0;
      }
      return true;
    })
    .sort((a, b) => b.totalGargalo - a.totalGargalo);

  const gargalosPorEtapa =
    configGargalos.limiteMaximoExibicao && configGargalos.limiteMaximoExibicao > 0
      ? gargalosCalculados.slice(0, configGargalos.limiteMaximoExibicao)
      : gargalosCalculados;

  // 6. Ranking Mensal de Vendedores por quantidade de obras no mês
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const rankingVendedores = vendedores.map((v) => {
    const obrasDoVendedor = activeObras.filter((o) => o.vendedorId === v.id || o.vendedorNome === v.nome);
    const qtdObrasTotal = obrasDoVendedor.length;
    
    // Filter obras in current month
    const obrasMensal = obrasDoVendedor.filter((o) => {
      const dt = o.dataInicial || o.dataCriacao;
      if (!dt) return true;
      const parts = dt.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === currentYear && m === currentMonth;
      }
      return true;
    });

    const qtdObrasMensal = obrasMensal.length > 0 ? obrasMensal.length : qtdObrasTotal;
    const obrasEntregues = obrasDoVendedor.filter(
      (o) => o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA'
    ).length;

    return {
      vendedor: v.nome,
      qtdObrasMensal,
      qtdObrasTotal,
      obrasEntregues,
    };
  }).sort((a, b) => b.qtdObrasMensal - a.qtdObrasMensal || b.qtdObrasTotal - a.qtdObrasTotal);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 rounded-2xl text-white shadow-lg border border-orange-500">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Painel Executivo de Produção & Obras
          </h2>
          <p className="text-xs text-orange-100 mt-1">
            Visão consolidada em tempo real para controle operacional e gerenciamento de gargalos.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => navigateTo('obras')}
            className="px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <span>Ver Todas as Obras</span>
            <ArrowRight className="w-4 h-4 text-orange-700" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Obras em Produção */}
        <div
          onClick={() => navigateTo('obras')}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Obras em Produção
            </span>
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-xl group-hover:scale-110 transition">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {obrasEmProducao.length}
            </span>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              {activeObras.length} Ativas no Total
            </span>
          </div>
        </div>

        {/* KPI 2: Obras Atrasadas */}
        <div
          onClick={() => navigateTo('obras')}
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition cursor-pointer group ${
            obrasAtrasadas.length > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Obras Atrasadas
            </span>
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 rounded-xl group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300">
              {obrasAtrasadas.length}
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {obrasAtrasadas.length > 0 ? 'Atenção Imediata' : 'Prazo 100% OK'}
            </span>
          </div>
        </div>

        {/* KPI 3: Obras Entregues */}
        <div
          onClick={() => navigateTo('obras')}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Obras Entregues
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {obrasEntregues.length}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Concluídas
            </span>
          </div>
        </div>

        {/* KPI 4: Controle de Compras */}
        <div
          onClick={() => navigateTo('compras')}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Controle Compras
            </span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
            <div>Cotação: <strong className="text-orange-600">{comprasCotacao}</strong></div>
            <div>Aprovadas: <strong className="text-emerald-600">{comprasAprovadas}</strong></div>
            <div>Entregues: <strong>{comprasEntregues}</strong></div>
            <div>Atrasadas: <strong className="text-rose-600">{comprasAtrasadas}</strong></div>
          </div>
        </div>
      </div>

      {/* Grid Gargalos de Produção + Ranking Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gargalos de Produção */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Gargalos do Fluxo de Produção</span>
                  {configGargalos.etapasOcultadas && configGargalos.etapasOcultadas.length > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Personalizado
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Monitoramento inteligente de acúmulo de obras e gargalos ativos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigateTo('configuracoes')}
                className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition"
                title="Configurar Regras de Gargalos"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigateTo('obras')}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Ver Obras
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {gargalosPorEtapa.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhuma etapa com gargalo no momento. Fluxo produtivo liberado!
              </div>
            ) : (
              gargalosPorEtapa.map((item, index) => (
                <div
                  key={item.etapaId}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      item.isCritico
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                        : item.isAtencao
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center space-x-2 truncate">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.nome}
                        </h4>
                        {item.metaDias && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {item.metaDias}d meta
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        {item.parados > 0 && (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-rose-500" />
                            {item.parados} {item.parados === 1 ? 'Parada' : 'Paradas'}
                          </span>
                        )}
                        <span className={item.emAndamento > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}>
                          {item.emAndamento} Em Andamento
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {item.isCritico ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Gargalo Crítico
                      </span>
                    ) : item.isAtencao ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Fluxo Intenso
                      </span>
                    ) : item.parados > 0 || item.emAndamento > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        Fluxo Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Livre
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gargalos Manuais Cadastrados Ativos */}
          {gargalosCadastrados.filter((g) => g.ativo).length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h5 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Pontos Críticos Registrados em Alerta:</span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {gargalosCadastrados
                  .filter((g) => g.ativo)
                  .map((g) => (
                    <div
                      key={g.id}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border ${
                        g.impacto === 'CRITICO'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                          : g.impacto === 'ALTO'
                          ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span className="font-extrabold">{g.nome}</span>
                      <span className="opacity-75 font-normal">({g.setor})</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Ranking Mensal de Vendedores */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Ranking Mensal de Vendedores
                </h3>
                <p className="text-[11px] text-slate-500">
                  Classificação pela quantidade de obras no mês
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('cadastros')}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Gerenciar
            </button>
          </div>

          <div className="space-y-3">
            {rankingVendedores.map((item, index) => (
              <div
                key={item.vendedor}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : index === 1
                        ? 'bg-slate-300 text-slate-900'
                        : 'bg-amber-700/30 text-amber-400'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.vendedor}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Total: {item.qtdObrasTotal} Obras ({item.obrasEntregues} Entregues)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400 block font-mono">
                    {item.qtdObrasMensal} {item.qtdObrasMensal === 1 ? 'Obra' : 'Obras'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Ranking Mensal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
