import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatDateFull } from '../utils/formatters';
import { X, Download, Printer, CheckCircle, FileText } from 'lucide-react';

export const ReceiptViewerModal: React.FC = () => {
  const { viewingReceipt, setViewingReceipt, committeeInfo } = useFinance();

  if (!viewingReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">
                Bukti Lampiran Transaksi
              </h3>
              <p className="text-xs text-slate-400">
                {viewingReceipt.code || 'Nota / Kuitansi Sah'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cetak Bukti Transaksi"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewingReceipt(null)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* If there's an actual image url uploaded by user */}
          {viewingReceipt.url ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2 shadow-xs">
              <img
                src={viewingReceipt.url}
                alt="Bukti Lampiran"
                className="w-full max-h-80 object-contain mx-auto rounded-lg"
              />
            </div>
          ) : (
            /* Digital Formal Committee Voucher Card */
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden font-sans">
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Terverifikasi Bendahara</span>
              </div>

              <div className="border-b border-dashed border-slate-200 pb-4 mb-4">
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  {committeeInfo.organization}
                </p>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                  {committeeInfo.eventName}
                </h4>
                <p className="text-xs text-slate-500">
                  Bukti Pembayaran &amp; Arsip Kas Kegiatan
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">Kode Transaksi:</span>
                  <span className="font-mono font-medium text-slate-800 text-sm">
                    {viewingReceipt.code || 'TRX-REF'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Tanggal Pembayaran:</span>
                  <span className="font-medium text-slate-800">
                    {formatDateFull(viewingReceipt.date || new Date().toISOString())}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Kategori / Divisi:</span>
                  <span className="font-medium text-slate-800">
                    {viewingReceipt.category || 'Operasional'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Nama Berkas:</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {viewingReceipt.name || 'Nota_Transaksi.jpg'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 mb-4 border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Keterangan / Keperluan:</span>
                <p className="text-sm font-semibold text-slate-900">
                  {viewingReceipt.description || 'Pengeluaran operasional panitia'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Total Nominal Sah</span>
                  <span className="text-xl font-bold font-mono text-slate-900">
                    {formatRupiah(viewingReceipt.amount || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Penanggung Jawab:</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {committeeInfo.treasurerName}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Bendahara Umum</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 bg-white p-3.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Catatan Audit: </span>
            Bukti ini sah dan telah diarsipkan dalam rekonsiliasi kas kegiatan {committeeInfo.eventName}.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Arsip Digital Panitia
          </span>
          <button
            type="button"
            onClick={() => setViewingReceipt(null)}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
