import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatDateIndo, formatPercent } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Receipt,
  Eye,
  ChevronRight,
  Calendar,
  Users,
  Target,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    totalIncome,
    totalExpense,
    currentBalance,
    totalRAB,
    budgetRealizationRate,
    transactions,
    divisions,
    setViewingReceipt,
    setActivePage,
    openTransactionModal,
    totalFeeCollected,
    totalFeeTarget,
    totalSponsorReceived,
    totalSponsorCommitted,
  } = useFinance();

  const [cashflowView, setCashflowView] = useState<'mingguan' | 'bulanan'>('bulanan');
  const [selectedWeekMonth, setSelectedWeekMonth] = useState(() => {
    const latestTransaction = [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0];
    return latestTransaction?.date.substring(0, 7) || new Date().toISOString().substring(0, 7);
  });
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredDivisionIndex, setHoveredDivisionIndex] = useState<number | null>(null);

  // 5 Latest Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Cashflow Data Aggregation (Monthly / Weekly)
  const monthlyData = useMemo(() => {
    const months = [
      { key: '2026-02', label: 'Feb 2026', income: 0, expense: 0 },
      { key: '2026-03', label: 'Mar 2026', income: 0, expense: 0 },
      { key: '2026-04', label: 'Apr 2026', income: 0, expense: 0 },
      { key: '2026-05', label: 'Mei 2026', income: 0, expense: 0 },
    ];

    transactions.forEach(t => {
      const monthPrefix = t.date.substring(0, 7);
      const found = months.find(m => m.key === monthPrefix);
      if (found) {
        if (t.type === 'masuk') found.income += t.amount;
        if (t.type === 'keluar') found.expense += t.amount;
      }
    });

    return months;
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort();
    if (months.length > 0) return months;
    return [new Date().toISOString().substring(0, 7)];
  }, [transactions]);

  const weeklyData = useMemo(() => {
    const monthTransactions = transactions.filter(t => t.date.substring(0, 7) === selectedWeekMonth);
    const monthLabel = new Intl.DateTimeFormat('id-ID', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${selectedWeekMonth}-01T00:00:00Z`));

    const weeks = Array.from({ length: 4 }, (_, index) => ({
      label: `Minggu ${index + 1}`,
      income: 0,
      expense: 0,
    }));

    monthTransactions.forEach(transaction => {
      const day = Number(transaction.date.substring(8, 10));
      const weekIndex = Math.min(Math.ceil(day / 8) - 1, weeks.length - 1);
      if (weekIndex < 0) return;

      if (transaction.type === 'masuk') weeks[weekIndex].income += transaction.amount;
      if (transaction.type === 'keluar') weeks[weekIndex].expense += transaction.amount;
    });

    return weeks.map(week => ({
      ...week,
      label: `${week.label} ${monthLabel}`,
    }));
  }, [transactions, selectedWeekMonth]);

  const currentChartData = cashflowView === 'bulanan' ? monthlyData : weeklyData;

  // Max value for bar scaling
  const maxChartVal = useMemo(() => {
    let max = 1;
    currentChartData.forEach(d => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max * 1.15; // 15% headroom
  }, [currentChartData]);

  // Division Spending for Pie/Donut Chart
  const divisionSpending = useMemo(() => {
    const colors = [
      '#0284c7', // Sky
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#6366f1', // Indigo
      '#ec4899', // Pink
      '#8b5cf6', // Purple
      '#14b8a6', // Teal
      '#64748b', // Slate
    ];

    const data = divisions.map((div, i) => {
      const spent = transactions
        .filter(t => t.type === 'keluar' && t.category.toLowerCase().includes(div.name.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: div.name,
        code: div.code,
        budgeted: div.budgetedAmount,
        spent,
        color: colors[i % colors.length],
      };
    });

    const totalRealized = data.reduce((sum, d) => sum + d.spent, 0);

    return {
      items: data,
      totalRealized,
    };
  }, [divisions, transactions]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Financial Health Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">
              Kondisi Kas Panitia: Realisasi Terkendali
            </div>
            <div className="text-xs text-slate-500">
              Total Anggaran RAB: <span className="font-semibold text-slate-700">{formatRupiah(totalRAB)}</span> · Terserap: <span className="font-semibold text-slate-700">{formatPercent(budgetRealizationRate)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setActivePage('transaksi')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Buku Transaksi
          </button>
          <button
            onClick={() => setActivePage('rab')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Lihat Detail RAB
          </button>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pemasukan Kas</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatRupiah(totalIncome)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Sponsorship &amp; Iuran Terkumpul</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Realisasi Pengeluaran</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatRupiah(totalExpense)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Belanja divisi &amp; operasional</span>
            </div>
          </div>
        </div>

        {/* Card 3: Saldo Sisa / Kas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Sisa / Kas Tersedia</span>
            <div className={`p-2 rounded-lg ${currentBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold font-mono ${currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatRupiah(currentBalance)}
            </div>
            <div className="mt-1 text-xs text-slate-500 font-medium">
              Otomatis (Pemasukan – Pengeluaran)
            </div>
          </div>
        </div>

        {/* Card 4: Persentase Realisasi Anggaran */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Serapan Anggaran RAB</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatPercent(budgetRealizationRate)}
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetRealizationRate > 90 ? 'bg-rose-500' : budgetRealizationRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetRealizationRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid: Cashflow (Bar) vs Allocation (Pie/Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Cashflow Arus Kas Pemasukan vs Pengeluaran */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Arus Kas (Cashflow Monitoring)
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan nominal dana masuk vs belanja operasional
                </p>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCashflowView('bulanan')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    cashflowView === 'bulanan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setCashflowView('mingguan')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    cashflowView === 'mingguan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Minggu
                </button>
              </div>
              {cashflowView === 'mingguan' && (
                <select
                  aria-label="Pilih bulan untuk grafik mingguan"
                  value={selectedWeekMonth}
                  onChange={event => setSelectedWeekMonth(event.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {new Intl.DateTimeFormat('id-ID', {
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                      }).format(new Date(`${month}-01T00:00:00Z`))}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs mb-4 text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span>Pemasukan (Kas Masuk)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
                <span>Pengeluaran (Kas Keluar)</span>
              </div>
            </div>

            {/* Custom Interactive SVG Chart */}
            <div className="relative pt-6 pb-2">
              <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 border-b border-slate-200 px-2 sm:px-4">
                {currentChartData.map((item, index) => {
                  const incomeHeight = Math.max((item.income / maxChartVal) * 100, 2);
                  const expenseHeight = Math.max((item.expense / maxChartVal) * 100, 2);
                  const isHovered = hoveredBarIndex === index;

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                          <div className="font-semibold text-slate-200 mb-0.5">{item.label}</div>
                          <div className="text-emerald-300">Masuk: {formatRupiah(item.income)}</div>
                          <div className="text-rose-300">Keluar: {formatRupiah(item.expense)}</div>
                        </div>
                      )}

                      {/* Bar Pair */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-1">
                        {/* Income Bar */}
                        <div
                          className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-300"
                          style={{ height: `${incomeHeight}%` }}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-1/2 max-w-[28px] bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all duration-300"
                          style={{ height: `${expenseHeight}%` }}
                        />
                      </div>

                      {/* X-axis Label */}
                      <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium text-center truncate max-w-[70px]">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 text-[11px] text-slate-400 text-center">
            Arahkan kursor pada batang untuk melihat rincian nominal mutasi
          </div>
        </div>

        {/* Chart 2: Division Spending Distribution (Interactive Donut) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Alokasi Pengeluaran Divisi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi realisasi anggaran berdasarkan divisi kegiatan
            </p>

            {/* Donut representation */}
            <div className="relative flex items-center justify-center my-3">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
                {(() => {
                  let accumulatedPercent = 0;
                  const total = divisionSpending.totalRealized || 1;

                  return divisionSpending.items.map((div, i) => {
                    const percent = (div.spent / total) * 100;
                    if (percent <= 0) return null;

                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={div.color}
                        strokeWidth={hoveredDivisionIndex === i ? '16' : '12'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredDivisionIndex(i)}
                        onMouseLeave={() => setHoveredDivisionIndex(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center stat inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  {hoveredDivisionIndex !== null
                    ? divisionSpending.items[hoveredDivisionIndex]?.code
                    : 'Total Serapan'}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {hoveredDivisionIndex !== null
                    ? formatRupiah(divisionSpending.items[hoveredDivisionIndex]?.spent || 0)
                    : formatRupiah(divisionSpending.totalRealized)}
                </span>
              </div>
            </div>

            {/* Division Legend List */}
            <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
              {divisionSpending.items.map((div, i) => {
                const percent = divisionSpending.totalRealized > 0
                  ? (div.spent / divisionSpending.totalRealized) * 100
                  : 0;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredDivisionIndex(i)}
                    onMouseLeave={() => setHoveredDivisionIndex(null)}
                    className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                      hoveredDivisionIndex === i ? 'bg-slate-100 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: div.color }}
                      />
                      <span className="truncate">{div.name}</span>
                    </div>
                    <span className="font-mono text-slate-900 shrink-0 ml-2">
                      {formatPercent(percent, 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePage('rab')}
            className="mt-4 w-full py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Bandingkan Anggaran vs Realisasi
          </button>
        </div>
      </div>

      {/* Bottom Grid: Latest Transactions */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Transaksi Terkini (5 Entri Terbaru)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan mutasi kas langsung dari bendahara
              </p>
            </div>
            <button
              onClick={() => setActivePage('transaksi')}
              className="text-xs font-semibold text-slate-900 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Semua Transaksi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori / Divisi</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 text-center">Bukti Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDateIndo(t.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 max-w-[220px] truncate text-slate-600" title={t.description}>
                      {t.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                      <span className={t.type === 'masuk' ? 'text-emerald-600' : 'text-slate-900'}>
                        {t.type === 'masuk' ? '+' : '-'} {formatRupiah(t.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {t.hasProof ? (
                        <button
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
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-950 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ada Nota</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum Ada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
