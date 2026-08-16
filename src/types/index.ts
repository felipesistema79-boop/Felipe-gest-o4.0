export type StatusEtapa = 'NÃO INICIADO' | 'EM ANDAMENTO' | 'EXECUTADO' | 'PARADO';

export type StatusGlobalObra = 'NÃO AGENDADA' | 'AGENDADA' | 'ENTREGUE' | 'PENDENCIA' | 'FINALIZADA';

export type PrioridadeObra = 'NORMAL' | 'ALTA' | 'URGENTE';

export type StatusCompra = 'EM COTAÇÃO' | 'APROVADO' | 'ENTREGUE' | 'ATRASADO';

export interface EtapaFluxoConfig {
  id: string;
  nome: string;
  ordem: number;
}

export interface StatusEtapaObra {
  etapaId: string;
  status: StatusEtapa;
  observacao?: string;
  dataAtualizacao?: string;
}

export interface Obra {
  id: string;
  codigo: string;
  cliente: string;
  vendedorId?: string;
  vendedorNome?: string;
  segmento?: string; // legado
  prioridade: PrioridadeObra;
  quantidade: number;
  cor: string;
  dataInicial: string; // YYYY-MM-DD
  prazoDiasUteis: number;
  dataPrevistaEntrega: string; // YYYY-MM-DD (calculated)
  dataAgendada?: string; // YYYY-MM-DD
  statusGlobal: StatusGlobalObra;
  observacoes?: string;
  valorEstimado?: number;
  fluxoEtapas: Record<string, StatusEtapa>; // etapaId -> StatusEtapa
  arquivada: boolean;
  dataCriacao: string;
  dataFinalizacao?: string;
}

export interface Vendedor {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nome?: string; // alias para razaoSocial/nomeFantasia
  nomeFantasia?: string;
  cnpj: string;
  contato?: string;
  telefone: string;
  email: string;
  prazoEntregaPadraoDiasUteis: number;
  materialEscopo: string;
}

export interface Compra {
  id: string;
  codigoPedido: string;
  fornecedorId: string;
  fornecedorNome: string;
  material: string;
  dataEnviada: string; // YYYY-MM-DD
  prazoDiasUteis: number;
  dataAprovacao?: string; // YYYY-MM-DD
  dataEntregaPrevista: string; // YYYY-MM-DD
  status: StatusCompra;
  valorTotal?: number;
  observacao?: string;
  requisicaoId?: string;
}

export interface ItemRequisicao {
  id: string;
  codigo: string;
  cor: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  conferido?: boolean;
  quantidadeRecebida?: number; // Quantidade de barras/unidades que efetivamente chegaram
  quantidadeOriginal?: number; // Quantidade original antes do ajuste de cotação
  editado?: boolean; // Sinalizador visual indicando que a linha foi editada
  dataEdicao?: string; // Data/hora em que a linha foi modificada
  motivoEdicao?: string; // Ex: "Ajuste de cotação / Redução de custo"
}

export interface RegistroEntregaParcial {
  id: string;
  dataRecebimento: string; // YYYY-MM-DD ou data/hora
  numeroNotaFiscal: string; // Ex: NF-e 10423
  quantidadeItensRecebidos?: number;
  observacao: string;
  registradoPor?: string;
}

export interface RequisicaoMaterial {
  id: string;
  codigo: string; // Ex: FORNECEDORABC13DEAGOSTODE2026
  fornecedorId: string;
  fornecedorNome: string;
  obraId?: string;
  obraNome?: string;
  clienteEstoque?: 'CLIENTE' | 'ESTOQUE' | 'OBRA_DIRETA';
  dataCriacao: string; // YYYY-MM-DD
  dataCriacaoExtenso: string;
  observacoes?: string;
  observacaoConferencia?: string;
  registrosEntregas?: RegistroEntregaParcial[];
  itens: ItemRequisicao[];
  status: 'RASCUNHO' | 'GERADO_COMPRA' | 'CONFERIDO';
}

export interface EmpresaConfig {
  nomeEmpresa: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  responsavel: string;
  endereco: string;
  logoBase64: string | null;
  corTemaHex: string;
}

export interface SegmentoEmpresa {
  id: string;
  nome: string;
  descricao?: string;
  fluxoEtapas?: EtapaFluxoConfig[];
}

// Module 7: Decision tools
export interface PDCAItem {
  id: string;
  titulo: string;
  plan: string;
  do: string;
  check: string;
  act: string;
  obraId?: string;
  status: 'EM ANDAMENTO' | 'CONCLUÍDO';
  dataCriacao: string;
}

export interface EisenhowerItem {
  id: string;
  titulo: string;
  descricao: string;
  urgente: boolean;
  importante: boolean;
  obraId?: string;
  dataCriacao?: string;
}

export interface GUTItem {
  id: string;
  problema: string;
  gravidade: number; // 1 to 5
  urgencia: number;  // 1 to 5
  tendencia: number; // 1 to 5
  // score = G * U * T
  obraId?: string;
  acaoProposta: string;
  responsavel: string;
  dataCriacao?: string;
}

export interface FiveWTwoHItem {
  id: string;
  what: string;      // O que será feito
  why: string;       // Por que será feito
  where: string;     // Onde será feito
  when: string;      // Quando será feito
  who: string;       // Quem fará
  how: string;       // Como será feito
  howMuch: string;   // Quanto custará
  status: 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDO';
  dataCriacao: string;
  obraId?: string;
}

export interface BrainstormingIdea {
  id: string;
  topico: string;
  ideia: string;
  autor: string;
  votos: number;
  status: 'RASCUNHO' | 'SELECIONADA' | 'APROVADA' | 'DESCARTADA';
  dataCriacao: string;
}

export interface DecisaoAprendizado {
  id: string;
  origemTipo: 'PDCA' | 'EISENHOWER' | 'GUT' | '5W2H' | 'BRAINSTORMING' | 'DIAGNOSTICO_FABRICA' | 'DIRETO' | string;
  origemId?: string;
  tituloProblema: string;
  solucaoAplicada: string;
  resultadoObtido: string; // Ex: "Reduziu atraso em 5 dias e eliminou retrabalho"
  avaliacaoEficacia: 'ALTAMENTE_EFICAZ' | 'MUITO_BOM' | 'PARCIALMENTE_EFICAZ' | 'INEFICAZ';
  categoria?: string;
  impactoDiasEconomizados?: number;
  dataRegistro: string;
  autor?: string;
  tags?: string[];
}

export interface GoogleTaskItem {
  id: string;
  titulo: string;
  detalhes?: string;
  dataLimite?: string; // YYYY-MM-DD
  concluida: boolean;
  prioridade?: 'NORMAL' | 'ALTA' | 'URGENTE';
  origemTipo?: 'OBRA' | 'COMPRA' | 'GERAL' | 'MANUAL';
  origemId?: string;
  dataCriacao: string;
  alertaAtivo?: boolean;
}

// Module 7.1: Registro Rápido (Quick Log)
export type TipoRegistroRapido = 'PROBLEMA' | 'IDEIA' | 'OPORTUNIDADE' | 'RISCO';
export type RegistroRapidoTipo = TipoRegistroRapido;

export type CategoriaRegistroRapido = 'QUALIDADE' | 'PRODUCAO' | 'ESTOQUE' | 'SEGURANCA' | 'PESSOAS';
export type RegistroRapidoCategoria = CategoriaRegistroRapido;

export type StatusRegistroRapido = 'PENDENTE' | 'EM_ANALISE' | 'CONVERTIDO' | 'CONCLUIDO';
export type RegistroRapidoStatus = StatusRegistroRapido;

export interface RegistroRapidoItem {
  id: string;
  tipo: TipoRegistroRapido;
  descricaoCurta: string;
  descricao?: string;
  categoria: CategoriaRegistroRapido;
  tags: string[];
  dataCriacao: string;
  status: StatusRegistroRapido;
  responsavel?: string;
  convertidoPara?: {
    tipo: 'PDCA' | 'GUT' | '5W2H' | 'BRAINSTORMING' | 'EISENHOWER';
    id: string;
  };
  convertidoEm?: string;
}

// Module 8.1: Configuração do Controle de Gargalos no Dashboard
export interface ConfigGargalosDashboard {
  etapasOcultadas?: string[]; // IDs de etapas que não devem aparecer no widget de gargalos do dashboard
  limiteCriticoParadas: number; // Mínimo de obras paradas para considerar Gargalo Crítico (padrão: 1)
  limiteAtencaoAndamento: number; // Mínimo de obras em andamento para alerta de fluxo intenso (padrão: 3)
  pesoParado: number; // Peso para obras paradas no score de gargalo (padrão: 2)
  pesoAndamento: number; // Peso para obras em andamento no score de gargalo (padrão: 1)
  mostrarApenasGargalosAtivos: boolean; // Se true, esconde etapas com 0 parados e 0 em andamento
  limiteMaximoExibicao: number; // Quantidade de etapas exibidas no ranking (ex: 5 ou 0 para todas)
  diasMaximosSugeridosPorEtapa?: Record<string, number>; // tempo máximo em dias úteis por etapa
}

export interface GargaloConfig {
  id: string;
  nome: string;
  setor: string;
  impacto: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  ativo: boolean;
}

export interface OrdemManutencao {
  id: string;
  tipo: 'INTERNA' | 'EXTERNA';
  categoria: 'MAQUINA' | 'FERRAMENTA' | 'PREDIO/EMPRESA' | 'PRODUTO' | 'SERVICO' | 'OUTROS';
  titulo: string;
  descricao: string;
  status: 'ABERTA' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataAbertura: string; // YYYY-MM-DD
  dataPrevisao?: string; // YYYY-MM-DD
  dataConclusao?: string; // YYYY-MM-DD
  responsavel?: string;
  custoEstimado?: number;
  observacoes?: string;
}




