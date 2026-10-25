import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ActivePage } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  LayoutDashboard,
  Calculator,
  ReceiptText,
  HandCoins,
  FileSpreadsheet,
  Plus,
  Calendar,
  X,
  Wallet,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activePage, setActivePage, openTransactionModal, currentBalance, committeeInfo, canWrite } = useFinance();

  const navItems: { id: ActivePage; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      description: 'Ringkasan & Metrik Utama',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'rab',
      label: 'Anggaran Divisi (RAB)',
      description: 'Perencanaan vs Realisasi',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'transaksi',
      label: 'Catatan Transaksi',
      description: 'Buku Kas Masuk & Keluar',
      icon: <ReceiptText className="w-4 h-4" />,
    },
    {
      id: 'iuran-sponsor',
      label: 'Iuran & Sponsorship',
      description: 'Tracking Piutang & Revenue',
      icon: <HandCoins className="w-4 h-4" />,
    },
    {
      id: 'laporan',
      label: 'Laporan & Ekspor LPJ',
      description: 'Format Resmi, CSV & Cetak',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (id: ActivePage) => {
    setActivePage(id);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-base shadow-sm">
              KP
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight whitespace-nowrap block">
                KasPanitia
              </span>
              <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                {committeeInfo.eventName}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action Button */}
      {canWrite && (
        <div className="p-4">
          <button
            onClick={() => {
              openTransactionModal('keluar');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Catat Transaksi Baru</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Menu Navigasi
        </div>
        {navItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                }`}
              >
                {item.icon}
              </div>
              <div className="truncate">
                <div className="truncate">{item.label}</div>
                <div className="text-[10px] text-slate-500 font-normal truncate">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Kas Balance Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kas Bersih Tersedia</span>
            </span>
          </div>
          <div className={`text-base font-mono font-bold ${currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(currentBalance)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>Event: {committeeInfo.eventDate}</span>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-500 text-center">
          Sistem Keuangan Panitia · v2.4
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
