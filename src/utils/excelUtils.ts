import * as XLSX from 'xlsx';
import { Obra, Compra, Vendedor, Fornecedor, EtapaFluxoConfig } from '../types';
import { formatDateBR } from './dateUtils';

export function exportSystemToExcel(
  obras: Obra[] = [],
  compras: Compra[] = [],
  vendedores: Vendedor[] = [],
  fornecedores: Fornecedor[] = [],
  etapas: EtapaFluxoConfig[] = []
) {
  const wb = XLSX.utils.book_new();

  // 1. Obras Worksheet
  const obrasData = (obras || []).map((o) => {
    const row: Record<string, any> = {
      'Código': o.codigo,
      'Cliente / Obra': o.cliente,
      'Vendedor': o.vendedorNome,
      'Segmento': o.segmento,
      'Prioridade': o.prioridade,
      'Quantidade': o.quantidade,
      'Cor / Acabamento': o.cor,
      'Data Inicial': formatDateBR(o.dataInicial),
      'Prazo (Dias Úteis)': o.prazoDiasUteis,
      'Data Prevista Entrega': formatDateBR(o.dataPrevistaEntrega),
      'Data Agendada': formatDateBR(o.dataAgendada),
      'Status Global': o.statusGlobal,
      'Valor Estimado (R$)': o.valorEstimado || 0,
      'Arquivada': o.arquivada ? 'SIM' : 'NÃO',
      'Observações': o.observacoes || '',
    };

    // Add production flow status
    (etapas || []).forEach((et) => {
      row[`Fluxo: ${et.nome}`] = (o.fluxoEtapas && o.fluxoEtapas[et.id]) || 'NÃO INICIADO';
    });

    return row;
  });

  const wsObras = XLSX.utils.json_to_sheet(obrasData);
  XLSX.utils.book_append_sheet(wb, wsObras, 'Obras & Produção');

  // 2. Compras Worksheet
  const comprasData = (compras || []).map((c) => ({
    'Código Pedido': c.codigoPedido,
    'Fornecedor': c.fornecedorNome,
    'Material / Insumo': c.material,
    'Data Enviada': formatDateBR(c.dataEnviada),
    'Prazo (Dias Úteis)': c.prazoDiasUteis,
    'Data Aprovação': formatDateBR(c.dataAprovacao),
    'Data Entrega Prevista': formatDateBR(c.dataEntregaPrevista),
    'Status': c.status,
    'Observações': c.observacao || '',
  }));
  const wsCompras = XLSX.utils.json_to_sheet(comprasData);
  XLSX.utils.book_append_sheet(wb, wsCompras, 'Controle de Compras');

  // 3. Vendedores Worksheet
  const vendedoresData = (vendedores || []).map((v) => ({
    'Nome': v.nome,
    'Telefone': v.telefone,
    'E-mail': v.email,
    'Ativo': v.ativo ? 'SIM' : 'NÃO',
  }));
  const wsVendedores = XLSX.utils.json_to_sheet(vendedoresData);
  XLSX.utils.book_append_sheet(wb, wsVendedores, 'Vendedores');

  // 4. Fornecedores Worksheet
  const fornecedoresData = (fornecedores || []).map((f) => ({
    'Razão Social': f.razaoSocial,
    'CNPJ': f.cnpj,
    'Telefone': f.telefone,
    'E-mail': f.email,
    'Prazo Padrão (Dias Úteis)': f.prazoEntregaPadraoDiasUteis,
    'Escopo de Materiais': f.materialEscopo,
  }));
  const wsFornecedores = XLSX.utils.json_to_sheet(fornecedoresData);
  XLSX.utils.book_append_sheet(wb, wsFornecedores, 'Fornecedores');

  // Save workbook
  const nowStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `SGM_Export_Dados_${nowStr}.xlsx`);
}

export function parseExcelImportFile(file: File): Promise<{
  obrasImportadas?: Partial<Obra>[];
  comprasImportadas?: Partial<Compra>[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: { obrasImportadas?: Partial<Obra>[]; comprasImportadas?: Partial<Compra>[] } = {};

        // Parse Obras sheet if exists
        const sheetObrasName = workbook.SheetNames.find((s) => s.toLowerCase().includes('obra'));
        if (sheetObrasName) {
          const sheet = workbook.Sheets[sheetObrasName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          result.obrasImportadas = rows.map((r, idx) => ({
            id: `imp-obra-${Date.now()}-${idx}`,
            codigo: r['Código'] || `IMP-${idx + 1}`,
            cliente: r['Cliente / Obra'] || r['Cliente'] || 'Cliente Importado',
            vendedorNome: r['Vendedor'] || 'Geral',
            segmento: r['Segmento'] || 'Esquadrias de Alumínio',
            prioridade: (r['Prioridade'] || 'NORMAL') as any,
            quantidade: Number(r['Quantidade']) || 1,
            cor: r['Cor / Acabamento'] || r['Cor'] || 'Padrão',
            dataInicial: new Date().toISOString().split('T')[0],
            prazoDiasUteis: Number(r['Prazo (Dias Úteis)']) || 15,
            dataPrevistaEntrega: new Date().toISOString().split('T')[0],
            statusGlobal: (r['Status Global'] || 'NÃO AGENDADA') as any,
            valorEstimado: Number(r['Valor Estimado (R$)']) || 0,
            observacoes: r['Observações'] || '',
            fluxoEtapas: {},
            arquivada: false,
            dataCriacao: new Date().toISOString().split('T')[0],
          }));
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
