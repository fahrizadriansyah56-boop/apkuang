import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Menu, Plus, RefreshCw } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { ConfirmationModal } from './ConfirmationModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { activePage, openTransactionModal, currentBalance, committeeInfo, resetToDefaultData, canWrite } = useFinance();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Overview Keuangan',
      subtitle: 'Ringkasan performa arus kas dan realisasi anggaran',
    },
    rab: {
      title: 'Anggaran Biaya (RAB)',
      subtitle: 'Perencanaan dan monitoring dana per divisi lapangan',
    },
    transaksi: {
      title: 'Buku Catatan Transaksi',
      subtitle: 'Histori mutasi kas masuk & kas keluar dengan bukti nota',
    },
    'iuran-sponsor': {
      title: 'Kas Iuran & Sponsorship',
      subtitle: 'Pelacakan penerimaan iuran panitia dan termin sponsor',
    },
    laporan: {
      title: 'Laporan & Pertanggungjawaban (LPJ)',
      subtitle: 'Rekapitulasi keuangan komprehensif, ekspor spreadsheet dan cetak',
    },
  };

  const current = pageTitles[activePage] || {
    title: 'Sistem Keuangan',
    subtitle: committeeInfo.eventName,
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Brand / Page Title with subtle breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">KasPanitia</span>
              <span aria-hidden="true">/</span>
              <span className="truncate">{committeeInfo.eventName}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              {current.title}
            </h1>
          </div>
        </div>

        {/* Zone 2: Event Context / Realtime Cash Indicator */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-slate-500">Saldo Kas:</span>
            <span className={`font-mono font-bold ${currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatRupiah(currentBalance)}
            </span>
          </div>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canWrite && (
            <>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                title="Reset data ke demo awal"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={() => openTransactionModal('keluar')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Catat Transaksi</span>
                <span className="sm:hidden">Catat</span>
              </button>
            </>
          )}
        </div>
      </header>

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Reset Data Ke Demo Awal"
        message="Semua data anggaran, transaksi, iuran, dan sponsor akan dikembalikan ke kondisi awal. Lanjutkan?"
        confirmText="Reset Data"
        onConfirm={() => {
          resetToDefaultData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
