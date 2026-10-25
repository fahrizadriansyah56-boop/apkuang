import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DivisionBudget, BudgetItem } from '../types/finance';
import { formatRupiah, formatPercent, parseRupiahInput } from '../utils/formatters';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  PlusCircle,
  PieChart,
  Search,
  Wallet,
  X,
} from 'lucide-react';

export const BudgetRABPage: React.FC = () => {
  const {
    divisions,
    getDivisionRealization,
    totalRAB,
    totalExpense,
    budgetRealizationRate,
    addDivision,
    updateDivision,
    deleteDivision,
    addBudgetItem,
    deleteBudgetItem,
    openTransactionModal,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDivisionId, setExpandedDivisionId] = useState<string | null>(divisions[0]?.id || null);

  // Division Modal (Add / Edit)
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<DivisionBudget | null>(null);
  const [divName, setDivName] = useState('');
  const [divCode, setDivCode] = useState('');
  const [divBudgetRaw, setDivBudgetRaw] = useState('');
  const [divPic, setDivPic] = useState('');
  const [divDesc, setDivDesc] = useState('');

  // Sub-item Modal (Add item to division)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [targetDivisionId, setTargetDivisionId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('paket');
  const [itemPriceRaw, setItemPriceRaw] = useState('');

  // Delete Confirmation
  const [deletingDivisionId, setDeletingDivisionId] = useState<string | null>(null);

  // Filter divisions by search
  const filteredDivisions = divisions.filter(
    d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedDivisionId(prev => (prev === id ? null : id));
  };

  const handleOpenDivisionModal = (div?: DivisionBudget) => {
    if (div) {
      setEditingDivision(div);
      setDivName(div.name);
      setDivCode(div.code);
      setDivBudgetRaw(div.budgetedAmount.toString());
      setDivPic(div.pic);
      setDivDesc(div.description);
    } else {
      setEditingDivision(null);
      setDivName('');
      setDivCode('');
      setDivBudgetRaw('');
      setDivPic('');
      setDivDesc('');
    }
    setIsDivisionModalOpen(true);
  };

  const handleSaveDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divName.trim() || !divBudgetRaw) return;

    const budgetedAmount = parseRupiahInput(divBudgetRaw);

    if (editingDivision) {
      updateDivision(editingDivision.id, {
        name: divName.trim(),
        code: divCode.trim().toUpperCase() || 'DIV',
        budgetedAmount,
        pic: divPic.trim() || 'Koordinator Divisi',
        description: divDesc.trim(),
      });
    } else {
      addDivision({
        name: divName.trim(),
        code: divCode.trim().toUpperCase() || 'DIV',
        budgetedAmount,
        pic: divPic.trim() || 'Koordinator Divisi',
        description: divDesc.trim(),
        items: [],
      });
    }
    setIsDivisionModalOpen(false);
  };

  const handleOpenItemModal = (divisionId: string) => {
    setTargetDivisionId(divisionId);
    setItemName('');
    setItemQty('1');
    setItemUnit('pcs');
    setItemPriceRaw('');
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDivisionId || !itemName.trim() || !itemPriceRaw) return;

    const qty = parseInt(itemQty, 10) || 1;
    const unitPrice = parseRupiahInput(itemPriceRaw);
    const total = qty * unitPrice;

    addBudgetItem(targetDivisionId, {
      itemName: itemName.trim(),
      qty,
      unit: itemUnit.trim() || 'unit',
      unitPrice,
      total,
    });

    setIsItemModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500">Total Anggaran Anggaran (RAB)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatRupiah(totalRAB)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Mencakup {divisions.length} divisi kepanitiaan
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500">Total Realisasi Lapangan</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatRupiah(totalExpense)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Realisasi serapan kas: {formatPercent(budgetRealizationRate)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500">Sisa Anggaran Anggaran Total</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${totalRAB - totalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatRupiah(totalRAB - totalExpense)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalRAB - totalExpense >= 0 ? 'Surplus alokasi kas aman' : 'Peringatan: Overbudget'}
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Add Division */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari divisi atau nama koordinator..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleOpenDivisionModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pos Divisi Baru</span>
          </button>
        </div>
      </div>

      {/* Division RAB Table & Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Komparasi Rencana Anggaran (RAB) vs Realisasi Lapangan
            </h3>
            <p className="text-xs text-slate-500">
              Klik pada baris divisi untuk melihat rincian item belanja spesifik
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {filteredDivisions.length} Divisi Terdaftar
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredDivisions.map(div => {
            const { spent, remaining, percent, isOverBudget } = getDivisionRealization(div);
            const isExpanded = expandedDivisionId === div.id;

            let statusBadge = (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aman</span>
              </span>
            );

            if (isOverBudget) {
              statusBadge = (
                <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Melebihi Anggaran</span>
                </span>
              );
            } else if (percent >= 75) {
              statusBadge = (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Mendekati Anggaran</span>
                </span>
              );
            }

            return (
              <div key={div.id} className="transition-colors">
                {/* Main Division Summary Row */}
                <div
                  onClick={() => toggleExpand(div.id)}
                  className="p-5 hover:bg-slate-50/80 cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 mt-0.5"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {div.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {div.name}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>Koordinator: <strong className="text-slate-700 font-medium">{div.pic}</strong></span>
                        <span>·</span>
                        <span>{div.items.length} rincian item belanja</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Comparison Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto text-xs shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Rencana (Anggaran)</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {formatRupiah(div.budgetedAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Realisasi Masuk</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {formatRupiah(spent)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Sisa Anggaran Dana</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          remaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(remaining)}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400">Serapan:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatPercent(percent, 0)}
                        </span>
                      </div>
                      <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            isOverBudget ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status & Quick Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {statusBadge}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenDivisionModal(div);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Divisi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setDeletingDivisionId(div.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Divisi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-item Accordion Panel */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 px-6 py-4 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Rincian Item Anggaran: {div.name}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {div.description || 'Daftar kebutuhan operasional dan estimasi biaya per satuan'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openTransactionModal('keluar', div.name)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          + Catat Pengeluaran Divisi Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenItemModal(div.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                        >
                          + Tambah Item RAB
                        </button>
                      </div>
                    </div>

                    {div.items.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                        Belum ada item belanja terdaftar. Klik "+ Tambah Item RAB" untuk memasukkan rincian.
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                            <tr>
                              <th className="py-2.5 px-4">Nama Item / Kebutuhan</th>
                              <th className="py-2.5 px-4 text-center">Volume / Qty</th>
                              <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                              <th className="py-2.5 px-4 text-right">Total Anggaran</th>
                              <th className="py-2.5 px-4 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-normal">
                            {div.items.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-medium text-slate-800">
                                  {item.itemName}
                                </td>
                                <td className="py-2.5 px-4 text-center text-slate-600 font-mono">
                                  {item.qty} {item.unit}
                                </td>
                                <td className="py-2.5 px-4 text-right text-slate-600 font-mono">
                                  {formatRupiah(item.unitPrice)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                                  {formatRupiah(item.total)}
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => deleteBudgetItem(div.id, item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Hapus Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Division Modal */}
      {isDivisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingDivision ? 'Edit Anggaran Divisi' : 'Tambah Divisi Baru'}
              </h3>
              <button
                onClick={() => setIsDivisionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDivision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Divisi / Pos Anggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={divName}
                  onChange={e => setDivName(e.target.value)}
                  placeholder="Contoh: Divisi Acara & Perlombaan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Singkatan (3-4 Huruf)
                  </label>
                  <input
                    type="text"
                    value={divCode}
                    onChange={e => setDivCode(e.target.value)}
                    placeholder="Contoh: ACR"
                    maxLength={5}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    sisa Anggaran (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={divBudgetRaw}
                    onChange={e => setDivBudgetRaw(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="15000000"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Koordinator / PIC Divisi
                </label>
                <input
                  type="text"
                  value={divPic}
                  onChange={e => setDivPic(e.target.value)}
                  placeholder="Nama & No WhatsApp"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Ruang Lingkup
                </label>
                <textarea
                  rows={2}
                  value={divDesc}
                  onChange={e => setDivDesc(e.target.value)}
                  placeholder="Alokasi kebutuhan divisi..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDivisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Simpan Divisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Item Anggaran RAB
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Item Kebutuhan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="Contoh: Sewa Mic Wireless 4 Unit"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume / Jumlah
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemQty}
                    onChange={e => setItemQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={e => setItemUnit(e.target.value)}
                    placeholder="pcs / paket / hari"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Satuan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemPriceRaw}
                  onChange={e => setItemPriceRaw(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 250000"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
                {parseRupiahInput(itemPriceRaw) > 0 && (
                  <div className="mt-1 text-xs text-slate-500">
                    Total: <strong className="font-mono text-slate-900">{formatRupiah((parseInt(itemQty, 10) || 1) * parseRupiahInput(itemPriceRaw))}</strong>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Division Confirmation */}
      <ConfirmationModal
        isOpen={deletingDivisionId !== null}
        title="Hapus Divisi Anggaran"
        message="Apakah Anda yakin ingin menghapus divisi ini dari rencana anggaran? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Divisi"
        onConfirm={() => {
          if (deletingDivisionId) deleteDivision(deletingDivisionId);
          setDeletingDivisionId(null);
        }}
        onCancel={() => setDeletingDivisionId(null)}
      />
    </div>
  );
};
