import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Search,
  Plus,
  Filter,
  Receipt,
  FileQuestion,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Layers,
  X,
  CreditCard,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    divisions,
    deleteTransaction,
    openTransactionModal,
    setViewingReceipt,
  } = useFinance();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [selectedProofStatus, setSelectedProofStatus] = useState<'semua' | 'ada' | 'belum'>('semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('semua');

  // Deletion modal state
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Month options derived from data
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Combined Category List
  const allCategories = useMemo(() => {
    const list = new Set<string>();
    divisions.forEach(d => list.add(d.name));
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [divisions, transactions]);

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search
      const matchesSearch =
        !searchQuery ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.pic && t.pic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type
      const matchesType = selectedType === 'semua' || t.type === selectedType;

      // Category
      const matchesCategory =
        selectedCategory === 'semua' ||
        t.category.toLowerCase() === selectedCategory.toLowerCase();

      // Proof
      const matchesProof =
        selectedProofStatus === 'semua' ||
        (selectedProofStatus === 'ada' && t.hasProof) ||
        (selectedProofStatus === 'belum' && !t.hasProof);

      // Month
      const matchesMonth =
        selectedMonth === 'semua' || t.date.startsWith(selectedMonth);

      return matchesSearch && matchesType && matchesCategory && matchesProof && matchesMonth;
    });
  }, [transactions, searchQuery, selectedType, selectedCategory, selectedProofStatus, selectedMonth]);

  // Filtered Totals
  const filteredMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'masuk') income += t.amount;
      if (t.type === 'keluar') expense += t.amount;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('semua');
    setSelectedCategory('semua');
    setSelectedProofStatus('semua');
    setSelectedMonth('semua');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedType !== 'semua' ||
    selectedCategory !== 'semua' ||
    selectedProofStatus !== 'semua' ||
    selectedMonth !== 'semua';

  return (
    <div className="space-y-6">
      {/* Top Filtered Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Total Transaksi Ditemukan</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
            {filteredMetrics.count} <span className="text-xs font-normal text-slate-500">entri</span>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Pemasukan (Filter)</span>
          <span className="text-xl font-bold font-mono text-emerald-600 mt-0.5 block">
            {formatRupiah(filteredMetrics.income)}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Pengeluaran (Filter)</span>
          <span className="text-xl font-bold font-mono text-rose-600 mt-0.5 block">
            {formatRupiah(filteredMetrics.expense)}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Net Saldo Filter</span>
          <span className={`text-xl font-bold font-mono mt-0.5 block ${filteredMetrics.net >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatRupiah(filteredMetrics.net)}
          </span>
        </div>
      </div>

      {/* Filter and Control Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi berdasarkan kode (TRX-...), keterangan, atau nama..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openTransactionModal('masuk')}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
            >
              + Kas Masuk
            </button>
            <button
              type="button"
              onClick={() => openTransactionModal('keluar')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              + Kas Keluar
            </button>
          </div>
        </div>

        {/* Multi-filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Filter Jenis */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Jenis Transaksi
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="semua">Semua (Masuk &amp; Keluar)</option>
              <option value="masuk">Pemasukan (Kas Masuk)</option>
              <option value="keluar">Pengeluaran (Kas Keluar)</option>
            </select>
          </div>

          {/* Filter Divisi / Kategori */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Divisi / Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="semua">Semua Kategori</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Bukti Nota */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Status Bukti Nota
            </label>
            <select
              value={selectedProofStatus}
              onChange={e => setSelectedProofStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="semua">Semua Status Bukti</option>
              <option value="ada">Ada Nota / Kuitansi</option>
              <option value="belum">Belum Ada Nota</option>
            </select>
          </div>

          {/* Filter Periode Bulan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Periode Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="semua">Semua Bulan</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500">
              Filter aktif diterapkan. Menampilkan {filteredTransactions.length} dari {transactions.length} mutasi.
            </span>
            <button
              onClick={resetFilters}
              className="text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kode Ref</th>
                <th className="py-3 px-4">Kategori / Divisi</th>
                <th className="py-3 px-4">Keterangan &amp; Keperluan</th>
                <th className="py-3 px-4 text-center">Jenis</th>
                <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                <th className="py-3 px-4 text-center">Bukti Nota</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Tanggal */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {formatDateIndo(t.date)}
                    </td>

                    {/* Kode Ref */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-slate-500 text-[11px]">
                      {t.code}
                    </td>

                    {/* Kategori / Divisi */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {t.category}
                    </td>

                    {/* Keterangan */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 truncate" title={t.description}>
                        {t.description}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        PIC: {t.pic || 'Alya Syahrani'} · Via {t.paymentMethod}
                      </div>
                    </td>

                    {/* Jenis Masuk / Keluar */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {t.type === 'masuk' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Masuk</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Keluar</span>
                        </span>
                      )}
                    </td>

                    {/* Jumlah Rp */}
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-xs">
                      <span className={t.type === 'masuk' ? 'text-emerald-600' : 'text-slate-900'}>
                        {formatRupiah(t.amount)}
                      </span>
                    </td>

                    {/* Status Bukti */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {t.hasProof ? (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingReceipt({
                              name: t.proofName || 'Nota_Transaksi.jpg',
                              url: t.proofUrl,
                              description: t.description,
                              amount: t.amount,
                              date: t.date,
                              code: t.code,
                              category: t.category,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                          title="Klik untuk melihat bukti nota"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ada Bukti</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded">
                          <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                          <span>Belum Ada</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi: Edit & Hapus */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openTransactionModal(t.type, t.category, t)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTxId(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deletingTxId !== null}
        title="Hapus Transaksi Kas"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo sisa kas dan realisasi RAB divisi akan otomatis diperbarui."
        confirmText="Hapus Transaksi"
        onConfirm={() => {
          if (deletingTxId) deleteTransaction(deletingTxId);
          setDeletingTxId(null);
        }}
        onCancel={() => setDeletingTxId(null)}
      />
    </div>
  );
};
