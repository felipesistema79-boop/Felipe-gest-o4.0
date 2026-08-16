import {
  Obra,
  Vendedor,
  Fornecedor,
  Compra,
  RequisicaoMaterial,
  EmpresaConfig,
  EtapaFluxoConfig,
  SegmentoEmpresa,
  PDCAItem,
  EisenhowerItem,
  GUTItem,
  FiveWTwoHItem,
  BrainstormingIdea,
  GoogleTaskItem,
  DecisaoAprendizado,
  RegistroRapidoItem,
  ConfigGargalosDashboard,
  GargaloConfig,
  OrdemManutencao
} from '../types';

import { addBusinessDays, generateRequisicaoCodigo } from '../utils/dateUtils';
import {
  db,
  COLLECTIONS,
  saveDocument,
  deleteDocument,
  deleteDocumentsBatch,
  clearCollection,
  saveEmpresaDoc,
  saveCollectionBatch,
  setCloudSyncStatus,
  CloudSyncStatus
} from './firebase';
import { collection, onSnapshot, doc, getDocs, setDoc } from 'firebase/firestore';

export const STORAGE_KEYS = {
  EMPRESA: 'sgm_empresa_config',
  ETAPAS: 'sgm_etapas_fluxo',
  SEGMENTOS: 'sgm_segmentos',
  VENDEDORES: 'sgm_vendedores',
  FORNECEDORES: 'sgm_fornecedores',
  OBRAS: 'sgm_obras',
  COMPRAS: 'sgm_compras',
  REQUISICOES: 'sgm_requisicoes',
  PDCA: 'sgm_pdca',
  EISENHOWER: 'sgm_eisenhower',
  GUT: 'sgm_gut',
  FIVE_W_TWO_H: 'sgm_five_w_two_h',
  BRAINSTORMING: 'sgm_brainstorming',
  GOOGLE_TASKS: 'sgm_google_tasks',
  APRENDIZADOS: 'sgm_decisoes_aprendizados',
  GARGALOS: 'sgm_gargalos',
  REGISTROS_RAPIDOS: 'sgm_registros_rapidos',
  CONFIG_GARGALOS: 'sgm_config_gargalos',
  MANUTENCOES: 'sgm_manutencoes',
  DISMISSED_ALERTS: 'sgm_dismissed_alerts',
};

// Initial default configuration
export const defaultEmpresa: EmpresaConfig = {
  nomeEmpresa: 'CABRAL ESQUADRIAS & FACHADAS LTDA',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 3456-7890',
  whatsapp: '(11) 98765-4321',
  email: 'contato@cabralesquadrias.com.br',
  responsavel: 'Eng. Ricardo Cabral',
  endereco: 'Av. Industrial, 1500 - Galpão 04, São Paulo - SP',
  logoBase64: null,
  corTemaHex: '#EA580C', // Orange Brand Theme
};

export const defaultEtapas: EtapaFluxoConfig[] = [
  { id: 'etapa-1', nome: 'Projeto & Medição', ordem: 1 },
  { id: 'etapa-2', nome: 'Corte de Perfis', ordem: 2 },
  { id: 'etapa-3', nome: 'Usinagem & Furação', ordem: 3 },
  { id: 'etapa-4', nome: 'Montagem Quadro', ordem: 4 },
  { id: 'etapa-5', nome: 'Colocação Vidro/Acess.', ordem: 5 },
  { id: 'etapa-6', nome: 'Inspeção & Expedição', ordem: 6 },
  { id: 'etapa-7', nome: 'Instalação Obra', ordem: 7 },
];

export const defaultSegmentos: SegmentoEmpresa[] = [
  {
    id: 'seg-1',
    nome: 'Esquadrias de Alumínio',
    descricao: 'Janelas, portas, integradas, maxim-ar e perfis de alumínio',
    fluxoEtapas: [
      { id: 'etapa-alu-1', nome: 'Projeto & Medição Final', ordem: 1 },
      { id: 'etapa-alu-2', nome: 'Corte de Perfis de Alumínio', ordem: 2 },
      { id: 'etapa-alu-3', nome: 'Usinagem & Furação / Estampos', ordem: 3 },
      { id: 'etapa-alu-4', nome: 'Montagem dos Quadros', ordem: 4 },
      { id: 'etapa-alu-5', nome: 'Colocação de Vidro & Acessórios', ordem: 5 },
      { id: 'etapa-alu-6', nome: 'Inspeção & Expedição', ordem: 6 },
      { id: 'etapa-alu-7', nome: 'Instalação na Obra', ordem: 7 },
    ],
  },
  {
    id: 'seg-pvc',
    nome: 'PVC',
    descricao: 'Esquadrias termoacústicas de PVC soldadas por termofusão',
    fluxoEtapas: [
      { id: 'etapa-pvc-1', nome: 'Medição & Projeto Técnico PVC', ordem: 1 },
      { id: 'etapa-pvc-2', nome: 'Corte dos Perfis PVC', ordem: 2 },
      { id: 'etapa-pvc-3', nome: 'Colocação do Reforço de Aço', ordem: 3 },
      { id: 'etapa-pvc-4', nome: 'Solda das Esquadrias (Termofusão)', ordem: 4 },
      { id: 'etapa-pvc-5', nome: 'Limpeza dos Cordões de Solda', ordem: 5 },
      { id: 'etapa-pvc-6', nome: 'Montagem de Acessórios & Borrachas', ordem: 6 },
      { id: 'etapa-pvc-7', nome: 'Envidraçamento & Baguetes', ordem: 7 },
      { id: 'etapa-pvc-8', nome: 'Inspeção de Qualidade & Expedição', ordem: 8 },
      { id: 'etapa-pvc-9', nome: 'Instalação na Obra', ordem: 9 },
    ],
  },
  {
    id: 'seg-2',
    nome: 'Vidros Temperados & Laminados',
    descricao: 'Box, portas de vidro, guarda-corpos e divisórias',
    fluxoEtapas: [
      { id: 'etapa-vid-1', nome: 'Medição de Vãos & Gabaritos', ordem: 1 },
      { id: 'etapa-vid-2', nome: 'Corte, Lapidação & Têmpera', ordem: 2 },
      { id: 'etapa-vid-3', nome: 'Conferência de Furações & Espessuras', ordem: 3 },
      { id: 'etapa-vid-4', nome: 'Montagem dos Perfis & Ferragens', ordem: 4 },
      { id: 'etapa-vid-5', nome: 'Inspeção de Segurança & Embalagem', ordem: 5 },
      { id: 'etapa-vid-6', nome: 'Instalação & Calafetação na Obra', ordem: 6 },
    ],
  },
  {
    id: 'seg-3',
    nome: 'Fachada Glazing / Pele de Vidro',
    descricao: 'Fachadas cortina tipo Structural Glazing e Spider Glass',
    fluxoEtapas: [
      { id: 'etapa-gla-1', nome: 'Cálculo Estrutural de Vento & Projeto', ordem: 1 },
      { id: 'etapa-gla-2', nome: 'Corte & Usinagem de Colunas e Travessas', ordem: 2 },
      { id: 'etapa-gla-3', nome: 'Montagem dos Quadros de Alumínio', ordem: 3 },
      { id: 'etapa-gla-4', nome: 'Colagem de Vidros com Silicone Estrutural', ordem: 4 },
      { id: 'etapa-gla-5', nome: 'Cura do Silicone em Ambiente Climatizado', ordem: 5 },
      { id: 'etapa-gla-6', nome: 'Teste de Aderência & Inspeção Final', ordem: 6 },
      { id: 'etapa-gla-7', nome: 'Içamento & Instalação em Altura', ordem: 7 },
    ],
  },
];

export const defaultVendedores: Vendedor[] = [
  { id: 'vend-1', nome: 'Carlos Eduardo Silva', email: 'carlos.vendas@cabral.com.br', telefone: '(11) 99111-2233', ativo: true },
  { id: 'vend-2', nome: 'Mariana Mendes Prado', email: 'mariana.mendes@cabral.com.br', telefone: '(11) 98222-3344', ativo: true },
  { id: 'vend-3', nome: 'Roberto Santos', email: 'roberto.santos@cabral.com.br', telefone: '(11) 97333-4455', ativo: true },
  { id: 'vend-4', nome: 'Juliana Castro', email: 'juliana.castro@cabral.com.br', telefone: '(11) 96444-5566', ativo: true },
];

export const defaultFornecedores: Fornecedor[] = [
  {
    id: 'forn-1',
    razaoSocial: 'Alumasa Extrusão de Alumínio S/A',
    cnpj: '01.234.567/0001-89',
    telefone: '(11) 4004-1234',
    email: 'comercial@alumasa.com.br',
    prazoEntregaPadraoDiasUteis: 10,
    materialEscopo: 'Perfis de Alumínio Linha Suprema, Gold e Fachada',
    contato: 'Marcos Rezende',
  },
  {
    id: 'forn-2',
    razaoSocial: 'GlassTemper Indústria de Vidros',
    cnpj: '02.345.678/0001-90',
    telefone: '(11) 4111-5555',
    email: 'pedidos@glasstemper.com.br',
    prazoEntregaPadraoDiasUteis: 7,
    materialEscopo: 'Vidros Laminados 8mm/10mm e Temperados Incolores/Refletivos',
    contato: 'Patrícia Rocha',
  },
  {
    id: 'forn-3',
    razaoSocial: 'Roto Fermax Acessórios para Esquadrias',
    cnpj: '03.456.789/0001-01',
    telefone: '(11) 3222-8888',
    email: 'vendas@rotofermax.com.br',
    prazoEntregaPadraoDiasUteis: 5,
    materialEscopo: 'Fechaduras, Roldanas Blindadas, Cremonas e Braços Maxim-ar',
    contato: 'Eduardo Guimarães',
  },
];

export const defaultObras: Obra[] = [
  {
    id: 'obra-101',
    codigo: 'OBR-2026-001',
    cliente: 'Residencial Alphaville - Casa 42 (Dr. Fernando)',
    vendedorId: 'vend-1',
    vendedorNome: 'Carlos Eduardo Silva',
    segmento: 'Esquadrias de Alumínio',
    prioridade: 'URGENTE',
    quantidade: 14,
    cor: 'Preto Anodizado (Anolok)',
    dataInicial: '2026-08-01',
    prazoDiasUteis: 15,
    dataPrevistaEntrega: addBusinessDays('2026-08-01', 15),
    dataAgendada: '2026-08-22',
    statusGlobal: 'AGENDADA',
    observacoes: 'Obra com vidros duplo insulado. Requer andaime de 6 metros para fachada.',
    valorEstimado: 85000,
    fluxoEtapas: {
      'etapa-1': 'EXECUTADO',
      'etapa-2': 'EXECUTADO',
      'etapa-3': 'EM ANDAMENTO',
      'etapa-4': 'NÃO INICIADO',
      'etapa-5': 'NÃO INICIADO',
      'etapa-6': 'NÃO INICIADO',
      'etapa-7': 'NÃO INICIADO',
    },
    arquivada: false,
    dataCriacao: '2026-08-01',
  },
  {
    id: 'obra-102',
    codigo: 'OBR-2026-002',
    cliente: 'Edifício Horizon Tower - Cobertura B',
    vendedorId: 'vend-2',
    vendedorNome: 'Mariana Mendes Prado',
    segmento: 'Fachada Glazing / Pele de Vidro',
    prioridade: 'ALTA',
    quantidade: 28,
    cor: 'Branco Brilho (RAL 9003)',
    dataInicial: '2026-07-15',
    prazoDiasUteis: 20,
    dataPrevistaEntrega: addBusinessDays('2026-07-15', 20),
    dataAgendada: '2026-08-12',
    statusGlobal: 'PENDENCIA',
    observacoes: 'Aguardando liberação do fornecedor de vidros refletivos prata.',
    valorEstimado: 142000,
    fluxoEtapas: {
      'etapa-1': 'EXECUTADO',
      'etapa-2': 'EXECUTADO',
      'etapa-3': 'PARADO',
      'etapa-4': 'PARADO',
      'etapa-5': 'NÃO INICIADO',
      'etapa-6': 'NÃO INICIADO',
      'etapa-7': 'NÃO INICIADO',
    },
    arquivada: false,
    dataCriacao: '2026-07-15',
  },
  {
    id: 'obra-103',
    codigo: 'OBR-2026-003',
    cliente: 'Comercial Jardins - Loja Conceito Nike',
    vendedorId: 'vend-1',
    vendedorNome: 'Carlos Eduardo Silva',
    segmento: 'Vidros Temperados & Laminados',
    prioridade: 'NORMAL',
    quantidade: 8,
    cor: 'Inox Polido / Incolor',
    dataInicial: '2026-07-01',
    prazoDiasUteis: 12,
    dataPrevistaEntrega: addBusinessDays('2026-07-01', 12),
    dataAgendada: '2026-07-18',
    statusGlobal: 'ENTREGUE',
    observacoes: 'Instalação concluída com aprovação do arquiteto responsável.',
    valorEstimado: 38000,
    fluxoEtapas: {
      'etapa-1': 'EXECUTADO',
      'etapa-2': 'EXECUTADO',
      'etapa-3': 'EXECUTADO',
      'etapa-4': 'EXECUTADO',
      'etapa-5': 'EXECUTADO',
      'etapa-6': 'EXECUTADO',
      'etapa-7': 'EXECUTADO',
    },
    arquivada: false,
    dataCriacao: '2026-07-01',
  },
  {
    id: 'obra-104',
    codigo: 'OBR-2026-004',
    cliente: 'Residencial Quinta da Baroneza - Villa 12',
    vendedorId: 'vend-3',
    vendedorNome: 'Roberto Santos',
    segmento: 'Esquadrias de Alumínio',
    prioridade: 'NORMAL',
    quantidade: 22,
    cor: 'Amadeirado Nogueira',
    dataInicial: '2026-06-10',
    prazoDiasUteis: 25,
    dataPrevistaEntrega: addBusinessDays('2026-06-10', 25),
    dataAgendada: '2026-07-15',
    statusGlobal: 'FINALIZADA',
    observacoes: 'Obra 100% quitada e termo de garantia entregue ao cliente.',
    valorEstimado: 195000,
    fluxoEtapas: {
      'etapa-1': 'EXECUTADO',
      'etapa-2': 'EXECUTADO',
      'etapa-3': 'EXECUTADO',
      'etapa-4': 'EXECUTADO',
      'etapa-5': 'EXECUTADO',
      'etapa-6': 'EXECUTADO',
      'etapa-7': 'EXECUTADO',
    },
    arquivada: false,
    dataCriacao: '2026-06-10',
  },
];

export const defaultCompras: Compra[] = [
  {
    id: 'compra-1',
    codigoPedido: 'PED-ALU-089',
    fornecedorId: 'forn-1',
    fornecedorNome: 'Alumasa Extrusão de Alumínio S/A',
    material: 'Perfis Linha Gold e Suprema Preto Anodizado',
    dataEnviada: '2026-08-02',
    prazoDiasUteis: 10,
    dataEntregaPrevista: addBusinessDays('2026-08-02', 10),
    dataAprovacao: '2026-08-02',
    status: 'ENTREGUE',
    valorTotal: 24500,
    observacao: 'Recebido completo no galpão sem avarias',
  },
  {
    id: 'compra-2',
    codigoPedido: 'PED-VID-204',
    fornecedorId: 'forn-2',
    fornecedorNome: 'GlassTemper Indústria de Vidros',
    material: 'Vidros laminados 8mm refletivo prata para Glazing',
    dataEnviada: '2026-07-20',
    prazoDiasUteis: 7,
    dataEntregaPrevista: addBusinessDays('2026-07-20', 7),
    dataAprovacao: '2026-07-20',
    status: 'ATRASADO',
    valorTotal: 48000,
    observacao: 'Fornecedor reportou quebra na têmpera; nova data prometida',
  },
  {
    id: 'compra-3',
    codigoPedido: 'PED-ACE-551',
    fornecedorId: 'forn-3',
    fornecedorNome: 'Roto Fermax Acessórios para Esquadrias',
    material: 'Roldanas quádruplas blindadas e fechos concha cremona',
    dataEnviada: '2026-08-05',
    prazoDiasUteis: 5,
    dataEntregaPrevista: addBusinessDays('2026-08-05', 5),
    dataAprovacao: '2026-08-05',
    status: 'APROVADO',
    valorTotal: 8300,
    observacao: 'Mercadoria despachada via transportadora JadLog',
  },
];

export const defaultRequisicoes: RequisicaoMaterial[] = [
  {
    id: 'req-1',
    codigo: generateRequisicaoCodigo('Alumasa Extrusão de Alumínio S/A', '2026-08-02'),
    fornecedorId: 'forn-1',
    fornecedorNome: 'Alumasa Extrusão de Alumínio S/A',
    obraId: 'obra-101',
    obraNome: 'Residencial Alphaville - Casa 42 (Dr. Fernando)',
    clienteEstoque: 'CLIENTE',
    dataCriacao: '2026-08-02',
    dataCriacaoExtenso: '02 de Agosto de 2026',
    observacoes: 'Requisição completa da fase de corte e montagem.',
    status: 'GERADO_COMPRA',
    itens: [
      {
        id: 'item-1',
        codigo: 'G-001',
        descricao: 'Perfil Marco Superior Linha Gold (G-001)',
        cor: 'Preto Anodizado Anolok',
        quantidade: 6,
        unidade: 'BARRA',
        conferido: true,
        quantidadeRecebida: 6,
      },
      {
        id: 'item-2',
        codigo: 'VID-02',
        descricao: 'Vidro Duplo Insulado 4+12+4mm Incolor',
        cor: 'Incolor',
        quantidade: 32.5,
        unidade: 'M²',
        conferido: false,
        quantidadeRecebida: 0,
      },
      {
        id: 'item-3',
        codigo: 'ACE-16',
        descricao: 'Roldana Quádrupla Blindada Inox 120kg',
        cor: 'Inox 304',
        quantidade: 16,
        unidade: 'UN',
        conferido: true,
        quantidadeRecebida: 16,
      },
    ],
  },
];

export const defaultPDCA: PDCAItem[] = [
  {
    id: 'pdca-1',
    titulo: 'Treinamento de Usinagem dos Estampos Linha Gold',
    plan: 'Identificar as principais falhas de corte e folgas nos estampos.',
    do: 'Capacitar os 3 novos operadores na regulagem milimétrica das matrizes.',
    check: 'Medir rebarbas e tolerância dimensional dos primeiros 50 quadros.',
    act: 'Padronizar folha de instrução de trabalho fixada na bancada.',
    status: 'EM ANDAMENTO',
    dataCriacao: '2026-08-01',
  },
  {
    id: 'pdca-2',
    titulo: 'Revisão de Fornecedores de Silicone Estrutural',
    plan: 'Cotar tubos de silicone estrutural com 3 importadores certificados.',
    do: 'Solicitar amostras para ensaios de adesão em perfis pintados.',
    check: 'Aguardar laudo do laboratório sobre tempo de cura e elasticidade.',
    act: 'Homologar o fornecedor vencedor no cadastro de parceiros do ERP.',
    status: 'EM ANDAMENTO',
    dataCriacao: '2026-08-04',
  },
  {
    id: 'pdca-3',
    titulo: 'Padronização do Checklist de Expedição e Embalagem',
    plan: 'Mapear avarias relatadas durante o transporte de caixilhos.',
    do: 'Implantar proteção com cantoneiras de papelão e plástico bolha duplo.',
    check: 'Conferir índice de avarias nas 10 próximas entregas em obras.',
    act: 'Tornar o checklist digital pré-requisito para liberação do caminhão.',
    status: 'CONCLUÍDO',
    dataCriacao: '2026-07-20',
  },
];

export const defaultEisenhower: EisenhowerItem[] = [
  {
    id: 'eisen-1',
    titulo: 'Aprovação urgente do lote de vidros da Cobertura B (OBR-102)',
    descricao: 'Liberar pedido complementar com fornecedor GlassTemper para não travar a equipe de montagem.',
    urgente: true,
    importante: true,
    dataCriacao: '2026-08-02',
  },
  {
    id: 'eisen-2',
    titulo: 'Calibração anual da serra de corte de duplo cabeçote',
    descricao: 'Agendar visita técnica preventiva do fabricante para aferição dos discos de videa.',
    urgente: false,
    importante: true,
    dataCriacao: '2026-08-03',
  },
  {
    id: 'eisen-3',
    titulo: 'Repor estoque de parafusos inox 4.2 x 38mm na estante 3',
    descricao: 'Emitir pedido de 10 caixas com o distribuidor local para entrega imediata.',
    urgente: true,
    importante: false,
    dataCriacao: '2026-08-04',
  },
  {
    id: 'eisen-4',
    titulo: 'Reunião de alinhamento redundante de sexta-feira',
    descricao: 'Substituir reuniões presenciais longas pelo quadro kanban e relatórios automáticos no sistema.',
    urgente: false,
    importante: false,
    dataCriacao: '2026-08-05',
  },
];

export const defaultGUT: GUTItem[] = [
  {
    id: 'gut-1',
    problema: 'Atraso na entrega de perfis com pintura eletrostática preta',
    gravidade: 5, // Dano alto
    urgencia: 4,  // Prazo apertado
    tendencia: 4, // Piora rápido
    acaoProposta: 'Diversificar homologação com a Alumasa e solicitar estoque de segurança de 30 barras.',
    responsavel: 'Mariana Mendes',
    dataCriacao: '2026-08-01',
  },
  {
    id: 'gut-2',
    problema: 'Falha na vedação de guarnição EPDM em esquadria de correr sob chuva forte',
    gravidade: 4,
    urgencia: 4,
    tendencia: 3,
    acaoProposta: 'Adotar borracha esponjosa dupla de maior densidade e calafetação com polímero MS nos cantos.',
    responsavel: 'Eng. Ricardo',
    dataCriacao: '2026-08-03',
  },
  {
    id: 'gut-3',
    problema: 'Ruído de vibração na linha de montagem durante horários de pico',
    gravidade: 2,
    urgencia: 2,
    tendencia: 2,
    acaoProposta: 'Instalar coxins de borracha anti-vibração sob as bancadas pneumáticas.',
    responsavel: 'Manutenção',
    dataCriacao: '2026-08-05',
  },
];

export const defaultFiveWTwoH: FiveWTwoHItem[] = [
  {
    id: '5w2h-1',
    what: 'Instalação de Sistema de Aspiração Central de Cavacos de Alumínio',
    why: 'Garantir limpeza imediata dos perfis usinados e segurança respiratória dos operadores da fábrica',
    where: 'Setor de Corte e Usinagem (Galpão Principal)',
    when: '2026-08-20 a 2026-08-30',
    who: 'Eng. Mecânico Roberto + Empresa Terceirizada CleanAir',
    how: 'Instalação de dutos flexíveis acoplados aos bocais das serras com exaustor ciclônico externo',
    howMuch: 'R$ 14.800,00',
    status: 'EM ANDAMENTO',
    dataCriacao: '2026-08-01',
  },
  {
    id: '5w2h-2',
    what: 'Migração do Controle de Estoque para Código de Barras / QR Code',
    why: 'Eliminar divergências entre compras físicas e requisições no sistema ERP',
    where: 'Almoxarifado Geral de Perfis e Acessórios',
    when: '2026-09-01 a 2026-09-15',
    who: 'Coordenação de TI + Almoxarife Chefe',
    how: 'Etiquetadoras térmicas Zebra integradas às etiquetas geradas pelo SGM ERP',
    howMuch: 'R$ 3.500,00',
    status: 'PENDENTE',
    dataCriacao: '2026-08-05',
  },
];

export const defaultBrainstorming: BrainstormingIdea[] = [
  {
    id: 'idea-1',
    topico: 'Otimização do Fluxo de Produção & Fábrica',
    ideia: 'Construir 4 carrinhos acolchoados em feltro para mover janelas montadas até a expedição sem risco de arranhões na pintura.',
    autor: 'Sebastião (Mestre de Fábrica)',
    votos: 14,
    status: 'APROVADA',
    dataCriacao: '2026-08-10',
  },
  {
    id: 'idea-2',
    topico: 'Vendas & Apresentação Comercial',
    ideia: 'Disponibilizar fotos de obras prontas e vídeos de abertura para os consultores comerciais apresentarem aos clientes em reuniões.',
    autor: 'Mariana Mendes (Comercial)',
    votos: 9,
    status: 'SELECIONADA',
    dataCriacao: '2026-08-11',
  },
  {
    id: 'idea-3',
    topico: 'Sustentabilidade & Resíduos',
    ideia: 'Fechar contrato com fundição credenciada com crédito automático na compra de tarugos e barras virgens.',
    autor: 'Juliana Castro',
    votos: 12,
    status: 'RASCUNHO',
    dataCriacao: '2026-08-12',
  },
];

export const defaultGoogleTasks: GoogleTaskItem[] = [
  {
    id: 'task-1',
    titulo: 'Conferir alinhamento dos contramarcos da Casa 42 (OBR-101)',
    detalhes: 'Cliente: Dr. Fernando | Obra: OBR-2026-001 | Responsável: Carlos Eduardo Silva',
    origemTipo: 'OBRA',
    origemId: 'obra-101',
    dataLimite: '2026-08-15',
    prioridade: 'ALTA',
    concluida: false,
    dataCriacao: '2026-08-01',
    alertaAtivo: true,
  },
  {
    id: 'task-2',
    titulo: 'Confirmar data de envio dos vidros laminados com GlassTemper',
    detalhes: 'Cliente: Edifício Horizon Tower | Compra: compra-2 | Responsável: Mariana Mendes',
    origemTipo: 'COMPRA',
    origemId: 'compra-2',
    dataLimite: '2026-08-14',
    prioridade: 'URGENTE',
    concluida: false,
    dataCriacao: '2026-08-05',
    alertaAtivo: true,
  },
  {
    id: 'task-3',
    titulo: 'Revisão periódica dos discos de corte da serra dupla',
    detalhes: 'Setor: Usinagem & Corte | Responsável: Encarregado Produção',
    origemTipo: 'GERAL',
    dataLimite: '2026-08-20',
    prioridade: 'NORMAL',
    concluida: true,
    dataCriacao: '2026-08-09',
    alertaAtivo: false,
  },
];

export const defaultAprendizados: DecisaoAprendizado[] = [
  {
    id: 'apr-1',
    origemTipo: 'PDCA',
    tituloProblema: 'Troca incorreta de perfis e perda de tempo na estação de montagem',
    solucaoAplicada: 'Etiquetagem individual com código de corte e lote na saída da serra de esquadria dupla.',
    resultadoObtido: 'Reduziu em 95% os erros de montagem e economizou 3 dias no cronograma global.',
    avaliacaoEficacia: 'ALTAMENTE_EFICAZ',
    categoria: 'CORTE',
    impactoDiasEconomizados: 3,
    dataRegistro: '2026-08-05',
    autor: 'Felipe Martinelli / Eng. Produção',
    tags: ['corte', 'etiquetas', 'perda_zero', 'montagem'],
  },
  {
    id: 'apr-2',
    origemTipo: 'GUT',
    tituloProblema: 'Atraso recorrente na entrega de vidros laminados e refletivos',
    solucaoAplicada: 'Contrato de fornecimento escalonado semanal com a GlassTemper com trava de 7 dias úteis.',
    resultadoObtido: 'Lead time de vidros caiu de 16 para 7 dias úteis com taxa de pontualidade de 100%.',
    avaliacaoEficacia: 'ALTAMENTE_EFICAZ',
    categoria: 'FORNECEDOR',
    impactoDiasEconomizados: 9,
    dataRegistro: '2026-08-08',
    autor: 'Coordenação PCP',
    tags: ['vidros', 'fornecedor', 'pontualidade'],
  },
  {
    id: 'apr-3',
    origemTipo: '5W2H',
    tituloProblema: 'Divergência entre vão civil e medidas do projeto executivo na instalação',
    solucaoAplicada: 'Checklist obrigatório com foto e conferência laser 3D do vão 10 dias antes da expedição.',
    resultadoObtido: 'Eliminou 100% dos retrabalhos de refilamento ou ajuste de contramarco na obra.',
    avaliacaoEficacia: 'ALTAMENTE_EFICAZ',
    categoria: 'PROJETO',
    impactoDiasEconomizados: 5,
    dataRegistro: '2026-08-10',
    autor: 'Supervisão de Obras',
    tags: ['medicao', 'obra', 'laser', 'projeto'],
  },
  {
    id: 'apr-4',
    origemTipo: 'BRAINSTORMING',
    tituloProblema: 'Falta de acessórios e parafusos de inox no momento da montagem final',
    solucaoAplicada: 'Kits pré-embalados por tipologia de esquadria no momento da requisição de compra.',
    resultadoObtido: 'Bancadas de montagem não param mais aguardando parafusos ou roldanas.',
    avaliacaoEficacia: 'MUITO_BOM',
    categoria: 'MONTAGEM',
    impactoDiasEconomizados: 2,
    dataRegistro: '2026-08-12',
    autor: 'Encarregado de Fábrica',
    tags: ['kits', 'acessorios', 'montagem'],
  },
];

export const defaultConfigGargalos: ConfigGargalosDashboard = {
  etapasOcultadas: [],
  limiteCriticoParadas: 1,
  limiteAtencaoAndamento: 3,
  pesoParado: 2,
  pesoAndamento: 1,
  mostrarApenasGargalosAtivos: false,
  limiteMaximoExibicao: 0,
  diasMaximosSugeridosPorEtapa: {
    'etapa-1': 2,
    'etapa-2': 3,
    'etapa-3': 4,
    'etapa-4': 3,
    'etapa-5': 2,
    'etapa-6': 1,
    'etapa-7': 3,
  },
};

export const defaultRegistrosRapidos: RegistroRapidoItem[] = [
  {
    id: 'reg-1',
    tipo: 'PROBLEMA',
    descricaoCurta: 'Máquina CNC-01 parou por quebra de ferramenta, gerando 30 peças com refugo e atrasando pedido do cliente X',
    categoria: 'PRODUCAO',
    tags: ['maquina', 'parada', 'urgente', 'pantografo', 'ferramenta'],
    dataCriacao: '2026-08-14',
    status: 'PENDENTE',
  },
  {
    id: 'reg-2',
    tipo: 'IDEIA',
    descricaoCurta: 'Adotar carrinhos móveis pré-organizados com kits de borrachas e parafusos para abastecer as bancadas de montagem',
    categoria: 'PRODUCAO',
    tags: ['produtividade', 'montagem', 'organizacao', 'kits'],
    dataCriacao: '2026-08-15',
    status: 'EM_ANALISE',
  },
  {
    id: 'reg-3',
    tipo: 'RISCO',
    descricaoCurta: 'Fornecedor de perfis com previsão de reajuste e atraso no lote de anodizados pretos na próxima quinzena',
    categoria: 'ESTOQUE',
    tags: ['fornecedor', 'estoque', 'aluminio', 'urgente'],
    dataCriacao: '2026-08-15',
    status: 'PENDENTE',
  },
];

// Helper load/save generic functions
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch custom event so reactive components update across tabs or modules
    window.dispatchEvent(new Event('sgm_storage_updated'));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Global flag to prevent circular snapshot loops
let isSyncingFromFirestore = false;

// Specialized getter & setters with transparent Firebase Firestore cloud synchronization
export const storageService = {
  getEmpresa: (): EmpresaConfig => loadFromStorage(STORAGE_KEYS.EMPRESA, defaultEmpresa),
  getEmpresaConfig: (): EmpresaConfig => loadFromStorage(STORAGE_KEYS.EMPRESA, defaultEmpresa),
  saveEmpresa: (data: EmpresaConfig) => {
    saveToStorage(STORAGE_KEYS.EMPRESA, data);
    if (!isSyncingFromFirestore) saveEmpresaDoc(data);
  },
  saveEmpresaConfig: (data: EmpresaConfig) => {
    saveToStorage(STORAGE_KEYS.EMPRESA, data);
    if (!isSyncingFromFirestore) saveEmpresaDoc(data);
  },

  getEtapas: (): EtapaFluxoConfig[] => loadFromStorage(STORAGE_KEYS.ETAPAS, defaultEtapas),
  getEtapasFluxo: (): EtapaFluxoConfig[] => loadFromStorage(STORAGE_KEYS.ETAPAS, defaultEtapas),
  saveEtapas: (data: EtapaFluxoConfig[]) => {
    const prev = storageService.getEtapas();
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.ETAPAS, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) deleteDocumentsBatch(COLLECTIONS.ETAPAS, removedIds);
      saveCollectionBatch(COLLECTIONS.ETAPAS, data);
    }
  },
  saveEtapasFluxo: (data: EtapaFluxoConfig[]) => {
    storageService.saveEtapas(data);
  },
  deleteEtapa: (id: string) => {
    const items = storageService.getEtapas().filter((i) => i.id !== id);
    saveToStorage(STORAGE_KEYS.ETAPAS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.ETAPAS, id);
  },

  getSegmentos: (): SegmentoEmpresa[] => {
    const segs = loadFromStorage<SegmentoEmpresa[]>(STORAGE_KEYS.SEGMENTOS, defaultSegmentos);
    if (!segs || segs.length === 0) return defaultSegmentos;

    let modified = false;
    const merged = [...segs];

    // Ensure all standard default segments exist (including PVC)
    defaultSegmentos.forEach((defSeg) => {
      const exists = merged.some(
        (s) =>
          s.id === defSeg.id ||
          s.nome.toLowerCase().trim() === defSeg.nome.toLowerCase().trim() ||
          (s.nome.toLowerCase().includes('pvc') && defSeg.nome.toLowerCase().includes('pvc'))
      );
      if (!exists) {
        merged.push(defSeg);
        modified = true;
      }
    });

    // Ensure all segments have their fluxoEtapas populated
    const finalSegs = merged.map((s) => {
      if (!s.fluxoEtapas || s.fluxoEtapas.length === 0) {
        const defMatch = defaultSegmentos.find(
          (d) =>
            d.id === s.id ||
            d.nome.toLowerCase().trim() === s.nome.toLowerCase().trim() ||
            (s.nome.toLowerCase().includes('pvc') && d.nome.toLowerCase().includes('pvc')) ||
            (s.nome.toLowerCase().includes('alum') && d.nome.toLowerCase().includes('alum'))
        );
        if (defMatch && defMatch.fluxoEtapas && defMatch.fluxoEtapas.length > 0) {
          modified = true;
          return { ...s, fluxoEtapas: defMatch.fluxoEtapas };
        }
      }
      return s;
    });

    if (modified) {
      saveToStorage(STORAGE_KEYS.SEGMENTOS, finalSegs);
    }
    return finalSegs;
  },
  saveSegmentos: (data: SegmentoEmpresa[]) => {
    const prev = loadFromStorage<SegmentoEmpresa[]>(STORAGE_KEYS.SEGMENTOS, []);
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.SEGMENTOS, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) {
        deleteDocumentsBatch(COLLECTIONS.SEGMENTOS, removedIds);
      }
      saveCollectionBatch(COLLECTIONS.SEGMENTOS, data);
    }
  },
  deleteSegmento: (id: string) => {
    const current = loadFromStorage<SegmentoEmpresa[]>(STORAGE_KEYS.SEGMENTOS, defaultSegmentos);
    const items = current.filter((i) => i.id !== id);
    saveToStorage(STORAGE_KEYS.SEGMENTOS, items);
    if (!isSyncingFromFirestore) {
      deleteDocument(COLLECTIONS.SEGMENTOS, id);
    }
  },
  getSegmentoFluxo: (segmentoNomeOuId: string): EtapaFluxoConfig[] => {
    if (!segmentoNomeOuId) return storageService.getEtapasFluxo();
    const segmentos = storageService.getSegmentos();
    const clean = segmentoNomeOuId.trim().toLowerCase();
    const cleanNorm = clean.replace(/^esquadrias\s+de\s+/i, '');
    const found = segmentos.find((s) => {
      const sName = s.nome.trim().toLowerCase();
      const sNorm = sName.replace(/^esquadrias\s+de\s+/i, '');
      return s.id === segmentoNomeOuId || sName === clean || sNorm === cleanNorm;
    });
    if (found && found.fluxoEtapas && found.fluxoEtapas.length > 0) {
      return found.fluxoEtapas;
    }
    return storageService.getEtapasFluxo();
  },

  getVendedores: (): Vendedor[] => loadFromStorage(STORAGE_KEYS.VENDEDORES, defaultVendedores),
  saveVendedores: (data: Vendedor[]) => {
    const prev = storageService.getVendedores();
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.VENDEDORES, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) deleteDocumentsBatch(COLLECTIONS.VENDEDORES, removedIds);
      saveCollectionBatch(COLLECTIONS.VENDEDORES, data);
    }
  },
  saveVendedor: (vendedor: Vendedor) => {
    const items = storageService.getVendedores();
    const idx = items.findIndex(i => i.id === vendedor.id);
    if (idx >= 0) items[idx] = vendedor;
    else items.unshift(vendedor);
    saveToStorage(STORAGE_KEYS.VENDEDORES, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.VENDEDORES, vendedor);
  },
  deleteVendedor: (id: string) => {
    const items = storageService.getVendedores().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.VENDEDORES, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.VENDEDORES, id);
  },

  getFornecedores: (): Fornecedor[] => loadFromStorage(STORAGE_KEYS.FORNECEDORES, defaultFornecedores),
  saveFornecedores: (data: Fornecedor[]) => {
    const prev = storageService.getFornecedores();
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.FORNECEDORES, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) deleteDocumentsBatch(COLLECTIONS.FORNECEDORES, removedIds);
      saveCollectionBatch(COLLECTIONS.FORNECEDORES, data);
    }
  },
  saveFornecedor: (fornecedor: Fornecedor) => {
    const items = storageService.getFornecedores();
    const idx = items.findIndex(i => i.id === fornecedor.id);
    if (idx >= 0) items[idx] = fornecedor;
    else items.unshift(fornecedor);
    saveToStorage(STORAGE_KEYS.FORNECEDORES, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.FORNECEDORES, fornecedor);
  },
  deleteFornecedor: (id: string) => {
    const items = storageService.getFornecedores().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.FORNECEDORES, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.FORNECEDORES, id);
  },

  getObras: (): Obra[] => loadFromStorage(STORAGE_KEYS.OBRAS, defaultObras),
  saveObras: (data: Obra[]) => {
    const prev = storageService.getObras();
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.OBRAS, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) deleteDocumentsBatch(COLLECTIONS.OBRAS, removedIds);
      saveCollectionBatch(COLLECTIONS.OBRAS, data);
    }
  },
  saveObra: (obra: Obra) => {
    const items = storageService.getObras();
    const idx = items.findIndex(i => i.id === obra.id);
    if (idx >= 0) items[idx] = obra;
    else items.push(obra);
    saveToStorage(STORAGE_KEYS.OBRAS, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.OBRAS, obra);
  },
  deleteObra: (id: string) => {
    const items = storageService.getObras().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.OBRAS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.OBRAS, id);
  },

  getCompras: (): Compra[] => loadFromStorage(STORAGE_KEYS.COMPRAS, defaultCompras),
  saveCompras: (data: Compra[]) => {
    const prev = storageService.getCompras();
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.COMPRAS, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) deleteDocumentsBatch(COLLECTIONS.COMPRAS, removedIds);
      saveCollectionBatch(COLLECTIONS.COMPRAS, data);
    }
  },
  saveCompra: (compra: Compra) => {
    const items = storageService.getCompras();
    const idx = items.findIndex(i => i.id === compra.id);
    if (idx >= 0) items[idx] = compra;
    else items.unshift(compra);
    saveToStorage(STORAGE_KEYS.COMPRAS, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.COMPRAS, compra);
  },
  deleteCompra: (id: string) => {
    const items = storageService.getCompras().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.COMPRAS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.COMPRAS, id);
  },

  getRequisicoes: (): RequisicaoMaterial[] => loadFromStorage(STORAGE_KEYS.REQUISICOES, defaultRequisicoes),
  saveRequisicoes: (data: RequisicaoMaterial[]) => {
    const prev = storageService.getRequisicoes();
    const removedIds = prev.filter((p) => !data.some((d) => d.id === p.id)).map((p) => p.id);
    saveToStorage(STORAGE_KEYS.REQUISICOES, data);
    if (!isSyncingFromFirestore) {
      if (removedIds.length > 0) deleteDocumentsBatch(COLLECTIONS.REQUISICOES, removedIds);
      saveCollectionBatch(COLLECTIONS.REQUISICOES, data);
    }
  },
  saveRequisicao: (requisicao: RequisicaoMaterial) => {
    const items = storageService.getRequisicoes();
    const idx = items.findIndex(i => i.id === requisicao.id);
    if (idx >= 0) items[idx] = requisicao;
    else items.unshift(requisicao);
    saveToStorage(STORAGE_KEYS.REQUISICOES, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.REQUISICOES, requisicao);
  },
  deleteRequisicao: (id: string) => {
    const items = storageService.getRequisicoes().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.REQUISICOES, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.REQUISICOES, id);
  },

  getPDCA: (): PDCAItem[] => loadFromStorage(STORAGE_KEYS.PDCA, defaultPDCA),
  savePDCAList: (data: PDCAItem[]) => {
    saveToStorage(STORAGE_KEYS.PDCA, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.PDCA, data);
  },
  savePDCA: (item: PDCAItem) => {
    const items = storageService.getPDCA();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.PDCA, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.PDCA, item);
  },
  deletePDCA: (id: string) => {
    const items = storageService.getPDCA().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.PDCA, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.PDCA, id);
  },

  getEisenhower: (): EisenhowerItem[] => loadFromStorage(STORAGE_KEYS.EISENHOWER, defaultEisenhower),
  saveEisenhowerList: (data: EisenhowerItem[]) => {
    saveToStorage(STORAGE_KEYS.EISENHOWER, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.EISENHOWER, data);
  },
  saveEisenhower: (item: EisenhowerItem) => {
    const items = storageService.getEisenhower();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.EISENHOWER, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.EISENHOWER, item);
  },
  deleteEisenhower: (id: string) => {
    const items = storageService.getEisenhower().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.EISENHOWER, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.EISENHOWER, id);
  },

  getGUT: (): GUTItem[] => loadFromStorage(STORAGE_KEYS.GUT, defaultGUT),
  saveGUTList: (data: GUTItem[]) => {
    saveToStorage(STORAGE_KEYS.GUT, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.GUT, data);
  },
  saveGUT: (item: GUTItem) => {
    const items = storageService.getGUT();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.GUT, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.GUT, item);
  },
  deleteGUT: (id: string) => {
    const items = storageService.getGUT().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.GUT, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.GUT, id);
  },

  getFiveWTwoH: (): FiveWTwoHItem[] => loadFromStorage(STORAGE_KEYS.FIVE_W_TWO_H, defaultFiveWTwoH),
  saveFiveWTwoHList: (data: FiveWTwoHItem[]) => {
    saveToStorage(STORAGE_KEYS.FIVE_W_TWO_H, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.FIVE_W_TWO_H, data);
  },
  saveFiveWTwoH: (item: FiveWTwoHItem) => {
    const items = storageService.getFiveWTwoH();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.FIVE_W_TWO_H, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.FIVE_W_TWO_H, item);
  },
  deleteFiveWTwoH: (id: string) => {
    const items = storageService.getFiveWTwoH().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.FIVE_W_TWO_H, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.FIVE_W_TWO_H, id);
  },

  getBrainstorming: (): BrainstormingIdea[] => loadFromStorage(STORAGE_KEYS.BRAINSTORMING, defaultBrainstorming),
  saveBrainstormingList: (data: BrainstormingIdea[]) => {
    saveToStorage(STORAGE_KEYS.BRAINSTORMING, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.BRAINSTORMING, data);
  },
  saveBrainstorming: (item: BrainstormingIdea) => {
    const items = storageService.getBrainstorming();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.BRAINSTORMING, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.BRAINSTORMING, item);
  },
  deleteBrainstorming: (id: string) => {
    const items = storageService.getBrainstorming().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.BRAINSTORMING, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.BRAINSTORMING, id);
  },

  getGoogleTasks: (): GoogleTaskItem[] => loadFromStorage(STORAGE_KEYS.GOOGLE_TASKS, defaultGoogleTasks),
  saveGoogleTasksList: (data: GoogleTaskItem[]) => {
    saveToStorage(STORAGE_KEYS.GOOGLE_TASKS, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.GOOGLE_TASKS, data);
  },
  saveGoogleTask: (item: GoogleTaskItem) => {
    const items = storageService.getGoogleTasks();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.GOOGLE_TASKS, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.GOOGLE_TASKS, item);
  },
  deleteGoogleTask: (id: string) => {
    const items = storageService.getGoogleTasks().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.GOOGLE_TASKS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.GOOGLE_TASKS, id);
  },

  getAprendizados: (): DecisaoAprendizado[] => loadFromStorage(STORAGE_KEYS.APRENDIZADOS, defaultAprendizados),
  saveAprendizadosList: (data: DecisaoAprendizado[]) => {
    saveToStorage(STORAGE_KEYS.APRENDIZADOS, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.APRENDIZADOS, data);
  },
  saveAprendizado: (item: DecisaoAprendizado) => {
    const items = storageService.getAprendizados();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.APRENDIZADOS, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.APRENDIZADOS, item);
  },
  deleteAprendizado: (id: string) => {
    const items = storageService.getAprendizados().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.APRENDIZADOS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.APRENDIZADOS, id);
  },

  // Gargalos de Produção
  getGargalos: (): GargaloConfig[] => loadFromStorage<GargaloConfig[]>(STORAGE_KEYS.GARGALOS, []),
  saveGargalosList: (data: GargaloConfig[]) => {
    saveToStorage(STORAGE_KEYS.GARGALOS, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.GARGALOS, data);
  },
  saveGargalo: (item: GargaloConfig) => {
    const items = storageService.getGargalos();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.GARGALOS, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.GARGALOS, item);
  },
  deleteGargalo: (id: string) => {
    const items = storageService.getGargalos().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.GARGALOS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.GARGALOS, id);
  },

  // Ordens de Manutenção
  getManutencoes: (): OrdemManutencao[] => loadFromStorage<OrdemManutencao[]>(STORAGE_KEYS.MANUTENCOES, []),
  saveManutencoesList: (data: OrdemManutencao[]) => {
    saveToStorage(STORAGE_KEYS.MANUTENCOES, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.MANUTENCOES, data);
  },
  saveManutencao: (item: OrdemManutencao) => {
    const items = storageService.getManutencoes();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.MANUTENCOES, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.MANUTENCOES, item);
  },
  deleteManutencao: (id: string) => {
    const items = storageService.getManutencoes().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.MANUTENCOES, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.MANUTENCOES, id);
  },

  // Registro Rápido (Quick Log)
  getRegistrosRapidos: (): RegistroRapidoItem[] => loadFromStorage(STORAGE_KEYS.REGISTROS_RAPIDOS, defaultRegistrosRapidos),
  saveRegistrosRapidosList: (data: RegistroRapidoItem[]) => {
    saveToStorage(STORAGE_KEYS.REGISTROS_RAPIDOS, data);
    if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.REGISTROS_RAPIDOS, data);
  },
  saveRegistroRapido: (item: RegistroRapidoItem) => {
    const items = storageService.getRegistrosRapidos();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    saveToStorage(STORAGE_KEYS.REGISTROS_RAPIDOS, items);
    if (!isSyncingFromFirestore) saveDocument(COLLECTIONS.REGISTROS_RAPIDOS, item);
  },
  deleteRegistroRapido: (id: string) => {
    const items = storageService.getRegistrosRapidos().filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.REGISTROS_RAPIDOS, items);
    if (!isSyncingFromFirestore) deleteDocument(COLLECTIONS.REGISTROS_RAPIDOS, id);
  },

  // Configuração dos Gargalos no Dashboard
  getConfigGargalos: (): ConfigGargalosDashboard => loadFromStorage(STORAGE_KEYS.CONFIG_GARGALOS, defaultConfigGargalos),
  saveConfigGargalos: (config: ConfigGargalosDashboard) => {
    saveToStorage(STORAGE_KEYS.CONFIG_GARGALOS, config);
    if (!isSyncingFromFirestore) {
      const docRef = doc(db, COLLECTIONS.CONFIG_GARGALOS, 'main');
      const cleanData = JSON.parse(JSON.stringify(config));
      setDoc(docRef, cleanData, { merge: true }).catch((e) => console.error('Error saving config gargalos:', e));
    }
  },

  // Alertas e Notificações (Limpeza / Dispensa de Alertas)
  getDismissedAlerts: (): string[] => loadFromStorage<string[]>(STORAGE_KEYS.DISMISSED_ALERTS, []),
  dismissAlert: (alertKey: string) => {
    const current = storageService.getDismissedAlerts();
    if (!current.includes(alertKey)) {
      const updated = [...current, alertKey];
      saveToStorage(STORAGE_KEYS.DISMISSED_ALERTS, updated);
      window.dispatchEvent(new Event('sgm_storage_updated'));
    }
  },
  dismissAllAlerts: (alertKeys: string[]) => {
    const current = storageService.getDismissedAlerts();
    const set = new Set([...current, ...alertKeys]);
    saveToStorage(STORAGE_KEYS.DISMISSED_ALERTS, Array.from(set));
    window.dispatchEvent(new Event('sgm_storage_updated'));
  },
  restoreDismissedAlerts: () => {
    saveToStorage(STORAGE_KEYS.DISMISSED_ALERTS, []);
    window.dispatchEvent(new Event('sgm_storage_updated'));
  },
  restoreSingleAlert: (alertKey: string) => {
    const current = storageService.getDismissedAlerts();
    const updated = current.filter((k) => k !== alertKey);
    saveToStorage(STORAGE_KEYS.DISMISSED_ALERTS, updated);
    window.dispatchEvent(new Event('sgm_storage_updated'));
  },

  // Push all existing local data to Firebase Firestore in bulk
  syncAllLocalToCloud: async () => {
    setCloudSyncStatus('connecting');
    try {
      await saveEmpresaDoc(storageService.getEmpresa());
      await saveCollectionBatch(COLLECTIONS.ETAPAS, storageService.getEtapas());
      await saveCollectionBatch(COLLECTIONS.SEGMENTOS, storageService.getSegmentos());
      await saveCollectionBatch(COLLECTIONS.VENDEDORES, storageService.getVendedores());
      await saveCollectionBatch(COLLECTIONS.FORNECEDORES, storageService.getFornecedores());
      await saveCollectionBatch(COLLECTIONS.OBRAS, storageService.getObras());
      await saveCollectionBatch(COLLECTIONS.COMPRAS, storageService.getCompras());
      await saveCollectionBatch(COLLECTIONS.REQUISICOES, storageService.getRequisicoes());
      await saveCollectionBatch(COLLECTIONS.PDCA, storageService.getPDCA());
      await saveCollectionBatch(COLLECTIONS.EISENHOWER, storageService.getEisenhower());
      await saveCollectionBatch(COLLECTIONS.GUT, storageService.getGUT());
      await saveCollectionBatch(COLLECTIONS.FIVE_W_TWO_H, storageService.getFiveWTwoH());
      await saveCollectionBatch(COLLECTIONS.BRAINSTORMING, storageService.getBrainstorming());
      await saveCollectionBatch(COLLECTIONS.GOOGLE_TASKS, storageService.getGoogleTasks());
      await saveCollectionBatch(COLLECTIONS.APRENDIZADOS, storageService.getAprendizados());
      await saveCollectionBatch(COLLECTIONS.GARGALOS, storageService.getGargalos());
      await saveCollectionBatch(COLLECTIONS.REGISTROS_RAPIDOS, storageService.getRegistrosRapidos());
      await saveCollectionBatch(COLLECTIONS.MANUTENCOES, storageService.getManutencoes());
      const docRef = doc(db, COLLECTIONS.CONFIG_GARGALOS, 'main');
      await setDoc(docRef, JSON.parse(JSON.stringify(storageService.getConfigGargalos())), { merge: true });
      setCloudSyncStatus('connected');
      return true;
    } catch (err) {
      console.error('Error syncing all to Firebase:', err);
      setCloudSyncStatus('error');
      return false;
    }
  },

  resetAllData: async () => {
    isResetting = true;
    try {
      localStorage.clear();
      saveToStorage(STORAGE_KEYS.EMPRESA, defaultEmpresa);
      saveToStorage(STORAGE_KEYS.ETAPAS, defaultEtapas);
      saveToStorage(STORAGE_KEYS.SEGMENTOS, defaultSegmentos);
      saveToStorage(STORAGE_KEYS.VENDEDORES, defaultVendedores);
      saveToStorage(STORAGE_KEYS.FORNECEDORES, defaultFornecedores);
      saveToStorage(STORAGE_KEYS.OBRAS, defaultObras);
      saveToStorage(STORAGE_KEYS.COMPRAS, defaultCompras);
      saveToStorage(STORAGE_KEYS.REQUISICOES, defaultRequisicoes);
      saveToStorage(STORAGE_KEYS.PDCA, defaultPDCA);
      saveToStorage(STORAGE_KEYS.EISENHOWER, defaultEisenhower);
      saveToStorage(STORAGE_KEYS.GUT, defaultGUT);
      saveToStorage(STORAGE_KEYS.FIVE_W_TWO_H, defaultFiveWTwoH);
      saveToStorage(STORAGE_KEYS.BRAINSTORMING, defaultBrainstorming);
      saveToStorage(STORAGE_KEYS.GOOGLE_TASKS, defaultGoogleTasks);
      saveToStorage(STORAGE_KEYS.APRENDIZADOS, defaultAprendizados);
      saveToStorage(STORAGE_KEYS.GARGALOS, []);
      saveToStorage(STORAGE_KEYS.REGISTROS_RAPIDOS, defaultRegistrosRapidos);
      saveToStorage(STORAGE_KEYS.MANUTENCOES, []);
      saveToStorage(STORAGE_KEYS.CONFIG_GARGALOS, defaultConfigGargalos);

      // Clear all collections from Firebase
      const collectionsToClear = [
        COLLECTIONS.ETAPAS, COLLECTIONS.SEGMENTOS, COLLECTIONS.VENDEDORES,
        COLLECTIONS.FORNECEDORES, COLLECTIONS.OBRAS, COLLECTIONS.COMPRAS,
        COLLECTIONS.REQUISICOES, COLLECTIONS.PDCA, COLLECTIONS.EISENHOWER,
        COLLECTIONS.GUT, COLLECTIONS.FIVE_W_TWO_H, COLLECTIONS.BRAINSTORMING,
        COLLECTIONS.GOOGLE_TASKS, COLLECTIONS.APRENDIZADOS, COLLECTIONS.GARGALOS,
        COLLECTIONS.REGISTROS_RAPIDOS, COLLECTIONS.MANUTENCOES
      ];
      
      for (const col of collectionsToClear) {
        await clearCollection(col);
      }

      await storageService.syncAllLocalToCloud();
    } finally {
      isResetting = false;
    }
  },

  exportBackupJSON: (): string => {
    const backupObj = {
      empresa: storageService.getEmpresa(),
      etapas: storageService.getEtapas(),
      segmentos: storageService.getSegmentos(),
      vendedores: storageService.getVendedores(),
      fornecedores: storageService.getFornecedores(),
      obras: storageService.getObras(),
      compras: storageService.getCompras(),
      requisicoes: storageService.getRequisicoes(),
      pdca: storageService.getPDCA(),
      eisenhower: storageService.getEisenhower(),
      gut: storageService.getGUT(),
      fiveWTwoH: storageService.getFiveWTwoH(),
      brainstorming: storageService.getBrainstorming(),
      googleTasks: storageService.getGoogleTasks(),
      aprendizados: storageService.getAprendizados(),
      gargalos: storageService.getGargalos(),
      registrosRapidos: storageService.getRegistrosRapidos(),
      configGargalos: storageService.getConfigGargalos(),
      manutencoes: storageService.getManutencoes(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(backupObj, null, 2);
  },

  importBackupJSON: (jsonStr: string): boolean => {
    try {
      const obj = JSON.parse(jsonStr);
      if (obj.empresa) storageService.saveEmpresa(obj.empresa);
      if (obj.etapas) storageService.saveEtapas(obj.etapas);
      if (obj.segmentos) storageService.saveSegmentos(obj.segmentos);
      if (obj.vendedores) storageService.saveVendedores(obj.vendedores);
      if (obj.fornecedores) storageService.saveFornecedores(obj.fornecedores);
      if (obj.obras) storageService.saveObras(obj.obras);
      if (obj.compras) storageService.saveCompras(obj.compras);
      if (obj.requisicoes) storageService.saveRequisicoes(obj.requisicoes);
      if (obj.pdca) storageService.savePDCA(obj.pdca);
      if (obj.eisenhower) storageService.saveEisenhower(obj.eisenhower);
      if (obj.gut) storageService.saveGUT(obj.gut);
      if (obj.fiveWTwoH) storageService.saveFiveWTwoHList(obj.fiveWTwoH);
      if (obj.brainstorming) storageService.saveBrainstormingList(obj.brainstorming);
      if (obj.googleTasks) storageService.saveGoogleTasksList(obj.googleTasks);
      if (obj.aprendizados) storageService.saveAprendizadosList(obj.aprendizados);
      if (obj.gargalos) {
        saveToStorage(STORAGE_KEYS.GARGALOS, obj.gargalos);
        if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.GARGALOS, obj.gargalos);
      }
      if (obj.registrosRapidos) {
        saveToStorage(STORAGE_KEYS.REGISTROS_RAPIDOS, obj.registrosRapidos);
        if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.REGISTROS_RAPIDOS, obj.registrosRapidos);
      }
      if (obj.manutencoes) {
        saveToStorage(STORAGE_KEYS.MANUTENCOES, obj.manutencoes);
        if (!isSyncingFromFirestore) saveCollectionBatch(COLLECTIONS.MANUTENCOES, obj.manutencoes);
      }
      if (obj.configGargalos) storageService.saveConfigGargalos(obj.configGargalos);
      storageService.syncAllLocalToCloud();
      return true;
    } catch (err) {
      console.error('Error importing backup JSON:', err);
      return false;
    }
  }
};

// Start Real-time Firebase Firestore Listeners
let listenersInitialized = false;
export let isResetting = false;

export function initFirestoreLiveSync() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  setCloudSyncStatus('connecting');

  try {
    // 1. Empresa Config Listener
    const empresaDocRef = doc(db, COLLECTIONS.EMPRESA, 'config');
    onSnapshot(
      empresaDocRef,
      (docSnap) => {
        if (isResetting) return;
        if (docSnap.exists()) {
          isSyncingFromFirestore = true;
          saveToStorage(STORAGE_KEYS.EMPRESA, docSnap.data() as EmpresaConfig);
          isSyncingFromFirestore = false;
        } else {
          // Seed cloud with initial config
          saveEmpresaDoc(storageService.getEmpresa());
        }
        setCloudSyncStatus('connected');
      },
      (err) => {
        console.warn('Firestore empresa listener status:', err.message);
        setCloudSyncStatus('offline');
      }
    );

    // Config Gargalos Listener
    const configGargalosDocRef = doc(db, COLLECTIONS.CONFIG_GARGALOS, 'main');
    onSnapshot(
      configGargalosDocRef,
      (docSnap) => {
        if (isResetting) return;
        if (docSnap.exists()) {
          isSyncingFromFirestore = true;
          saveToStorage(STORAGE_KEYS.CONFIG_GARGALOS, docSnap.data() as ConfigGargalosDashboard);
          isSyncingFromFirestore = false;
        }
      },
      (err) => {
        console.warn('Firestore config gargalos listener note:', err.message);
      }
    );

    // Generic collection listener setup
    const syncCollection = <T extends { id: string }>(
      collectionName: string,
      storageKey: string,
      fallbackData: T[]
    ) => {
      const colRef = collection(db, collectionName);
      let isFirstSnapshot = true;

      onSnapshot(
        colRef,
        (querySnapshot) => {
          if (isResetting) return;
          if (!querySnapshot.empty) {
            const items: T[] = [];
            querySnapshot.forEach((docSnap) => {
              items.push(docSnap.data() as T);
            });
            isSyncingFromFirestore = true;
            saveToStorage(storageKey, items);
            isSyncingFromFirestore = false;
          } else {
            // If it's the very first load and localStorage has never been touched at all, seed with fallback
            const hasLocalKey = localStorage.getItem(storageKey) !== null;
            if (isFirstSnapshot && !hasLocalKey) {
              const currentLocal = loadFromStorage<T[]>(storageKey, fallbackData);
              if (currentLocal && currentLocal.length > 0) {
                saveCollectionBatch(collectionName, currentLocal);
              }
            } else {
              // The collection was cleared or is legitimately empty
              isSyncingFromFirestore = true;
              saveToStorage(storageKey, []);
              isSyncingFromFirestore = false;
            }
          }
          isFirstSnapshot = false;
          setCloudSyncStatus('connected');
        },
        (err) => {
          console.warn(`Firestore listener for ${collectionName} note:`, err.message);
          setCloudSyncStatus('offline');
        }
      );
    };

    syncCollection<Obra>(COLLECTIONS.OBRAS, STORAGE_KEYS.OBRAS, defaultObras);
    syncCollection<Fornecedor>(COLLECTIONS.FORNECEDORES, STORAGE_KEYS.FORNECEDORES, defaultFornecedores);
    syncCollection<Compra>(COLLECTIONS.COMPRAS, STORAGE_KEYS.COMPRAS, defaultCompras);
    syncCollection<RequisicaoMaterial>(COLLECTIONS.REQUISICOES, STORAGE_KEYS.REQUISICOES, defaultRequisicoes);
    syncCollection<Vendedor>(COLLECTIONS.VENDEDORES, STORAGE_KEYS.VENDEDORES, defaultVendedores);
    syncCollection<EtapaFluxoConfig>(COLLECTIONS.ETAPAS, STORAGE_KEYS.ETAPAS, defaultEtapas);
    syncCollection<SegmentoEmpresa>(COLLECTIONS.SEGMENTOS, STORAGE_KEYS.SEGMENTOS, defaultSegmentos);
    syncCollection<PDCAItem>(COLLECTIONS.PDCA, STORAGE_KEYS.PDCA, defaultPDCA);
    syncCollection<EisenhowerItem>(COLLECTIONS.EISENHOWER, STORAGE_KEYS.EISENHOWER, defaultEisenhower);
    syncCollection<GUTItem>(COLLECTIONS.GUT, STORAGE_KEYS.GUT, defaultGUT);
    syncCollection<FiveWTwoHItem>(COLLECTIONS.FIVE_W_TWO_H, STORAGE_KEYS.FIVE_W_TWO_H, defaultFiveWTwoH);
    syncCollection<BrainstormingIdea>(COLLECTIONS.BRAINSTORMING, STORAGE_KEYS.BRAINSTORMING, defaultBrainstorming);
    syncCollection<GoogleTaskItem>(COLLECTIONS.GOOGLE_TASKS, STORAGE_KEYS.GOOGLE_TASKS, defaultGoogleTasks);
    syncCollection<DecisaoAprendizado>(COLLECTIONS.APRENDIZADOS, STORAGE_KEYS.APRENDIZADOS, defaultAprendizados);
    syncCollection<GargaloConfig>(COLLECTIONS.GARGALOS, STORAGE_KEYS.GARGALOS, []);
    syncCollection<RegistroRapidoItem>(COLLECTIONS.REGISTROS_RAPIDOS, STORAGE_KEYS.REGISTROS_RAPIDOS, defaultRegistrosRapidos);
    syncCollection<OrdemManutencao>(COLLECTIONS.MANUTENCOES, STORAGE_KEYS.MANUTENCOES, []);

  } catch (error) {
    console.error('Failed to initialize Firebase Live Sync:', error);
    setCloudSyncStatus('error');
  }
}
