/**
 * Business days utility for Brazilian calendar (skipping Sat & Sun)
 */

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function addBusinessDays(startDateStr: string, businessDays: number): string {
  if (!startDateStr || isNaN(businessDays)) return startDateStr || formatDateISO(new Date());
  
  let date = parseLocalDate(startDateStr);
  let added = 0;
  
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return formatDateISO(date);
}

export function isOverdue(dueDateStr: string | undefined | null, currentStatus: string): boolean {
  if (!dueDateStr) return false;
  if (['ENTREGUE', 'FINALIZADA'].includes(currentStatus)) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = parseLocalDate(dueDateStr);
  due.setHours(0, 0, 0, 0);
  
  return today > due;
}

export function getDaysRemaining(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = parseLocalDate(dueDateStr);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDateExtenso(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const ano = date.getFullYear();
  return `${dia} DE ${mes} DE ${ano}`;
}

export function generateRequisicaoCodigo(fornecedorNome: string, dateStr: string): string {
  const cleanFornecedor = (fornecedorNome || 'fornecedor')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^A-Za-z0-9]/g, '')    // keep alphanumeric
    .toLowerCase();

  let ddmmyyyy = '';
  const parts = (dateStr || '').split('-');
  if (parts.length === 3) {
    // dateStr is YYYY-MM-DD -> parts[0]=YYYY, parts[1]=MM, parts[2]=DD
    ddmmyyyy = `${parts[2]}${parts[1]}${parts[0]}`;
  } else {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    ddmmyyyy = `${dd}${mm}${yyyy}`;
  }

  return `${cleanFornecedor}${ddmmyyyy}`;
}
