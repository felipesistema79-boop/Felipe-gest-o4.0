import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Obra, RequisicaoMaterial, EmpresaConfig, EtapaFluxoConfig, Fornecedor } from '../types';
import { formatDateBR } from './dateUtils';

// Helper to convert HEX to RGB for jsPDF
function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = (hex || '#EA580C').replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [234, 88, 12]; // Fallback to orange #EA580C
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Helper to render company logo or stylized emblem on PDF header
function renderCompanyLogo(
  doc: jsPDF,
  empresa: EmpresaConfig,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (empresa.logoBase64) {
    try {
      let format = 'PNG';
      const lower = empresa.logoBase64.toLowerCase();
      if (lower.includes('image/jpeg') || lower.includes('image/jpg')) {
        format = 'JPEG';
      } else if (lower.includes('image/webp')) {
        format = 'WEBP';
      }

      // White background card for the logo with subtle border
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, w, h, 2, 2, 'F');

      // Draw image inside white container with generous width area
      doc.addImage(empresa.logoBase64, format, x + 1, y + 1, w - 2, h - 2);
      return;
    } catch (err) {
      console.warn('Erro ao renderizar imagem do logo no PDF:', err);
    }
  }

  // Fallback Badge Emblem if no logo image uploaded
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');

  doc.setFillColor(234, 88, 12); // Laranja corporativo
  doc.roundedRect(x + 1, y + 1, w - 2, h - 2, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const initials = (empresa.nomeEmpresa || 'CABRAL')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();

  doc.text(initials || 'SGM', x + w / 2, y + h / 2 + 1.5, { align: 'center' });
}

export function generateRequisicaoPDF(
  req: RequisicaoMaterial,
  empresa: EmpresaConfig,
  fornecedor?: Fornecedor
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Brand Palette: Laranja #EA580C
  const headerBgRgb: [number, number, number] = [234, 88, 12];

  // Background Header Bar (Orange)
  doc.setFillColor(...headerBgRgb);
  doc.rect(0, 0, 297, 26, 'F');

  // Company Logo on Left (56mm width, 20mm height)
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  // Document Title & Code
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('REQUISIÇÃO DE MATERIAIS & COMPRAS', 74, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(254, 243, 199); // Soft cream yellow accent for code
  doc.text(`CÓDIGO: ${req.codigo}`, 74, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`EMISSÃO: ${req.dataCriacaoExtenso || req.dataCriacao}`, 285, 15, { align: 'right' });

  // Company and Supplier Info Boxes (Organized 2-Column Grid)
  const yPos = 30;
  const boxHeight = 39;
  const boxWidth = 134;

  // Left Box: Company Info
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252); // Clean light background
  doc.roundedRect(12, yPos, boxWidth, boxHeight, 2, 2, 'FD');

  // Header Title
  doc.setTextColor(234, 88, 12); // Orange title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DADOS DA EMPRESA SOLICITANTE', 16, yPos + 5.5);

  // Company Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const nomeEmpresaDisplay = empresa.nomeEmpresa || 'Cabral Esquadrias Ltda';
  doc.text(nomeEmpresaDisplay, 16, yPos + 11);

  // Row 1: CNPJ & Responsável
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`CNPJ: ${empresa.cnpj || 'N/D'}   |   RESPONSÁVEL: ${empresa.responsavel || 'N/D'}`, 16, yPos + 16.5);

  // Row 2: Telefone, WhatsApp & E-mail
  const telPart = empresa.telefone ? `TEL: ${empresa.telefone}` : '';
  const whatsPart = empresa.whatsapp ? `WHATSAPP: ${empresa.whatsapp}` : '';
  const emailPart = empresa.email ? `E-MAIL: ${empresa.email}` : '';
  const contacts = [telPart, whatsPart, emailPart].filter(Boolean).join('   |   ') || 'CONTATO: N/D';
  doc.text(contacts, 16, yPos + 21.5);

  // Row 3: Endereço Completo (with word wrapping to prevent overflow)
  const enderecoText = `ENDEREÇO: ${empresa.endereco || 'Fábrica / Sede Principal'}`;
  const enderecoLines = doc.splitTextToSize(enderecoText, 126);
  doc.text(enderecoLines, 16, yPos + 26.5);

  // Right Box: Supplier Info
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(151, yPos, boxWidth, boxHeight, 2, 2, 'FD');

  // Supplier Header Title
  doc.setTextColor(234, 88, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DADOS DO FORNECEDOR', 155, yPos + 5.5);

  // Supplier Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const fornecedorNomeDisplay = req.fornecedorNome || fornecedor?.razaoSocial || 'Fornecedor Geral';
  doc.text(fornecedorNomeDisplay, 155, yPos + 11);

  // Supplier Row 1: CNPJ & Telefone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`CNPJ: ${fornecedor?.cnpj || 'N/D'}   |   TEL: ${fornecedor?.telefone || 'N/D'}`, 155, yPos + 16.5);

  // Supplier Row 2: E-mail
  doc.text(`E-MAIL: ${fornecedor?.email || 'N/D'}`, 155, yPos + 21.5);

  // Supplier Row 3: Prazo de Entrega
  const prazoUteis = fornecedor?.prazoEntregaPadraoDiasUteis || 5;
  doc.text(`PRAZO DE ENTREGA PADRÃO: ${prazoUteis} DIAS ÚTEIS`, 155, yPos + 26.5);

  // Supplier Row 4: Escopo / Materiais & Destino
  let escopoText = `DESTINO: ${req.clienteEstoque === 'ESTOQUE' ? 'ESTOQUE GERAL / ALMOXARIFADO' : (req.obraNome || 'OBRA / CLIENTE DIRETO')}`;
  if (fornecedor?.materialEscopo) {
    escopoText += `   |   ESCOPO: ${fornecedor.materialEscopo}`;
  }
  const escopoLines = doc.splitTextToSize(escopoText, 126);
  doc.text(escopoLines, 155, yPos + 31.5);

  // Items Table
  const tableStartY = yPos + boxHeight + 5;

  const tableHead = [['#', 'CÓDIGO ITEM', 'COR / ACABAMENTO', 'DESCRIÇÃO DO MATERIAL / INSUMO', 'QTD.', 'UNID.']];
  const tableBody = (req.itens || []).map((item, idx) => {
    let desc = item.descricao;
    if (item.editado) {
      desc += item.quantidadeOriginal
        ? ` [EDITADO: Qtd. ajustada de ${item.quantidadeOriginal} p/ ${item.quantidade} ${item.unidade || 'UN'}]`
        : ' [EDITADO: Qtd. ajustada pós-cotação]';
    }
    return [
      (idx + 1).toString(),
      item.codigo || '-',
      item.cor || 'PADRÃO',
      desc,
      item.quantidade.toString(),
      item.unidade || 'UN',
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12], // Laranja #EA580C header background
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 32 },
      2: { cellWidth: 42 },
      3: { cellWidth: 141 },
      4: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 26 },
    },
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Observations Box
  if (req.observacoes) {
    const obsLines = doc.splitTextToSize(req.observacoes, 265);
    const obsHeight = Math.max(16, obsLines.length * 4.5 + 8);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, finalY, 273, obsHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(234, 88, 12);
    doc.text('OBSERVAÇÕES E INSTRUÇÕES DE ENTREGA:', 16, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(obsLines, 16, finalY + 10.5);
  }

  // Footer Page numbers & Digital ERP Watermark
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Documento emitido eletronicamente via Sistema SGM/ERP - ${empresa.nomeEmpresa}`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  // Output blob & open/download
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Requisicao_${req.codigo}.pdf`);
}

export function generateConferenciaPDF(
  req: RequisicaoMaterial,
  empresa: EmpresaConfig,
  fornecedor?: Fornecedor
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Background Header Bar (Orange #EA580C)
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');

  // Render Logo
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  // Title & Code
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ORDEM DE CONFERÊNCIA E RECEBIMENTO DE MATERIAIS', 74, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(254, 243, 199);
  doc.text(`REQUISIÇÃO: ${req.codigo}`, 74, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`DATA REQ: ${req.dataCriacaoExtenso || req.dataCriacao}`, 285, 15, { align: 'right' });

  // Company and Supplier Info Boxes (Organized 2-Column Grid)
  const yPos = 30;
  const boxHeight = 39;
  const boxWidth = 134;

  // Left Box: Empresa Solicitante
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, yPos, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setTextColor(234, 88, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DADOS DA EMPRESA SOLICITANTE', 16, yPos + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(empresa.nomeEmpresa || 'Cabral Esquadrias Ltda', 16, yPos + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`CNPJ: ${empresa.cnpj || 'N/D'}   |   RESP. EXPEDIÇÃO: ${empresa.responsavel || 'N/D'}`, 16, yPos + 16.5);

  const telPart = empresa.telefone ? `TEL: ${empresa.telefone}` : '';
  const whatsPart = empresa.whatsapp ? `WHATSAPP: ${empresa.whatsapp}` : '';
  const emailPart = empresa.email ? `E-MAIL: ${empresa.email}` : '';
  const contacts = [telPart, whatsPart, emailPart].filter(Boolean).join('   |   ') || 'CONTATO: N/D';
  doc.text(contacts, 16, yPos + 21.5);

  const enderecoText = `ENDEREÇO: ${empresa.endereco || 'Fábrica / Sede Principal'}`;
  const enderecoLines = doc.splitTextToSize(enderecoText, 126);
  doc.text(enderecoLines, 16, yPos + 26.5);

  // Right Box: Fornecedor & Recebimento
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(151, yPos, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setTextColor(234, 88, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DADOS DO FORNECEDOR & RECEBIMENTO', 155, yPos + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(req.fornecedorNome || fornecedor?.razaoSocial || 'Fornecedor Geral', 155, yPos + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`CNPJ: ${fornecedor?.cnpj || 'N/D'}   |   TEL: ${fornecedor?.telefone || 'N/D'}`, 155, yPos + 16.5);
  doc.text(`E-MAIL: ${fornecedor?.email || 'N/D'}`, 155, yPos + 21.5);
  doc.text(`INSPEÇÃO: Conferir quantidades físicas, avarias e acabamento.`, 155, yPos + 26.5);

  // Items Table
  const tableStartY = yPos + boxHeight + 5;

  const tableHead = [['STATUS', 'CONFERIDO', 'CÓDIGO', 'COR', 'DESCRIÇÃO DO ITEM', 'QTD. SOLIC.', 'QTD. RECEB.']];
  const tableBody = (req.itens || []).map((item) => {
    const qtdSolicDisplay = item.editado && item.quantidadeOriginal
      ? `${item.quantidade} ${item.unidade || 'UN'} (orig: ${item.quantidadeOriginal})`
      : `${item.quantidade} ${item.unidade || 'UN'}`;

    let qtdRecebDisplay = '________';
    if (item.quantidadeRecebida !== undefined && item.quantidadeRecebida !== null) {
      qtdRecebDisplay = `${item.quantidadeRecebida} ${item.unidade || 'UN'}`;
    } else if (item.conferido) {
      qtdRecebDisplay = `${item.quantidade} ${item.unidade || 'UN'}`;
    }

    let statusText = 'PENDENTE';
    if (item.conferido) {
      if (item.quantidadeRecebida !== undefined && item.quantidadeRecebida < item.quantidade) {
        statusText = 'PARCIAL';
      } else {
        statusText = 'OK';
      }
    }

    return [
      statusText,
      item.conferido ? '[X] CONFERIDO' : '[   ] CONFERIDO',
      item.codigo || '-',
      item.cor || 'PADRÃO',
      item.descricao + (item.editado ? ' (Ajustado pós-cotação)' : ''),
      qtdSolicDisplay,
      qtdRecebDisplay,
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12], // Orange
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 32 },
      4: { cellWidth: 115 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Inspection & Partial Deliveries Box
  let inspectionDetails = '';
  if (req.registrosEntregas && req.registrosEntregas.length > 0) {
    const entregasText = req.registrosEntregas
      .map((r) => `[${formatDateBR(r.dataRecebimento)} - NF: ${r.numeroNotaFiscal}${r.quantidadeItensRecebidos ? ` (${r.quantidadeItensRecebidos} vol.)` : ''}: ${r.observacao}]`)
      .join('   |   ');
    inspectionDetails += `HISTÓRICO DE ENTREGAS PARCIAIS: ${entregasText} `;
  }
  if (req.observacaoConferencia) {
    inspectionDetails += (inspectionDetails ? ' | ' : '') + `OBSERVAÇÕES: ${req.observacaoConferencia}`;
  }

  const boxH = inspectionDetails ? 26 : 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, finalY, 273, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('ANOTAÇÕES DA INSPEÇÃO DE ESTOQUE / ENTREGAS PARCIAIS / DIVERGÊNCIAS:', 16, finalY + 5.5);

  if (inspectionDetails) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const detailLines = doc.splitTextToSize(inspectionDetails, 265);
    doc.text(detailLines, 16, finalY + 11);
  } else {
    doc.setDrawColor(226, 232, 240);
    doc.line(16, finalY + 11, 279, finalY + 11);
    doc.line(16, finalY + 17, 279, finalY + 17);
    doc.line(16, finalY + 23, 279, finalY + 23);
  }

  // Footer Page info
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ordem de Conferência do Estoque - ${empresa.nomeEmpresa}`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Ordem_Conferencia_${req.codigo}.pdf`);
}

export function generateRelatorioObrasPDF(
  obras: Obra[],
  etapas: EtapaFluxoConfig[],
  empresa: EmpresaConfig,
  filtroVendedorNome?: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Bar (Orange #EA580C)
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');

  // Render Logo
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO GERENCIAL - MAPEAMENTO DE PRODUÇÃO E OBRAS', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  doc.text(`FILTRO: ${filtroVendedorNome ? `Vendedor: ${filtroVendedorNome}` : 'Todas as Obras / Vendedores'}`, 74, 18);

  // Top Company Info Bar + KPI Summary
  const yPos = 30;
  const boxHeight = 22;

  // Left Card: Company Quick Summary
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 134, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(empresa.nomeEmpresa || 'Cabral Esquadrias Ltda', 16, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`CNPJ: ${empresa.cnpj || 'N/D'}  |  TEL: ${empresa.telefone || 'N/D'}  |  E-MAIL: ${empresa.email || 'N/D'}`, 16, yPos + 11.5);
  
  const endResumo = empresa.endereco ? `END: ${empresa.endereco}` : 'Fábrica / Sede Principal';
  const endResumoLines = doc.splitTextToSize(endResumo, 126);
  doc.text(endResumoLines, 16, yPos + 16.5);

  // Right Card: KPI Summary
  const totalObras = obras.length;
  const entregues = obras.filter((o) => o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA').length;
  const emProducao = obras.filter((o) => o.statusGlobal === 'AGENDADA' || o.statusGlobal === 'PENDENCIA').length;
  const totalPecas = obras.reduce((acc, o) => acc + (o.quantidade || 0), 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(151, yPos, 134, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('INDICADORES DO PERÍODO', 155, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL OBRAS: ${totalObras}`, 155, yPos + 12);
  doc.text(`EM PRODUÇÃO: ${emProducao}`, 215, yPos + 12);
  doc.text(`ENTREGUES/FINALIZADAS: ${entregues}`, 155, yPos + 17.5);
  doc.text(`TOTAL DE PEÇAS: ${totalPecas} PÇS`, 215, yPos + 17.5);

  const tableStartY = yPos + boxHeight + 5;

  // Build Dynamic Columns
  const headCols = ['CÓDIGO', 'CLIENTE / OBRA', 'VENDEDOR', 'PRIORID.', 'DT PREV.'];
  etapas.forEach((et) => {
    headCols.push(et.nome.length > 12 ? et.nome.substring(0, 10) + '.' : et.nome);
  });
  headCols.push('STATUS');

  const tableHead = [headCols];

  const tableBody = (obras || []).map((o) => {
    const row = [
      o.codigo,
      o.cliente.length > 25 ? o.cliente.substring(0, 23) + '...' : o.cliente,
      (o.vendedorNome || 'Geral').split(' ')[0],
      o.prioridade,
      formatDateBR(o.dataPrevistaEntrega),
    ];

    (etapas || []).forEach((et) => {
      const st = (o.fluxoEtapas && o.fluxoEtapas[et.id]) || 'NÃO INICIADO';
      let stAbbr = '---';
      if (st === 'EXECUTADO') stAbbr = 'EXEC';
      else if (st === 'EM ANDAMENTO') stAbbr = 'ANDAM';
      else if (st === 'PARADO') stAbbr = 'PARADO';
      else if (st === 'NÃO INICIADO') stAbbr = 'N/INIC';
      row.push(stAbbr);
    });

    row.push(o.statusGlobal);
    return row;
  });

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12], // Orange
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 42 },
      2: { cellWidth: 20 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 18 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = data.cell.raw as string;
        if (val === 'EXEC') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'PARADO') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ANDAM') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  // Footer Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Sistema ERP/SGM de Gerenciamento de Produção e Obras`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Relatorio_Mapeamento_Obras_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =========================================================================
// 1. RELATÓRIO DE EFICIÊNCIA DE PRODUÇÃO & GARGALOS (PDF)
// =========================================================================
export function generateRelatorioEficienciaPDF(
  obras: Obra[],
  etapas: EtapaFluxoConfig[],
  empresa: EmpresaConfig,
  stats: {
    pontualidadeMedia: number;
    leadTimeMedio: number;
    taxaConclusao: number;
    obrasNoPrazo: number;
    obrasAtrasadas: number;
    totalObras: number;
  }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Top Bar
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO EXECUTIVO - EFICIÊNCIA DE PRODUÇÃO & PRAZOS', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  doc.text('FINALIDADE: Avaliação de Produtividade Fabril e Cumprimento de Cronogramas para a Diretoria', 74, 18);

  // Top KPI Card Summary
  const yPos = 30;
  const boxHeight = 22;

  // Box 1: Indicadores Globais
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 273, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('INDICADORES DE PERFORMANCE FABRIL', 16, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL DE OBRAS AVALIADAS: ${stats.totalObras}`, 16, yPos + 12);
  doc.text(`TAXA DE PONTUALIDADE: ${stats.pontualidadeMedia}%`, 90, yPos + 12);
  doc.text(`LEAD TIME MÉDIO: ${stats.leadTimeMedio} DIAS ÚTEIS`, 165, yPos + 12);
  doc.text(`ÍNDICE DE CONCLUSÃO GERAL: ${stats.taxaConclusao}%`, 225, yPos + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`OBRAS ENTREGUES NO PRAZO: ${stats.obrasNoPrazo}`, 16, yPos + 17.5);
  doc.text(`OBRAS COM ATRASO/PENDÊNCIA: ${stats.obrasAtrasadas}`, 90, yPos + 17.5);
  doc.text(`CAPACIDADE DE CUMPRIMENTO: ${stats.pontualidadeMedia >= 80 ? 'ALTA ESTABILIDADE' : 'ATENÇÃO A GARGALOS'}`, 165, yPos + 17.5);

  // Table of Obras Efficiency
  const tableHead = [['CÓDIGO', 'CLIENTE', 'VENDEDOR', 'QTD PEÇAS', 'PRAZO (DIAS)', 'DT PREVISTA', 'PROGRESSO ETAPAS', 'STATUS', 'PONTUALIDADE']];
  const tableBody = (obras || []).map((o) => {
    let executed = 0;
    etapas.forEach((et) => {
      if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') executed++;
    });
    const percentProgresso = etapas.length > 0 ? Math.round((executed / etapas.length) * 100) : 0;
    const isLate = o.statusGlobal !== 'ENTREGUE' && o.statusGlobal !== 'FINALIZADA' && new Date(o.dataPrevistaEntrega) < new Date();

    return [
      o.codigo,
      o.cliente.length > 25 ? o.cliente.substring(0, 23) + '...' : o.cliente,
      (o.vendedorNome || 'Geral').split(' ')[0],
      `${o.quantidade || 0} pçs`,
      `${o.prazoDiasUteis || 15} d`,
      formatDateBR(o.dataPrevistaEntrega),
      `${percentProgresso}% (${executed}/${etapas.length})`,
      o.statusGlobal,
      isLate ? 'ATRASADO' : 'NO PRAZO',
    ];
  });

  autoTable(doc, {
    startY: yPos + boxHeight + 5,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 35 },
      7: { halign: 'center', cellWidth: 25 },
      8: { halign: 'center', cellWidth: 25 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = data.cell.raw as string;
        if (val === 'ATRASADO') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'NO PRAZO') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Relatório de Eficiência Fabril & Prazos`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Relatorio_Eficiencia_Producao_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =========================================================================
// 2. RELATÓRIO DE OBRAS & VOLUME DE PRODUTOS FABRICADOS E ENTREGUES (PDF)
// =========================================================================
export function generateRelatorioObrasEProdutosPDF(
  obras: Obra[],
  etapas: EtapaFluxoConfig[],
  empresa: EmpresaConfig,
  stats: {
    totalObras: number;
    totalProdutosContratados: number;
    totalProdutosFabricados: number;
    totalProdutosEntregues: number;
    totalProdutosEmProducao: number;
  }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Top Bar
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO DE OBRAS & VOLUME DE PRODUTOS FABRICADOS E ENTREGUES', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  doc.text('FINALIDADE: Controle Quantitativo de Peças e Esquadrias Contratadas, Produzidas e Entregues aos Clientes', 74, 18);

  // Top KPI Card Summary
  const yPos = 30;
  const boxHeight = 22;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 273, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('CONSOLIDAÇÃO TOTAL DE PRODUTOS & OBRAS', 16, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL DE OBRAS: ${stats.totalObras}`, 16, yPos + 12);
  doc.text(`PRODUTOS CONTRATADOS: ${stats.totalProdutosContratados} PÇS`, 70, yPos + 12);
  doc.text(`PRODUTOS FABRICADOS: ${stats.totalProdutosFabricados} PÇS`, 140, yPos + 12);
  doc.text(`PRODUTOS ENTREGUES: ${stats.totalProdutosEntregues} PÇS`, 205, yPos + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const percEntregue = stats.totalProdutosContratados > 0
    ? Math.round((stats.totalProdutosEntregues / stats.totalProdutosContratados) * 100)
    : 0;
  const percFabricado = stats.totalProdutosContratados > 0
    ? Math.round((stats.totalProdutosFabricados / stats.totalProdutosContratados) * 100)
    : 0;
  doc.text(`EM PRODUÇÃO ATIVA: ${stats.totalProdutosEmProducao} PÇS`, 16, yPos + 17.5);
  doc.text(`TAXA GLOBAL DE FABRICAÇÃO: ${percFabricado}% DO ESCOPO CONTRATADO`, 70, yPos + 17.5);
  doc.text(`TAXA GLOBAL DE ENTREGA: ${percEntregue}% CONCLUÍDO NO CLIENTE`, 180, yPos + 17.5);

  // Table of Obras with Product counts
  const tableHead = [['CÓDIGO', 'CLIENTE / OBRA', 'VENDEDOR', 'QTD PRODUTOS', 'STATUS GLOBAL', 'AVANÇO FABRIL', 'PRODUTOS FABRICADOS', 'PRODUTOS ENTREGUES', 'DATA PREV.']];
  const tableBody = (obras || []).map((o) => {
    let executed = 0;
    etapas.forEach((et) => {
      if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') executed++;
    });
    const percentAvanco = etapas.length > 0 ? executed / etapas.length : 0;
    const isEntregue = o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA';
    const qtdTotal = o.quantidade || 0;
    const qtdFabricada = isEntregue ? qtdTotal : Math.round(qtdTotal * percentAvanco);
    const qtdEntregue = isEntregue ? qtdTotal : 0;

    return [
      o.codigo,
      o.cliente.length > 25 ? o.cliente.substring(0, 23) + '...' : o.cliente,
      (o.vendedorNome || 'Geral').split(' ')[0],
      `${qtdTotal} peças`,
      o.statusGlobal,
      `${Math.round(percentAvanco * 100)}%`,
      `${qtdFabricada} pçs`,
      isEntregue ? `${qtdEntregue} pçs (100%)` : '0 pçs (Pendente)',
      formatDateBR(o.dataPrevistaEntrega),
    ];
  });

  autoTable(doc, {
    startY: yPos + boxHeight + 5,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 32 },
      7: { halign: 'center', cellWidth: 35 },
      8: { halign: 'center', cellWidth: 24 },
    },
    margin: { left: 12, right: 12 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Relatório de Quantidade de Produtos por Obra`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Relatorio_Obras_Produtos_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =========================================================================
// 3. RELATÓRIO DE CAPACIDADE FABRIL MENSAL & OCUPAÇÃO (PDF)
// =========================================================================
export function generateRelatorioCapacidadeFabrilPDF(
  obras: Obra[],
  empresa: EmpresaConfig,
  capacidadeMensalNominal: number,
  dadosMeses: Array<{
    mes: string;
    produtosProduzidos: number;
    capacidadeNominal: number;
    taxaOcupacao: number;
    obrasAtivas: number;
    statusOcupacao: string;
  }>
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Top Bar
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO EXECUTIVO - CAPACIDADE FABRIL MENSAL & TAXA DE OCUPAÇÃO', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  doc.text('FINALIDADE: Dimensionamento da Carga Fabril, Prevenção de Gargalos e Planejamento de Expansão', 74, 18);

  const yPos = 30;
  const boxHeight = 22;

  // Header Summary Box
  const mesAtual = dadosMeses[dadosMeses.length - 1] || {
    produtosProduzidos: 0,
    taxaOcupacao: 0,
    statusOcupacao: 'NORMAL',
    obrasAtivas: 0,
  };

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 273, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('DIAGNÓSTICO DA CAPACIDADE INSTALADA', 16, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`CAPACIDADE NOMINAL CONFIGURADA: ${capacidadeMensalNominal} PRODUTOS/MÊS`, 16, yPos + 12);
  doc.text(`CARGA DO MÊS ATUAL: ${mesAtual.produtosProduzidos} PRODUTOS`, 125, yPos + 12);
  doc.text(`TAXA DE OCUPAÇÃO ATUAL: ${mesAtual.taxaOcupacao}%`, 200, yPos + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`OBRAS ATIVAS EM SIMULTÂNEO: ${mesAtual.obrasAtivas} OBRAS`, 16, yPos + 17.5);
  doc.text(`STATUS DA OPERAÇÃO: ${mesAtual.statusOcupacao}`, 125, yPos + 17.5);
  doc.text(`MARGEM DISPONÍVEL: ${Math.max(0, capacidadeMensalNominal - mesAtual.produtosProduzidos)} PRODUTOS`, 200, yPos + 17.5);

  // Table of Monthly Historic Capacity
  const tableHead = [['MÊS / ANO', 'CAPACIDADE NOMINAL (PÇS)', 'VOLUME PRODUZIDO (PÇS)', 'TAXA DE OCUPAÇÃO (%)', 'OBRAS ATIVAS', 'STATUS DE CARGA FABRIL', 'DISPONIBILIDADE']];
  const tableBody = dadosMeses.map((m) => {
    const disp = m.capacidadeNominal - m.produtosProduzidos;
    const dispStr = disp >= 0 ? `+${disp} pçs livres` : `${Math.abs(disp)} pçs sobrecarga`;
    return [
      m.mes,
      `${m.capacidadeNominal} pçs`,
      `${m.produtosProduzidos} pçs`,
      `${m.taxaOcupacao}%`,
      `${m.obrasAtivas} obras`,
      m.statusOcupacao,
      dispStr,
    ];
  });

  autoTable(doc, {
    startY: yPos + boxHeight + 5,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 40 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 30 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 48 },
      6: { halign: 'center', cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = data.cell.raw as string;
        if (val === 'SOBRECARGA') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ALTA OCUPAÇÃO') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'NORMAL / SAUDÁVEL') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Relatório de Capacidade Fabril Mensal`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Relatorio_Capacidade_Fabril_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =========================================================================
// 4. RELATÓRIO DA CALCULADORA PREDITIVA DE PRODUÇÃO & CHEGADA DE INSUMOS (PDF)
// =========================================================================
export function generateRelatorioCalculadoraEstatisticasPDF(
  empresa: EmpresaConfig,
  simulacao: {
    quantidadePecas: number;
    previsaoVidros: string;
    previsaoMateriais?: string;
    previsaoPerfis?: string;
    tipoLinha: string;
    diasFabricacaoOtimista: number;
    diasFabricacaoMedio: number;
    diasFabricacaoPessimista: number;
    dataInicioProducao: string;
    dataTerminoFabricacaoOtimista?: string;
    dataTerminoFabricacaoMedio: string;
    dataTerminoFabricacaoPessimista?: string;
    dataSugeridaEntrega: string;
    probabilidadePrazo: number;
    ritmoHistoricoPecasPorDia: number;
    leadTimeMedioHistorico: number;
    mesMenorDesempenho?: { mes: string; pecas: number; ritmo: number };
    mesMediano?: { mes: string; pecas: number; ritmo: number };
    mesAltaPerformance?: { mes: string; pecas: number; ritmo: number };
    observacoesEstrategicas: string[];
  }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Top Bar
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PARECER ESTATÍSTICO & CALCULADORA PREDITIVA DE PRODUÇÃO', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  doc.text('FINALIDADE: Estimativa Estatística Preditiva com Base nas Produções Mensais e Chegada de Insumos', 74, 18);

  const yPos = 30;

  // Left Card: Simulation Input Parameters
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 132, 45, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(234, 88, 12);
  doc.text('PARÂMETROS DA SIMULAÇÃO (ENTRADAS)', 16, yPos + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`QUANTIDADE DE PRODUTOS / PEÇAS:`, 16, yPos + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${simulacao.quantidadePecas} peças / esquadrias`, 78, yPos + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`PREVISÃO DE CHEGADA DE VIDROS:`, 16, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(simulacao.previsaoVidros ? formatDateBR(simulacao.previsaoVidros) : 'Já em Estoque / Imediato', 78, yPos + 22);

  doc.setFont('helvetica', 'bold');
  doc.text(`PREVISÃO DE CHEGADA DE MATERIAIS:`, 16, yPos + 29);
  doc.setFont('helvetica', 'normal');
  const matDate = simulacao.previsaoMateriais || simulacao.previsaoPerfis;
  doc.text(matDate ? formatDateBR(matDate) : 'Já em Estoque / Imediato', 78, yPos + 29);

  doc.setFont('helvetica', 'bold');
  doc.text(`LINHA / COMPLEXIDADE TÉCNICA:`, 16, yPos + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(simulacao.tipoLinha, 78, yPos + 36);

  // Right Card: Historical Baseline (Monthly Real Outputs)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(153, yPos, 132, 45, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(234, 88, 12);
  doc.text('BASE HISTÓRICA DE PRODUÇÃO MENSAL (ENTREGAS REAIS)', 157, yPos + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`MÊS DE ALTA PERFORMANCE (RECORD):`, 157, yPos + 15);
  doc.setFont('helvetica', 'normal');
  const txtAlta = simulacao.mesAltaPerformance
    ? `${simulacao.mesAltaPerformance.mes} (${simulacao.mesAltaPerformance.pecas} pçs - ${simulacao.mesAltaPerformance.ritmo.toFixed(1)} pçs/dia)`
    : `${simulacao.ritmoHistoricoPecasPorDia.toFixed(1)} pçs/dia útil`;
  doc.text(txtAlta, 222, yPos + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`MÊS MEDIANO / RITMO MÉDIO REAL:`, 157, yPos + 22);
  doc.setFont('helvetica', 'normal');
  const txtMedio = simulacao.mesMediano
    ? `${simulacao.mesMediano.mes} (${simulacao.mesMediano.pecas} pçs - ${simulacao.mesMediano.ritmo.toFixed(1)} pçs/dia)`
    : `${simulacao.ritmoHistoricoPecasPorDia.toFixed(1)} pçs/dia útil`;
  doc.text(txtMedio, 222, yPos + 22);

  doc.setFont('helvetica', 'bold');
  doc.text(`MÊS DE MENOR ENTREGA (CONSERVADOR):`, 157, yPos + 29);
  doc.setFont('helvetica', 'normal');
  const txtMenor = simulacao.mesMenorDesempenho
    ? `${simulacao.mesMenorDesempenho.mes} (${simulacao.mesMenorDesempenho.pecas} pçs - ${simulacao.mesMenorDesempenho.ritmo.toFixed(1)} pçs/dia)`
    : `${(simulacao.ritmoHistoricoPecasPorDia * 0.6).toFixed(1)} pçs/dia útil`;
  doc.text(txtMenor, 222, yPos + 29);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INÍCIO LIBERADO (INSUMOS DISPONÍVEIS):`, 157, yPos + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(formatDateBR(simulacao.dataInicioProducao), 222, yPos + 36);

  // Scenarios Comparison Table
  const tableHead = [['CENÁRIO PREDITIVO (BASE MENSAL)', 'DIAS ÚTEIS FABRIL', 'DATA TÉRMINO FABRICAÇÃO', 'DATA SUGERIDA ENTREGA / INSTALAÇÃO', 'CONFIANÇA ESTATÍSTICA']];
  const tableBody = [
    [
      'CENÁRIO OTIMISTA (Mês de Alta Performance)',
      `${simulacao.diasFabricacaoOtimista} dias úteis`,
      formatDateBR(simulacao.dataTerminoFabricacaoOtimista || simulacao.dataTerminoFabricacaoMedio),
      formatDateBR(simulacao.dataTerminoFabricacaoOtimista || simulacao.dataTerminoFabricacaoMedio),
      '95% de probabilidade em regime de alta produtividade',
    ],
    [
      'CENÁRIO MAIS PROVÁVEL (Mês Mediano - Recomendado)',
      `${simulacao.diasFabricacaoMedio} dias úteis`,
      formatDateBR(simulacao.dataTerminoFabricacaoMedio),
      formatDateBR(simulacao.dataSugeridaEntrega),
      '85% - Prazo comercial recomendado para fechamento de contrato',
    ],
    [
      'CENÁRIO CONSERVADOR / CRÍTICO (Mês Menos Entregas)',
      `${simulacao.diasFabricacaoPessimista} dias úteis`,
      formatDateBR(simulacao.dataTerminoFabricacaoPessimista || simulacao.dataSugeridaEntrega),
      formatDateBR(simulacao.dataTerminoFabricacaoPessimista || simulacao.dataSugeridaEntrega),
      '99% de segurança mesmo com gargalos ou atraso de insumos',
    ],
  ];

  autoTable(doc, {
    startY: yPos + 50,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 48 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 55 },
      4: { cellWidth: 65 },
    },
    margin: { left: 12, right: 12 },
  });

  // Directorial Recommendations Box
  const recStartY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(12, recStartY, 273, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text('PARECER ESTRATÉGICO & RECOMENDAÇÃO PARA A DIRETORIA', 16, recStartY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  let recLineY = recStartY + 14;
  simulacao.observacoesEstrategicas.forEach((obs) => {
    doc.text(`• ${obs}`, 16, recLineY);
    recLineY += 5;
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Parecer Estatístico Preditivo de Produção`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Parecer_Preditivo_Producao_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =========================================================================
// 4.5. RELATÓRIO DE VENDAS & CARTEIRA POR VENDEDOR (PDF)
// =========================================================================
export function generateRelatorioVendasEVendedoresPDF(
  obras: Obra[],
  empresa: EmpresaConfig,
  filtroVendedorNome?: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Bar (Orange #EA580C)
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');

  // Render Logo
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO DE VENDAS & CARTEIRA DE OBRAS POR VENDEDOR', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  
  const nomeVendedorDisplay = filtroVendedorNome && filtroVendedorNome !== 'TODOS'
    ? filtroVendedorNome.toUpperCase()
    : 'TODOS OS VENDEDORES';
  doc.text(`VENDEDOR SELECIONADO: ${nomeVendedorDisplay}`, 74, 18);

  const yPos = 30;
  const boxHeight = 22;

  // Left Card: Company Quick Summary
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 134, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(empresa.nomeEmpresa || 'Cabral Esquadrias Ltda', 16, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`CNPJ: ${empresa.cnpj || 'N/D'}  |  TEL: ${empresa.telefone || 'N/D'}  |  E-MAIL: ${empresa.email || 'N/D'}`, 16, yPos + 11.5);
  
  const endResumo = empresa.endereco ? `END: ${empresa.endereco}` : 'Fábrica / Sede Principal';
  const endResumoLines = doc.splitTextToSize(endResumo, 126);
  doc.text(endResumoLines, 16, yPos + 16.5);

  // Right Card: KPI Summary of this vendor / filtered list
  const totalObras = obras.length;
  const totalPecas = obras.reduce((acc, o) => acc + (o.quantidade || 0), 0);
  const entregues = obras.filter((o) => o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA').length;
  const emProducao = obras.filter((o) => o.statusGlobal === 'AGENDADA' || o.statusGlobal === 'PENDENCIA' || o.statusGlobal === 'NÃO AGENDADA').length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(151, yPos, 134, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text(`INDICADORES DE VENDAS - ${nomeVendedorDisplay}`, 155, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL DE OBRAS: ${totalObras}`, 155, yPos + 12);
  doc.text(`TOTAL DE PEÇAS: ${totalPecas} PÇS`, 220, yPos + 12);
  doc.text(`OBRAS ENTREGUES: ${entregues}`, 155, yPos + 17.5);
  doc.text(`EM ANDAMENTO / AGENDADAS: ${emProducao}`, 220, yPos + 17.5);

  const tableStartY = yPos + boxHeight + 5;

  // Table Columns with explicit DATA AGENDADA
  const tableHead = [
    [
      'CÓDIGO',
      'CLIENTE / OBRA',
      'VENDEDOR',
      'QTD PEÇAS',
      'STATUS GLOBAL',
      'DATA AGENDADA / PREVISTA',
      'PRAZO (DIAS)',
      'PRIORIDADE',
    ],
  ];

  const tableBody = (obras || []).map((o) => {
    return [
      o.codigo,
      o.cliente.length > 32 ? o.cliente.substring(0, 30) + '...' : o.cliente,
      o.vendedorNome || 'Geral',
      `${o.quantidade || 0} pçs`,
      o.statusGlobal || 'NÃO AGENDADA',
      formatDateBR(o.dataPrevistaEntrega) || 'A DEFINIR',
      `${o.prazoDiasUteis || 15} dias úteis`,
      o.prioridade || 'MÉDIA',
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 },
      1: { cellWidth: 62 },
      2: { cellWidth: 38 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 36 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 38 },
      6: { halign: 'center', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 23 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = data.cell.raw as string;
        if (val === 'ENTREGUE' || val === 'FINALIZADA') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'PENDENCIA' || val === 'PARADO') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'AGENDADA') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Relatório de Vendas e Obras por Vendedor`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Relatorio_Vendas_${nomeVendedorDisplay.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =========================================================================
// 5. RELATÓRIO EXECUTIVO COMPLETO (DOSSIÊ 360° PARA A DIRETORIA) (PDF)
// =========================================================================
export function generateRelatorioDiretoriaCompletoPDF(
  obras: Obra[],
  etapas: EtapaFluxoConfig[],
  empresa: EmpresaConfig,
  resumo: {
    totalObras: number;
    totalProdutos: number;
    produtosFabricados: number;
    produtosEntregues: number;
    pontualidadeGeral: number;
    leadTimeMedio: number;
    eficienciaMedia: number;
    capacidadeMensalNominal: number;
  }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Top Bar
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 297, 26, 'F');
  renderCompanyLogo(doc, empresa, 12, 3, 56, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DOSSIÊ EXECUTIVO GERAL DE PRODUÇÃO & CAPACIDADE - DIRETORIA', 74, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 285, 14, { align: 'right' });
  doc.text('CONSOLIDAÇÃO COMPLETA: Visão Global, Eficiência Fabril, Volume de Produtos e Capacidade', 74, 18);

  const yPos = 30;
  const boxHeight = 22;

  // Master KPI Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, yPos, 273, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('SUMÁRIO EXECUTIVO DA DIRETORIA', 16, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL OBRAS: ${resumo.totalObras}`, 16, yPos + 12);
  doc.text(`PRODUTOS CONTRATADOS: ${resumo.totalProdutos} PÇS`, 70, yPos + 12);
  doc.text(`PRODUTOS FABRICADOS: ${resumo.produtosFabricados} PÇS`, 140, yPos + 12);
  doc.text(`PRODUTOS ENTREGUES: ${resumo.produtosEntregues} PÇS`, 205, yPos + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`PONTUALIDADE GERAL: ${resumo.pontualidadeGeral}%`, 16, yPos + 17.5);
  doc.text(`LEAD TIME MÉDIO: ${resumo.leadTimeMedio} DIAS ÚTEIS`, 70, yPos + 17.5);
  doc.text(`ÍNDICE DE EFICIÊNCIA FABRIL: ${resumo.eficienciaMedia}%`, 140, yPos + 17.5);
  doc.text(`CAPACIDADE NOMINAL: ${resumo.capacidadeMensalNominal} PÇS/MÊS`, 205, yPos + 17.5);

  // Table of all works with full metrics
  const tableHead = [['CÓDIGO', 'CLIENTE / OBRA', 'VENDEDOR', 'QTD PRODUTOS', 'STATUS', 'ETAPAS AVANÇO', 'FABRICADOS', 'ENTREGUES', 'PRAZO DIAS', 'PREVISÃO']];
  const tableBody = (obras || []).map((o) => {
    let executed = 0;
    etapas.forEach((et) => {
      if (o.fluxoEtapas && o.fluxoEtapas[et.id] === 'EXECUTADO') executed++;
    });
    const percentAvanco = etapas.length > 0 ? executed / etapas.length : 0;
    const isEntregue = o.statusGlobal === 'ENTREGUE' || o.statusGlobal === 'FINALIZADA';
    const qtdTotal = o.quantidade || 0;
    const qtdFabricada = isEntregue ? qtdTotal : Math.round(qtdTotal * percentAvanco);
    const qtdEntregue = isEntregue ? qtdTotal : 0;

    return [
      o.codigo,
      o.cliente.length > 22 ? o.cliente.substring(0, 20) + '...' : o.cliente,
      (o.vendedorNome || 'Geral').split(' ')[0],
      `${qtdTotal} pçs`,
      o.statusGlobal,
      `${Math.round(percentAvanco * 100)}%`,
      `${qtdFabricada} pçs`,
      `${qtdEntregue} pçs`,
      `${o.prazoDiasUteis || 15}d`,
      formatDateBR(o.dataPrevistaEntrega),
    ];
  });

  autoTable(doc, {
    startY: yPos + boxHeight + 5,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 46 },
      2: { cellWidth: 22 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 12, right: 12 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${empresa.nomeEmpresa} - Dossiê Executivo Geral de Produção (Diretoria)`, 12, 202);
    doc.text(`Página ${i} de ${pageCount}`, 285, 202, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  doc.save(`Dossie_Executivo_Diretoria_${new Date().toISOString().split('T')[0]}.pdf`);
}

