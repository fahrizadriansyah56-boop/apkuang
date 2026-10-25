import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  ActivePage,
  BudgetItem,
  CommitteeFee,
  CommitteeInfo,
  DivisionBudget,
  ReminderItem,
  Sponsorship,
  Transaction,
} from '../types/finance';
import {
  INITIAL_COMMITTEE_FEES,
  INITIAL_COMMITTEE_INFO,
  INITIAL_DIVISIONS,
  INITIAL_REMINDERS,
  INITIAL_SPONSORSHIPS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';
import { UserRole } from '../types/auth';
import { ApiError, apiRequest } from '../utils/api';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface FinanceContextType {
  // Navigation & Page State
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;

  // Master Data
  committeeInfo: CommitteeInfo;
  divisions: DivisionBudget[];
  transactions: Transaction[];
  committeeFees: CommitteeFee[];
  sponsorships: Sponsorship[];
  reminders: ReminderItem[];
  userRole: UserRole;
  canWrite: boolean;
  isDataLoading: boolean;
  dataLoadError: string | null;

  // Automatic Computations
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  totalRAB: number;
  budgetRealizationRate: number;
  getDivisionSpent: (divisionNameOrCode: string) => number;
  getDivisionRealization: (division: DivisionBudget) => {
    spent: number;
    remaining: number;
    percent: number;
    isOverBudget: boolean;
  };

  // KPI Metrics
  totalFeeTarget: number;
  totalFeeCollected: number;
  totalSponsorCommitted: number;
  totalSponsorReceived: number;

  // Transactions CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'code'> & { code?: string }) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Divisions & RAB CRUD
  addDivision: (div: Omit<DivisionBudget, 'id'>) => void;
  updateDivision: (id: string, div: Partial<DivisionBudget>) => void;
  deleteDivision: (id: string) => void;
  addBudgetItem: (divisionId: string, item: Omit<BudgetItem, 'id'>) => void;
  deleteBudgetItem: (divisionId: string, itemId: string) => void;

  // Committee Fees CRUD
  addCommitteeFeeMember: (member: Omit<CommitteeFee, 'id'>) => void;
  updateCommitteeFee: (id: string, fee: Partial<CommitteeFee>) => void;
  recordFeePayment: (id: string, amount: number, paymentMethod: string) => void;
  deleteCommitteeFee: (id: string) => void;

  // Sponsorships CRUD
  addSponsorship: (spons: Omit<Sponsorship, 'id'>) => void;
  updateSponsorship: (id: string, spons: Partial<Sponsorship>) => void;
  recordSponsorPayment: (sponsorId: string, termNumber: number, amount: number) => void;
  deleteSponsorship: (id: string) => void;

  // Reminders & Info
  updateCommitteeInfo: (info: Partial<CommitteeInfo>) => void;
  toggleReminderStatus: (id: string) => void;
  addReminder: (reminder: Omit<ReminderItem, 'id'>) => void;
  deleteReminder: (id: string) => void;

  // Reset & Backup
  resetToDefaultData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;

  // Modals & UI helpers
  isTransactionModalOpen: boolean;
  openTransactionModal: (initialType?: 'masuk' | 'keluar', initialCategory?: string, editTx?: Transaction) => void;
  closeTransactionModal: () => void;
  editingTransaction: Transaction | null;

  viewingReceipt: {
    name: string;
    url?: string;
    description?: string;
    amount?: number;
    date?: string;
    code?: string;
    category?: string;
  } | null;
  setViewingReceipt: (receipt: any) => void;

  // Notifications
  toasts: ToastData[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
  accessToken: string;
  userRole: UserRole;
}

interface FinanceData {
  committeeInfo: CommitteeInfo;
  divisions: DivisionBudget[];
  transactions: Transaction[];
  committeeFees: CommitteeFee[];
  sponsorships: Sponsorship[];
  reminders: ReminderItem[];
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children, accessToken, userRole }) => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [committeeInfo, setCommitteeInfo] = useState<CommitteeInfo>(INITIAL_COMMITTEE_INFO);
  const [divisions, setDivisions] = useState<DivisionBudget[]>(INITIAL_DIVISIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [committeeFees, setCommitteeFees] = useState<CommitteeFee[]>(INITIAL_COMMITTEE_FEES);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>(INITIAL_SPONSORSHIPS);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const dataVersion = React.useRef(0);
  const skipNextPersist = React.useRef(false);
  const canWrite = userRole !== 'viewer';

  // Modal & Toast states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Toast Handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const rejectReadOnly = () => {
    if (canWrite) return false;
    showToast('Akun ini hanya memiliki akses untuk melihat data.', 'error');
    return true;
  };

  useEffect(() => {
    let isCurrent = true;
    setIsDataLoading(true);
    setDataLoadError(null);
    apiRequest<{ data: FinanceData; version: number }>('/api/data', accessToken)
      .then(({ data, version }) => {
        if (!isCurrent) return;
        skipNextPersist.current = true;
        setCommitteeInfo(data.committeeInfo);
        setDivisions(data.divisions);
        setTransactions(data.transactions);
        setCommitteeFees(data.committeeFees);
        setSponsorships(data.sponsorships);
        setReminders(data.reminders);
        dataVersion.current = version;
        setIsDataInitialized(true);
      })
      .catch(error => {
        if (isCurrent) setDataLoadError(error instanceof Error ? error.message : 'Gagal memuat data panitia.');
      })
      .finally(() => {
        if (isCurrent) setIsDataLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!isDataInitialized || !canWrite) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    const data: FinanceData = {
      committeeInfo,
      divisions,
      transactions,
      committeeFees,
      sponsorships,
      reminders,
    };
    const timer = window.setTimeout(() => {
      apiRequest<{ version: number }>('/api/data', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ data, version: dataVersion.current }),
      })
        .then(({ version }) => {
          dataVersion.current = version;
        })
        .catch(async error => {
          if (error instanceof ApiError && error.status === 409) {
            try {
              const latest = await apiRequest<{ data: FinanceData; version: number }>('/api/data', accessToken);
              skipNextPersist.current = true;
              dataVersion.current = latest.version;
              setCommitteeInfo(latest.data.committeeInfo);
              setDivisions(latest.data.divisions);
              setTransactions(latest.data.transactions);
              setCommitteeFees(latest.data.committeeFees);
              setSponsorships(latest.data.sponsorships);
              setReminders(latest.data.reminders);
              showToast('Data berubah di perangkat lain. Data terbaru dimuat; perubahan yang belum tersimpan tidak diterapkan.', 'error');
            } catch (reloadError) {
              showToast(reloadError instanceof Error ? reloadError.message : 'Gagal memuat data terbaru.', 'error');
            }
            return;
          }
          showToast(error instanceof Error ? error.message : 'Gagal menyimpan data panitia.', 'error');
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [accessToken, canWrite, committeeInfo, divisions, transactions, committeeFees, sponsorships, reminders, isDataInitialized]);

  // Core Automatic Calculations
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'masuk')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'keluar')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  // Saldo Sisa = Total Pemasukan - Total Pengeluaran
  const currentBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const totalRAB = useMemo(() => {
    return divisions.reduce((sum, d) => sum + (Number(d.budgetedAmount) || 0), 0);
  }, [divisions]);

  const budgetRealizationRate = useMemo(() => {
    if (totalRAB === 0) return 0;
    return (totalExpense / totalRAB) * 100;
  }, [totalExpense, totalRAB]);

  // Division spent helper - matches category string against division name or code
  const getDivisionSpent = (divisionIdentifier: string): number => {
    const cleanId = divisionIdentifier.toLowerCase().trim();
    return transactions
      .filter(t => t.type === 'keluar')
      .filter(t => {
        const cat = t.category.toLowerCase().trim();
        return cat.includes(cleanId) || cleanId.includes(cat);
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  const getDivisionRealization = (division: DivisionBudget) => {
    const spent = getDivisionSpent(division.name);
    const budgeted = division.budgetedAmount || 1;
    const remaining = budgeted - spent;
    const percent = (spent / budgeted) * 100;
    return {
      spent,
      remaining,
      percent,
      isOverBudget: spent > budgeted,
    };
  };

  // Fees KPI
  const totalFeeTarget = useMemo(() => {
    return committeeFees.reduce((sum, f) => sum + (Number(f.targetAmount) || 0), 0);
  }, [committeeFees]);

  const totalFeeCollected = useMemo(() => {
    return committeeFees.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
  }, [committeeFees]);

  // Sponsor KPI
  const totalSponsorCommitted = useMemo(() => {
    return sponsorships.reduce((sum, s) => sum + (Number(s.committedAmount) || 0), 0);
  }, [sponsorships]);

  const totalSponsorReceived = useMemo(() => {
    return sponsorships.reduce((sum, s) => sum + (Number(s.receivedAmount) || 0), 0);
  }, [sponsorships]);

  // Transactions CRUD
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'code'> & { code?: string }) => {
    if (rejectReadOnly()) return;
    const year = new Date().getFullYear();
    const count = transactions.length + 1;
    const code = tx.code || `TRX-${year}-${String(count).padStart(3, '0')}`;
    const newTx: Transaction = {
      ...tx,
      id: 'trx-' + Date.now().toString(),
      code,
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [newTx, ...prev]);
    showToast(`Transaksi ${newTx.code} berhasil dicatat.`);
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    if (rejectReadOnly()) return;
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    showToast('Data transaksi berhasil diperbarui.');
  };

  const deleteTransaction = (id: string) => {
    if (rejectReadOnly()) return;
    const target = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast(`Transaksi ${target ? target.code : ''} telah dihapus.`, 'info');
  };

  // Division & RAB CRUD
  const addDivision = (div: Omit<DivisionBudget, 'id'>) => {
    if (rejectReadOnly()) return;
    const newDiv: DivisionBudget = {
      ...div,
      id: 'div-' + Date.now().toString(),
    };
    setDivisions(prev => [...prev, newDiv]);
    showToast(`Divisi ${newDiv.name} berhasil ditambahkan ke RAB.`);
  };

  const updateDivision = (id: string, updated: Partial<DivisionBudget>) => {
    if (rejectReadOnly()) return;
    setDivisions(prev => prev.map(d => (d.id === id ? { ...d, ...updated } : d)));
    showToast('Anggaran divisi berhasil diperbarui.');
  };

  const deleteDivision = (id: string) => {
    if (rejectReadOnly()) return;
    const target = divisions.find(d => d.id === id);
    setDivisions(prev => prev.filter(d => d.id !== id));
    showToast(`Divisi ${target ? target.name : ''} telah dihapus.`, 'info');
  };

  const addBudgetItem = (divisionId: string, item: Omit<BudgetItem, 'id'>) => {
    if (rejectReadOnly()) return;
    const newItem: BudgetItem = {
      ...item,
      id: 'item-' + Date.now().toString(),
    };
    setDivisions(prev =>
      prev.map(d => {
        if (d.id !== divisionId) return d;
        const newItems = [...d.items, newItem];
        return {
          ...d,
          items: newItems,
          budgetedAmount: newItems.reduce((sum, it) => sum + it.total, 0),
        };
      })
    );
    showToast(`Item ${item.itemName} ditambahkan ke rincian RAB.`);
  };

  const deleteBudgetItem = (divisionId: string, itemId: string) => {
    if (rejectReadOnly()) return;
    setDivisions(prev =>
      prev.map(d => {
        if (d.id !== divisionId) return d;
        const remainingItems = d.items.filter(it => it.id !== itemId);
        return {
          ...d,
          items: remainingItems,
          budgetedAmount: remainingItems.reduce((sum, it) => sum + it.total, 0),
        };
      })
    );
    showToast('Item rincian anggaran telah dihapus.', 'info');
  };

  // Committee Fees CRUD
  const addCommitteeFeeMember = (member: Omit<CommitteeFee, 'id'>) => {
    if (rejectReadOnly()) return;
    const newFee: CommitteeFee = {
      ...member,
      id: 'fee-' + Date.now().toString(),
    };
    setCommitteeFees(prev => [...prev, newFee]);
    showToast(`Panitia ${newFee.memberName} ditambahkan ke daftar iuran.`);
  };

  const updateCommitteeFee = (id: string, updated: Partial<CommitteeFee>) => {
    if (rejectReadOnly()) return;
    setCommitteeFees(prev => prev.map(f => (f.id === id ? { ...f, ...updated } : f)));
    showToast('Status iuran anggota diperbarui.');
  };

  const recordFeePayment = (id: string, amount: number, paymentMethod: string) => {
    if (rejectReadOnly()) return;
    setCommitteeFees(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const newPaid = f.paidAmount + amount;
        const newStatus = newPaid >= f.targetAmount ? 'lunas' : 'sebagian';
        return {
          ...f,
          paidAmount: newPaid,
          status: newStatus,
          lastPaidDate: new Date().toISOString().split('T')[0],
          paymentMethod,
        };
      })
    );

    // Auto-record to general transactions as income
    const targetMember = committeeFees.find(f => f.id === id);
    if (targetMember) {
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        category: 'Kas Iuran Panitia',
        description: `Setoran Iuran Panitia - ${targetMember.memberName} (${targetMember.divisionOrRole})`,
        type: 'masuk',
        amount,
        hasProof: true,
        proofName: `bukti_iuran_${targetMember.memberName.toLowerCase().replace(/\s+/g, '_')}.png`,
        paymentMethod,
        pic: 'Alya Syahrani (Bendahara)',
        notes: `Pembayaran iuran kas panitia via ${paymentMethod}`,
      });
    }

    showToast(`Pembayaran iuran tercatat dan masuk ke kas.`);
  };

  const deleteCommitteeFee = (id: string) => {
    if (rejectReadOnly()) return;
    setCommitteeFees(prev => prev.filter(f => f.id !== id));
    showToast('Anggota iuran dihapus dari daftar.', 'info');
  };

  // Sponsorship CRUD
  const addSponsorship = (spons: Omit<Sponsorship, 'id'>) => {
    if (rejectReadOnly()) return;
    const newSpons: Sponsorship = {
      ...spons,
      id: 'spons-' + Date.now().toString(),
    };
    setSponsorships(prev => [...prev, newSpons]);
    showToast(`Mitra sponsor ${newSpons.sponsorName} berhasil ditambahkan.`);
  };

  const updateSponsorship = (id: string, updated: Partial<Sponsorship>) => {
    if (rejectReadOnly()) return;
    setSponsorships(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
    showToast('Data sponsorship diperbarui.');
  };

  const recordSponsorPayment = (sponsorId: string, termNumber: number, amount: number) => {
    if (rejectReadOnly()) return;
    const today = new Date().toISOString().split('T')[0];
    let sponsorName = '';

    setSponsorships(prev =>
      prev.map(s => {
        if (s.id !== sponsorId) return s;
        sponsorName = s.sponsorName;
        const updatedTerms = s.terms.map(t =>
          t.termNumber === termNumber ? { ...t, status: 'lunas' as const, paidDate: today } : t
        );
        const newReceived = s.receivedAmount + amount;
        return {
          ...s,
          receivedAmount: newReceived,
          terms: updatedTerms,
        };
      })
    );

    // Auto-create income transaction
    if (sponsorName) {
      addTransaction({
        date: today,
        category: 'Sponsorship',
        description: `Pencairan Termin ${termNumber} Sponsorship ${sponsorName}`,
        type: 'masuk',
        amount,
        hasProof: true,
        proofName: `kuitansi_termin_${termNumber}_${sponsorName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        paymentMethod: 'Transfer Bank Rekening Panitia',
        pic: 'Alya Syahrani (Bendahara)',
        notes: `Pencairan termin sponsorship ${sponsorName}`,
      });
    }

    showToast(`Pencairan termin ${termNumber} sponsor berhasil dicatat.`);
  };

  const deleteSponsorship = (id: string) => {
    if (rejectReadOnly()) return;
    setSponsorships(prev => prev.filter(s => s.id !== id));
    showToast('Data sponsorship dihapus.', 'info');
  };

  // Reminders & Info
  const updateCommitteeInfo = (info: Partial<CommitteeInfo>) => {
    if (rejectReadOnly()) return;
    setCommitteeInfo(prev => ({ ...prev, ...info }));
    showToast('Informasi kepanitiaan berhasil diperbarui.');
  };

  const toggleReminderStatus = (id: string) => {
    if (rejectReadOnly()) return;
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, status: r.status === 'pending' ? 'selesai' : 'pending' } : r))
    );
    showToast('Status pengingat diperbarui.');
  };

  const addReminder = (rem: Omit<ReminderItem, 'id'>) => {
    if (rejectReadOnly()) return;
    const newRem: ReminderItem = {
      ...rem,
      id: 'rem-' + Date.now().toString(),
    };
    setReminders(prev => [newRem, ...prev]);
    showToast('Pengingat baru ditambahkan.');
  };

  const deleteReminder = (id: string) => {
    if (rejectReadOnly()) return;
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast('Pengingat dihapus.', 'info');
  };

  // Modal helpers
  const openTransactionModal = (initialType?: 'masuk' | 'keluar', initialCategory?: string, editTx?: Transaction) => {
    if (editTx) {
      setEditingTransaction(editTx);
    } else {
      setEditingTransaction(null);
    }
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  // Backup & Reset
  const resetToDefaultData = () => {
    if (rejectReadOnly()) return;
    setCommitteeInfo(INITIAL_COMMITTEE_INFO);
    setDivisions(INITIAL_DIVISIONS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCommitteeFees(INITIAL_COMMITTEE_FEES);
    setSponsorships(INITIAL_SPONSORSHIPS);
    setReminders(INITIAL_REMINDERS);

    showToast('Data berhasil dikembalikan ke demo awal.', 'info');
  };

  const exportDataJSON = (): string => {
    const payload = {
      exportedAt: new Date().toISOString(),
      committeeInfo,
      divisions,
      transactions,
      committeeFees,
      sponsorships,
      reminders,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    if (rejectReadOnly()) return false;
    try {
      const data = JSON.parse(jsonStr);
      if (data.committeeInfo) setCommitteeInfo(data.committeeInfo);
      if (Array.isArray(data.divisions)) setDivisions(data.divisions);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.committeeFees)) setCommitteeFees(data.committeeFees);
      if (Array.isArray(data.sponsorships)) setSponsorships(data.sponsorships);
      if (Array.isArray(data.reminders)) setReminders(data.reminders);
      showToast('Data cadangan berhasil dipulihkan!');
      return true;
    } catch (e) {
      showToast('Format berkas cadangan JSON tidak valid.', 'error');
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        activePage,
        setActivePage,
        committeeInfo,
        divisions,
        transactions,
        committeeFees,
        sponsorships,
        reminders,
        userRole,
        canWrite,
        isDataLoading,
        dataLoadError,
        totalIncome,
        totalExpense,
        currentBalance,
        totalRAB,
        budgetRealizationRate,
        getDivisionSpent,
        getDivisionRealization,
        totalFeeTarget,
        totalFeeCollected,
        totalSponsorCommitted,
        totalSponsorReceived,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addDivision,
        updateDivision,
        deleteDivision,
        addBudgetItem,
        deleteBudgetItem,
        addCommitteeFeeMember,
        updateCommitteeFee,
        recordFeePayment,
        deleteCommitteeFee,
        addSponsorship,
        updateSponsorship,
        recordSponsorPayment,
        deleteSponsorship,
        updateCommitteeInfo,
        toggleReminderStatus,
        addReminder,
        deleteReminder,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,
        isTransactionModalOpen,
        openTransactionModal,
        closeTransactionModal,
        editingTransaction,
        viewingReceipt,
        setViewingReceipt,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
