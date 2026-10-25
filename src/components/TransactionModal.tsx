import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../utils/formatters';
import { TransactionType } from '../types/finance';
import { X, ArrowDownRight, ArrowUpRight, Upload, Paperclip, Image, Check, AlertCircle } from 'lucide-react';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    editingTransaction,
    addTransaction,
    updateTransaction,
    divisions,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('keluar');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
  const [pic, setPic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [hasProof, setHasProof] = useState<boolean>(true);
  const [proofName, setProofName] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Income categories vs Division expense categories
  const incomeCategories = [
    'Sponsorship',
    'Kas Iuran Panitia',
    'Tiket & Registrasi',
    'Hibah Organisasi / Kampus',
    'Donatur Perorangan',
    'Penjualan Merchandise',
    'Lain-lain',
  ];

  // Populate form if editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setAmountRaw(editingTransaction.amount.toString());
      setPaymentMethod(editingTransaction.paymentMethod || 'Transfer Bank');
      setPic(editingTransaction.pic || '');
      setNotes(editingTransaction.notes || '');
      setHasProof(editingTransaction.hasProof);
      setProofName(editingTransaction.proofName || '');
      setProofUrl(editingTransaction.proofUrl || '');
    } else {
      // Default reset
      setType('keluar');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(divisions.length > 0 ? divisions[0].name : 'Divisi Acara & Talent');
      setDescription('');
      setAmountRaw('');
      setPaymentMethod('Transfer Bank');
      setPic('');
      setNotes('');
      setHasProof(true);
      setProofName('');
      setProofUrl('');
    }
    setErrors({});
  }, [editingTransaction, isTransactionModalOpen, divisions]);

  if (!isTransactionModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofName(file.name);
      setHasProof(true);
      const reader = new FileReader();
      reader.onload = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetProof = (presetName: string) => {
    setProofName(presetName);
    setHasProof(true);
    setProofUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: Record<string, string> = {};

    const amountNum = parseRupiahInput(amountRaw);
    if (!amountNum || amountNum <= 0) {
      validationErrors.amount = 'Nominal harus lebih besar dari Rp 0';
    }
    if (!description.trim()) {
      validationErrors.description = 'Keterangan transaksi wajib diisi';
    }
    if (!category.trim()) {
      validationErrors.category = 'Kategori/Divisi wajib dipilih';
    }
    if (!date) {
      validationErrors.date = 'Tanggal transaksi wajib diisi';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      type,
      date,
      category,
      description: description.trim(),
      amount: amountNum,
      paymentMethod,
      pic: pic.trim() || 'Alya Syahrani (Bendahara)',
      notes: notes.trim(),
      hasProof,
      proofName: hasProof ? proofName || (type === 'masuk' ? 'kuitansi_masuk.pdf' : 'nota_belanja.jpg') : undefined,
      proofUrl: hasProof && proofUrl ? proofUrl : undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }

    closeTransactionModal();
  };

  const currentAmountNum = parseRupiahInput(amountRaw);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingTransaction ? 'Edit Transaksi Kas' : 'Catat Transaksi Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Isi data arus kas masuk atau keluar kepanitiaan secara akurat
            </p>
          </div>
          <button
            onClick={closeTransactionModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Transaksi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('keluar');
                  if (divisions.length > 0 && !category.includes('Divisi')) {
                    setCategory(divisions[0].name);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  type === 'keluar'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Pengeluaran (Kas Keluar)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('masuk');
                  if (!incomeCategories.includes(category)) {
                    setCategory(incomeCategories[0]);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  type === 'masuk'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pemasukan (Kas Masuk)</span>
              </button>
            </div>
          </div>

          {/* Amount input with auto-formatting preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                Rp
              </div>
              <input
                type="text"
                value={amountRaw}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountRaw(val);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                }}
                placeholder="0"
                className={`w-full pl-11 pr-4 py-2.5 text-base font-mono font-semibold rounded-lg border ${
                  errors.amount
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-slate-800 focus:ring-slate-100'
                } focus:outline-none focus:ring-3`}
              />
            </div>
            {currentAmountNum > 0 && (
              <div className="mt-1 text-xs font-medium text-slate-600">
                Terbaca: <span className="font-mono font-bold text-slate-900">{formatRupiah(currentAmountNum)}</span>
              </div>
            )}
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.amount}
              </p>
            )}
          </div>

          {/* Date and Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'keluar' ? 'Divisi / Pos Anggaran' : 'Sumber Pemasukan'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
              >
                {type === 'keluar' ? (
                  <>
                    <option value="">-- Pilih Divisi Terkait --</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                    <option value="Operasional Umum">Operasional Umum Panitia</option>
                  </>
                ) : (
                  <>
                    <option value="">-- Pilih Sumber Dana --</option>
                    {incomeCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder={
                type === 'keluar'
                  ? 'Contoh: DP 50% Sewa Sound System & Genset'
                  : 'Contoh: Pencairan Termin 1 Sponsorship Mandiri'
              }
              className={`w-full px-3 py-2 text-xs rounded-lg border ${
                errors.description ? 'border-rose-400' : 'border-slate-300'
              } focus:outline-none focus:border-slate-800`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
              </p>
            )}
          </div>

          {/* Payment Method and PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="Transfer BCA">Transfer BCA Kas Panitia</option>
                <option value="Transfer Mandiri">Transfer Mandiri Kas Panitia</option>
                <option value="QRIS Kas Panitia">QRIS Kas Panitia</option>
                <option value="Tunai / Cash">Tunai / Kas di Tangan</option>
                <option value="Payment Gateway">Payment Gateway / Midtrans</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penanggung Jawab (PIC)
              </label>
              <input
                type="text"
                value={pic}
                onChange={e => setPic(e.target.value)}
                placeholder="Nama panitia / bendahara"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan nomor rekening vendor, syarat termin, dsb."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Proof / Receipt Attachment Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-800">
                  Lampiran Bukti Nota / Kuitansi
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasProof}
                  onChange={e => setHasProof(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>Ada Bukti Sah</span>
              </label>
            </div>

            {hasProof && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Nota (Foto / PDF)</span>
                  </button>

                  <span className="text-xs text-slate-500 truncate max-w-[200px]">
                    {proofName || 'Belum memilih file'}
                  </span>
                </div>

                {proofUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <img
                      src={proofUrl}
                      alt="Pratinjau Nota"
                      className="w-10 h-10 object-cover rounded border border-slate-100"
                    />
                    <div className="text-xs text-slate-600 truncate flex-1">
                      {proofName || 'Nota_Terunggah.jpg'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProofUrl('');
                        setProofName('');
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Preset shortcuts for fast committee logging */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Atau gunakan template nota standar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Struk_Resmi_Catering.jpg',
                      'Invoice_Vendor_Perkap.pdf',
                      'Kuitansi_Bermeterai.jpg',
                      'Bukti_Transfer_M-Banking.png',
                    ].map(sample => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => handleSelectPresetProof(sample)}
                        className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                          proofName === sample
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
