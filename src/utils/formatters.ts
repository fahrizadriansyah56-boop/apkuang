export const formatRupiah = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseRupiahInput = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const formatDateFull = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const formatPercent = (value: number, decimals = 1): string => {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const createWhatsAppReminderLink = (phone: string | undefined, memberName: string, amountRemaining: number, eventName: string): string => {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const message = `Halo ${memberName}, salam hangat dari Bendahara Panitia ${eventName}. Mengingatkan untuk iuran panitia sebesar ${formatRupiah(amountRemaining)}. Mohon konfirmasinya jika sudah melakukan transfer ya. Terima kasih! 🙏`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export const downloadCSV = (
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  delimiter = ';'
) => {
  const processCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(processCell).join(delimiter),
    ...rows.map(row => row.map(processCell).join(delimiter))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
