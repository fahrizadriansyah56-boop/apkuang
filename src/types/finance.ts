export type TransactionType = 'masuk' | 'keluar';

export interface Transaction {
  id: string;
  code: string;
  date: string;
  category: string; // e.g. Divisi (Acara, Konsumsi, etc) or Pemasukan source (Iuran, Sponsor, Registrasi)
  description: string;
  type: TransactionType;
  amount: number;
  hasProof: boolean;
  proofUrl?: string;
  proofName?: string;
  paymentMethod: string; // Transfer Bank, Tunai, QRIS, dll
  pic?: string;
  notes?: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string; // misal: pcs, porsi, paket, hari, rim
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface DivisionBudget {
  id: string;
  name: string; // misal: Divisi Acara, Divisi Konsumsi
  code: string;
  budgetedAmount: number; // Anggaran RAB awal
  pic: string; // Koordinator Divisi
  description: string;
  items: BudgetItem[];
}

export interface CommitteeFee {
  id: string;
  memberName: string;
  divisionOrRole: string; // misal: Ketua Pelaksana, Koordinator Konsumsi, Staff Acara
  targetAmount: number; // Jumlah yang harus dibayar
  paidAmount: number; // Jumlah yang sudah dibayar
  status: 'lunas' | 'sebagian' | 'belum';
  lastPaidDate?: string;
  paymentMethod?: string;
  phone?: string;
  notes?: string;
}

export interface SponsorshipTerm {
  termNumber: number;
  percentage: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'lunas' | 'menunggu' | 'jatuh_tempo';
}

export interface Sponsorship {
  id: string;
  sponsorName: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Media Partner' | 'Donatur Perorangan';
  committedAmount: number;
  receivedAmount: number;
  terms: SponsorshipTerm[];
  invoiceStatus: 'Lengkap' | 'Menunggu Kuitansi' | 'MoU Ditandatangani';
  picContact: string;
  contactPhone?: string;
  notes?: string;
  mouDate?: string;
}

export interface CommitteeInfo {
  eventName: string;
  eventTheme: string;
  organization: string;
  budgetPeriod: string;
  eventDate: string;
  venue: string;
  chairpersonName: string;
  treasurerName: string;
  targetTotalBudget: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  type: 'iuran' | 'tagihan_vendor' | 'termin_sponsor';
  status: 'pending' | 'selesai';
  relatedEntity: string;
}

export type ActivePage = 'dashboard' | 'rab' | 'transaksi' | 'iuran-sponsor' | 'laporan';
