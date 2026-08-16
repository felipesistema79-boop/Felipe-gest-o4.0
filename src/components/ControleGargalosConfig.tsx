import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  AlertTriangle,
  Layers,
  Save,
  Check,
  Eye,
  EyeOff,
  Clock,
  Scale,
  Sparkles,
  Info,
  RotateCcw,
  Flame,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { EtapaFluxoConfig, ConfigGargalosDashboard, Obra } from '../types';
import { storageService, defaultConfigGargalos } from '../services/storage';
import { useDialog } from './DialogContext';

interface ControleGargalosConfigProps {
  etapas: EtapaFluxoConfig[];
  obras?: Obra[];
  onSaved?: () => void;
}

export const ControleGargalosConfig: React.FC<ControleGargalosConfigProps> = ({
  etapas = [],
  obras = [],
  onSaved,
}) => {
  const { showConfirm } = useDialog();
  const [config, setConfig] = useState<ConfigGargalosDashboard>(() => storageService.getConfigGargalos());
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setConfig(storageService.getConfigGargalos());
    };
    window.addEventListener('sgm_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('sgm_storage_updated', handleStorageUpdate);
  }, []);

  const handleToggleOcultarEtapa = (etapaId: string) => {
    const ocultas = config.etapasOcultadas || [];
    const jaOculta = ocultas.includes(etapaId);
    const updated = jaOculta
      ? ocultas.filter((id) => id !== etapaId)
      : [...ocultas, etapaId];

    setConfig((prev) => ({
      ...prev,
      etapasOcultadas: updated,
    }));
  };

  const handleDiasSugeridosChange = (etapaId: string, dias: number) => {
    const diasMap = { ...(config.diasMaximosSugeridosPorEtapa || {}) };
    diasMap[etapaId] = Math.max(1, Math.min(60, dias || 1));
    setConfig((prev) => ({
      ...prev,
      diasMaximosSugeridosPorEtapa: diasMap,
    }));
  };

  const handleSave = () => {
    storageService.saveConfigGargalos(config);
    setSaveSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = async () => {
    const confirmed = await showConfirm('Deseja restaurar as configurações padrão de controle de gargalos?', {
      title: 'Restaurar Padrões',
      type: 'warning',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      setConfig(defaultConfigGargalos);
      storageService.saveConfigGargalos(defaultConfigGargalos);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Simulação de cálculo em tempo real com base nas obras atuais
  const activeObras = obras.filter((o) => o.statusObra !== 'CONCLUIDA' && o.statusObra !== 'CANCELADA');
  const etapasVisiveis = etapas.filter((e) => !(config.etapasOcultadas || []).includes(e.id));

  const rankingSimulado = etapasVisiveis
    .map((etapa) => {
      let parados = 0;
      let emAndamento = 0;
      activeObras.forEach((o) => {
        const st = o.fluxoEtapas?.[etapa.id];
        if (st === 'PARADO') parados++;
        if (st === 'EM ANDAMENTO') emAndamento++;
      });
      const totalGargalo = parados * (config.pesoParado || 2) + emAndamento * (config.pesoAndamento || 1);
      return {
        etapa,
        parados,
        emAndamento,
        totalGargalo,
        isCritico: parados >= (config.limiteCriticoParadas || 1),
        isAtencao: emAndamento >= (config.limiteAtencaoAndamento || 3) && parados < (config.limiteCriticoParadas || 1),
      };
    })
    .filter((item) => {
      if (config.mostrarApenasGargalosAtivos) {
        return item.parados > 0 || item.emAndamento > 0;
      }
      return true;
    })
    .sort((a, b) => b.totalGargalo - a.totalGargalo);

  const finalSimulado =
    config.limiteMaximoExibicao > 0
      ? rankingSimulado.slice(0, config.limiteMaximoExibicao)
      : rankingSimulado;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Controle de Gargalos no Dashboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Defina quais etapas são monitoradas no painel principal, regras de criticidade, pesos de pontuação e prazos sugeridos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Restaurar valores de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Padrão</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Regras'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Configurações de gargalo atualizadas! O Dashboard refletirá imediatamente essas regras.</span>
        </div>
      )}

      {/* Grid de Parâmetros de Cálculo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Limite Crítico Paradas */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Gargalo Crítico
            </span>
            <span className="text-xs px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded font-bold">
              ≥ {config.limiteCriticoParadas} obras
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Qtd. mínima de obras com status <strong>PARADO</strong> para disparar alerta vermelho no Dashboard.
          </p>
          <input
            type="number"
            min={1}
            max={20}
            value={config.limiteCriticoParadas}
            onChange={(e) =>
              setConfig((p) => ({ ...p, limiteCriticoParadas: Math.max(1, parseInt(e.target.value) || 1) }))
            }
            className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        {/* Limite Atenção Andamento */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              Fluxo Intenso
            </span>
            <span className="text-xs px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded font-bold">
              ≥ {config.limiteAtencaoAndamento} obras
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Qtd. de obras <strong>EM ANDAMENTO</strong> simultâneo para alerta de fluxo intenso (amarelo).
          </p>
          <input
            type="number"
            min={1}
            max={50}
            value={config.limiteAtencaoAndamento}
            onChange={(e) =>
              setConfig((p) => ({ ...p, limiteAtencaoAndamento: Math.max(1, parseInt(e.target.value) || 1) }))
            }
            className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        {/* Peso Gravidade: Parado */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              Peso (Parado)
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold">
              {config.pesoParado}x
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Multiplicador de gravidade no ranking para cada obra parada na etapa.
          </p>
          <select
            value={config.pesoParado}
            onChange={(e) => setConfig((p) => ({ ...p, pesoParado: parseInt(e.target.value) || 2 }))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value={1}>1x (Peso normal)</option>
            <option value={2}>2x (Recomendado - 2x mais grave)</option>
            <option value={3}>3x (Alta gravidade)</option>
            <option value={5}>5x (Gravidade Extrema)</option>
          </select>
        </div>

        {/* Opções de Exibição */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Limite no Card
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold">
              {config.limiteMaximoExibicao === 0 ? 'Todas' : `Top ${config.limiteMaximoExibicao}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Quantas etapas com maior gargalo exibir no widget do Dashboard.
          </p>
          <select
            value={config.limiteMaximoExibicao}
            onChange={(e) => setConfig((p) => ({ ...p, limiteMaximoExibicao: parseInt(e.target.value) || 0 }))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value={0}>Exibir Todas as Etapas</option>
            <option value={3}>Top 3 Maiores Gargalos</option>
            <option value={5}>Top 5 Maiores Gargalos</option>
            <option value={7}>Top 7 Maiores Gargalos</option>
          </select>
        </div>
      </div>

      {/* Toggle Filtro: Mostrar apenas gargalos ativos */}
      <div className="flex items-center justify-between p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl">
        <div className="flex items-center space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ocultar etapas zeradas (sem nenhuma obra parada ou em andamento)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Se ativado, apenas etapas com atividade real serão listadas no ranking do Dashboard.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfig((p) => ({ ...p, mostrarApenasGargalosAtivos: !p.mostrarApenasGargalosAtivos }))}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            config.mostrarApenasGargalosAtivos
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {config.mostrarApenasGargalosAtivos ? 'Ativado' : 'Desativado'}
        </button>
      </div>

      {/* Tabela de Etapas: Visibilidade e Tempo Sugerido */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Etapas Monitoradas no Dashboard & Prazos Sugeridos</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Desative etapas que não deseja monitorar no Dashboard e informe a meta de dias úteis esperada para cada processo.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {etapasVisiveis.length} de {etapas.length} etapas visíveis
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5">Ordem</th>
                <th className="px-4 py-2.5">Nome da Etapa</th>
                <th className="px-4 py-2.5 text-center">Exibir no Dashboard</th>
                <th className="px-4 py-2.5 text-center">Meta Padrão (Dias Úteis)</th>
                <th className="px-4 py-2.5 text-right">Obras Atuais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {etapas.map((etapa, idx) => {
                const isOculta = (config.etapasOcultadas || []).includes(etapa.id);
                const diasSugeridos = config.diasMaximosSugeridosPorEtapa?.[etapa.id] || 3;
                
                // Obras nesta etapa
                let pCount = 0;
                let aCount = 0;
                activeObras.forEach((o) => {
                  const st = o.fluxoEtapas?.[etapa.id];
                  if (st === 'PARADO') pCount++;
                  if (st === 'EM ANDAMENTO') aCount++;
                });

                return (
                  <tr
                    key={etapa.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      isOculta ? 'opacity-50 bg-slate-50/50 dark:bg-slate-900/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}º</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span>{etapa.nome}</span>
                        {isOculta && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full font-bold">
                            Ocultada no Dashboard
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleOcultarEtapa(etapa.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1 ${
                          !isOculta
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                        }`}
                      >
                        {!isOculta ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Visível</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Oculta</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={diasSugeridos}
                          onChange={(e) => handleDiasSugeridosChange(etapa.id, parseInt(e.target.value))}
                          disabled={isOculta}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center text-slate-900 dark:text-white disabled:opacity-40"
                        />
                        <span className="text-[11px] text-slate-400">dias</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {pCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded">
                            {pCount} parados
                          </span>
                        )}
                        {aCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                            {aCount} andamento
                          </span>
                        )}
                        {pCount === 0 && aCount === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded">
                            Livre
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulador / Prévia do Dashboard em Tempo Real */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Prévia do Card de Gargalos no Dashboard</span>
          </h4>
          <span className="text-[11px] font-bold text-slate-500">
            {finalSimulado.length} etapa(s) exibida(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {finalSimulado.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              Nenhuma etapa qualificada para exibição com os filtros atuais.
            </div>
          ) : (
            finalSimulado.map((item, idx) => (
              <div
                key={item.etapa.id}
                className={`p-3 rounded-xl border transition ${
                  item.isCritico
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                    : item.isAtencao
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                    #{idx + 1} {item.etapa.nome}
                  </span>
                  {item.isCritico ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                      Gargalo Crítico
                    </span>
                  ) : item.isAtencao ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                      Fluxo Intenso
                    </span>
                  ) : item.parados > 0 || item.emAndamento > 0 ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                      Fluxo Ativo
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      Livre
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {item.parados} Parado(s)
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {item.emAndamento} Em Andamento
                  </span>
                  <span className="text-slate-500 font-bold">
                    Score: {item.totalGargalo}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
