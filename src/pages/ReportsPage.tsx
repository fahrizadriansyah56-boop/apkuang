import React, { useState, useMemo, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatDateFull, formatDateIndo, formatPercent, downloadCSV } from '../utils/formatters';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Edit,
  Save,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    committeeInfo,
    updateCommitteeInfo,
    divisions,
    transactions,
    committeeFees,
    sponsorships,
    totalIncome,
    totalExpense,
    currentBalance,
    totalRAB,
    budgetRealizationRate,
    getDivisionRealization,
    resetToDefaultData,
    exportDataJSON,
    importDataJSON,
  } = useFinance();

  // Period Filter
  const [selectedPeriod, setSelectedPeriod] = useState<string>('semua');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState(committeeInfo);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered transactions based on period
  const reportTransactions = useMemo(() => {
    if (selectedPeriod === 'semua') return transactions;
    return transactions.filter(t => t.date.startsWith(selectedPeriod));
  }, [transactions, selectedPeriod]);

  // Filtered computed values
  const periodIncome = useMemo(() => {
    return reportTransactions
      .filter(t => t.type === 'masuk')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [reportTransactions]);

  const periodExpense = useMemo(() => {
    return reportTransactions
      .filter(t => t.type === 'keluar')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [reportTransactions]);

  const periodBalance = periodIncome - periodExpense;

  // Breakdown of Income by Category
  const incomeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    reportTransactions
      .filter(t => t.type === 'masuk')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: periodIncome > 0 ? (amount / periodIncome) * 100 : 0,
    }));
  }, [reportTransactions, periodIncome]);

  // Breakdown of Expense by Division
  const divisionBreakdown = useMemo(() => {
    return divisions.map(div => {
      const spent = reportTransactions
        .filter(t => t.type === 'keluar' && t.category.toLowerCase().includes(div.name.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);
      const budgeted = div.budgetedAmount;
      const variance = budgeted - spent;
      return {
        name: div.name,
        code: div.code,
        pic: div.pic,
        budgeted,
        spent,
        variance,
        percent: budgeted > 0 ? (spent / budgeted) * 100 : 0,
      };
    });
  }, [divisions, reportTransactions]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'Kode Transaksi',
      'Tanggal',
      'Jenis (Masuk/Keluar)',
      'Kategori / Divisi',
      'Keterangan',
      'Nominal (IDR)',
      'Metode Pembayaran',
      'Penanggung Jawab (PIC)',
      'Status Bukti Nota',
    ];

    const rows = reportTransactions.map(t => [
      t.code,
      t.date,
      t.type === 'masuk' ? 'PEMASUKAN' : 'PENGELUARAN',
      t.category,
      t.description,
      t.amount,
      t.paymentMethod || 'Transfer Bank',
      t.pic || '',
      t.hasProof ? 'Ada Nota' : 'Tanpa Nota',
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `LPJ_Keuangan_${committeeInfo.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;
    downloadCSV(filename, headers, rows, ';');
  };

  // Export Detailed RAB CSV
  const handleExportRABCSV = () => {
    const headers = [
      'Kode Divisi',
      'Nama Divisi',
      'Koordinator (PIC)',
      'Anggaran RAB (IDR)',
      'Realisasi Lapangan (IDR)',
      'Sisa / Varian (IDR)',
      'Persentase Realisasi',
    ];

    const rows = divisionBreakdown.map(d => [
      d.code,
      d.name,
      d.pic,
      d.budgeted,
      d.spent,
      d.variance,
      `${d.percent.toFixed(1)}%`,
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `RAB_vs_Realisasi_${committeeInfo.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;
    downloadCSV(filename, headers, rows, ';');
  };

  // Trigger Print LPJ
  const handlePrint = () => {
    window.print();
  };

  // Backup JSON Download
  const handleExportJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_kaspanitia_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Restore JSON Upload
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        importDataJSON(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommitteeInfo(infoForm);
    setIsEditingInfo(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Filter Periode:</span>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="semua">Semua Periode (Total Kegiatan)</option>
              <option value="2026-02">Februari 2026</option>
              <option value="2026-03">Maret 2026</option>
              <option value="2026-04">April 2026</option>
              <option value="2026-05">Mei 2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingInfo(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profil Acara</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Buku Kas (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportRABCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor RAB (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak LPJ / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Printable LPJ Document Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-sm font-sans space-y-8 print:border-none print:p-0 print:shadow-none">
        {/* Document Header (Kop Dokumen Resmi) */}
        <div className="text-center border-b-2 border-slate-800 pb-6 relative">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">
            {committeeInfo.organization}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN
          </h2>
          <p className="text-base font-semibold text-slate-700 mt-1">
            {committeeInfo.eventName}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tema: "{committeeInfo.eventTheme}" · {committeeInfo.venue}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            {committeeInfo.budgetPeriod} · Tanggal Terbit Laporan: {formatDateFull(new Date().toISOString())}
          </div>
        </div>

        {/* Section 1: Ikhtisar Eksekutif Arus Kas (Executive Summary) */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block" />
            <span>I. Rekapitulasi Realisasi Kas Kegiatan</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Total Pemasukan Kas</span>
              <span className="text-xl font-bold font-mono text-emerald-700 block">
                {formatRupiah(periodIncome)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Termasuk iuran panitia, sponsorship &amp; hibah
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Total Pengeluaran Kas</span>
              <span className="text-xl font-bold font-mono text-rose-700 block">
                {formatRupiah(periodExpense)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Realisasi operasional semua divisi lapangan
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Saldo Kas Akhir (Surplus/Defisit)</span>
              <span className={`text-xl font-bold font-mono block ${periodBalance >= 0 ? 'text-slate-900 font-extrabold' : 'text-rose-700'}`}>
                {formatRupiah(periodBalance)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {periodBalance >= 0 ? 'Kas operasional surplus' : 'Defisit dana perlu subsidi'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Sumber Penerimaan Kas (Income Breakdown) */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block" />
            <span>II. Rincian Sumber Dana Pemasukan</span>
          </h3>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">No</th>
                  <th className="py-2.5 px-4">Sumber Pemasukan Dana</th>
                  <th className="py-2.5 px-4 text-right">Nominal Realisasi</th>
                  <th className="py-2.5 px-4 text-right">Kontribusi (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {incomeBreakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 text-slate-400 font-mono w-12">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{item.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {formatPercent(item.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 text-right uppercase text-[11px]">
                    Total Realisasi Pemasukan:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                    {formatRupiah(periodIncome)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section 3: Tabel Realisasi Belanja Divisi vs RAB (Expense Breakdown) */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block" />
            <span>III. Realisasi Beban Pengeluaran per Divisi (RAB vs Realisasi)</span>
          </h3>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Divisi &amp; Kode</th>
                  <th className="py-2.5 px-4">Koordinator (PIC)</th>
                  <th className="py-2.5 px-4 text-right">RAB Awal (Anggaran)</th>
                  <th className="py-2.5 px-4 text-right">Realisasi Beban</th>
                  <th className="py-2.5 px-4 text-right">Sisa / Deviasi</th>
                  <th className="py-2.5 px-4 text-right">Serapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {divisionBreakdown.map(d => (
                  <tr key={d.code} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {d.name} <span className="text-[10px] text-slate-400 font-mono">({d.code})</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px]">{d.pic}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                      {formatRupiah(d.budgeted)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(d.spent)}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-semibold ${d.variance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatRupiah(d.variance)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                      {formatPercent(d.percent)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 text-right uppercase text-[11px]">
                    Total Realisasi Pengeluaran:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                    {formatRupiah(totalRAB)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                    {formatRupiah(periodExpense)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                    {formatRupiah(totalRAB - periodExpense)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                    {formatPercent(totalRAB > 0 ? (periodExpense / totalRAB) * 100 : 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section 4: Lembar Pengesahan Tanda Tangan Resmi */}
        <div className="pt-6 border-t border-slate-200 break-inside-avoid">
          <p className="text-xs text-slate-500 text-center mb-8">
            Demikian laporan pertanggungjawaban keuangan ini dibuat dengan sebenar-benarnya berdasarkan bukti transaksi dan rekonsiliasi rekening kas yang sah.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-16">Mengetahui,<br /><strong className="text-slate-800">Ketua Pelaksana</strong></p>
              <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 mx-4">
                {committeeInfo.chairpersonName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Penanggung Jawab Kegiatan</p>
            </div>

            <div>
              <p className="text-slate-500 mb-16">Dibuat oleh,<br /><strong className="text-slate-800">Bendahara Umum</strong></p>
              <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 mx-4">
                {committeeInfo.treasurerName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Koordinator Keuangan</p>
            </div>

            <div className="hidden sm:block">
              <p className="text-slate-500 mb-16">Diverifikasi,<br /><strong className="text-slate-800">Badan Pengawas / Pembina</strong></p>
              <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 mx-4">
                Dewan Pengarah Panitia
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pengawas Keuangan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Management & Backup Card (Hidden in Print) */}
      <div className="no-print bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Pencadangan &amp; Pemulihan Data Panitia (Backup &amp; Reset)
          </h3>
          <p className="text-xs text-slate-500">
            Amankan data keuangan ke dalam berkas JSON atau pulihkan data di komputer lain
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangkan Data (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Pulihkan Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset ke Demo Awal</span>
          </button>
        </div>
      </div>

      {/* Edit Committee Profile Modal */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Ubah Profil &amp; Identitas Kepanitiaan
              </h3>
              <button
                onClick={() => setIsEditingInfo(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Acara / Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={infoForm.eventName}
                  onChange={e => setInfoForm(prev => ({ ...prev, eventName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tema Acara
                </label>
                <input
                  type="text"
                  value={infoForm.eventTheme}
                  onChange={e => setInfoForm(prev => ({ ...prev, eventTheme: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organisasi Penyelenggara
                  </label>
                  <input
                    type="text"
                    value={infoForm.organization}
                    onChange={e => setInfoForm(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Periode Anggaran
                  </label>
                  <input
                    type="text"
                    value={infoForm.budgetPeriod}
                    onChange={e => setInfoForm(prev => ({ ...prev, budgetPeriod: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Ketua Pelaksana
                  </label>
                  <input
                    type="text"
                    value={infoForm.chairpersonName}
                    onChange={e => setInfoForm(prev => ({ ...prev, chairpersonName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Bendahara Umum
                  </label>
                  <input
                    type="text"
                    value={infoForm.treasurerName}
                    onChange={e => setInfoForm(prev => ({ ...prev, treasurerName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi / Venue Pelaksanaan
                </label>
                <input
                  type="text"
                  value={infoForm.venue}
                  onChange={e => setInfoForm(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Kembalikan ke Data Demo Awal"
        message="Apakah Anda yakin ingin mengatur ulang seluruh data keuangan kepanitiaan ke kondisi demo bawaan? Semua perubahan dan data baru yang belum dicadangkan akan dihapus."
        confirmText="Reset Data"
        onConfirm={resetToDefaultData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
