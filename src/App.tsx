/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { TransactionModal } from './components/TransactionModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';

import { DashboardPage } from './pages/DashboardPage';
import { BudgetRABPage } from './pages/BudgetRABPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RevenueTrackerPage } from './pages/RevenueTrackerPage';
import { ReportsPage } from './pages/ReportsPage';

const AppContent: React.FC = () => {
  const { activePage, isDataLoading, dataLoadError } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isDataLoading || dataLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-slate-800">
            {isDataLoading ? 'Memuat data di perangkat ini...' : 'Data di perangkat ini tidak dapat dimuat'}
          </p>
          {dataLoadError && (
            <>
              <p className="mt-2 text-xs text-rose-700">{dataLoadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Coba lagi
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'rab' && <BudgetRABPage />}
          {activePage === 'transaksi' && <TransactionsPage />}
          {activePage === 'iuran-sponsor' && <RevenueTrackerPage />}
          {activePage === 'laporan' && <ReportsPage />}
        </main>

        <footer className="no-print py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
          <p>KasPanitia · Data tersimpan hanya di perangkat ini</p>
        </footer>
      </div>

      <TransactionModal />
      <ReceiptViewerModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
