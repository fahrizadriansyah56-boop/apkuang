/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { TransactionModal } from './components/TransactionModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { AuthSession, AuthUser } from './types/auth';
import { apiRequest } from './utils/api';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { BudgetRABPage } from './pages/BudgetRABPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RevenueTrackerPage } from './pages/RevenueTrackerPage';
import { ReportsPage } from './pages/ReportsPage';

const AUTH_KEY = 'kaspanitia_auth_v1';

interface LoginScreenProps {
  onAuthenticate: (fullName: string, email: string, password: string, isRegistering: boolean) => Promise<void>;
  initialError?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticate, initialError }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (isRegistering && password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAuthenticate(fullName.trim(), email.trim(), password, isRegistering);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Autentikasi gagal. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500 text-xl font-black text-slate-950">
            KP
          </div>
          <h1 className="text-2xl font-bold text-white">KasPanitia</h1>
          <p className="mt-1 text-sm text-slate-400">Sistem Manajemen Keuangan Panitia</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-800 p-1" role="tablist" aria-label="Autentikasi">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegistering}
            onClick={() => {
              setIsRegistering(false);
              setError('');
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              !isRegistering ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegistering}
            onClick={() => {
              setIsRegistering(true);
              setError('');
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              isRegistering ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label htmlFor="auth-full-name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nama Lengkap
              </label>
              <input
                id="auth-full-name"
                type="text"
                autoComplete="name"
                maxLength={120}
                required
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                placeholder="Nama lengkap Anda"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="nama@contoh.com"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                minLength={isRegistering ? 12 : undefined}
                required
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-3 pr-11 text-sm text-white outline-none focus:border-emerald-500"
                placeholder={isRegistering ? 'Minimal 12 karakter' : 'Masukkan password'}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(visible => !visible)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-white"
                aria-label={isPasswordVisible ? 'Sembunyikan password' : 'Lihat password'}
                aria-pressed={isPasswordVisible}
              >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div>
              <label htmlFor="auth-confirm-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ulangi Password
              </label>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-3 pr-11 text-sm text-white outline-none focus:border-emerald-500"
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible(visible => !visible)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-white"
                  aria-label={isConfirmPasswordVisible ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                  aria-pressed={isConfirmPasswordVisible}
                >
                  {isConfirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Memproses...' : isRegistering ? 'Daftar Akun' : 'Masuk ke Aplikasi'}
          </button>
        </form>

        {isRegistering && (
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Setelah mendaftar, Anda bisa melihat dan mengubah data keuangan bersama.
          </p>
        )}
      </div>
    </div>
  );
};

const AppContent: React.FC<{ session: AuthSession; onLogout: () => void }> = ({ session, onLogout }) => {
  const { activePage, canWrite, isDataLoading, dataLoadError } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isDataLoading || dataLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-slate-800">
            {isDataLoading ? 'Memuat data panitia...' : 'Data panitia tidak dapat dimuat'}
          </p>
          {dataLoadError && (
            <>
              <p className="mt-2 text-xs text-rose-700">{dataLoadError}</p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Coba lagi
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Keluar
                </button>
              </div>
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
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          userName={session.user.fullName}
          onLogout={onLogout}
          accessToken={session.token}
          userId={session.user.id}
          isAdmin={session.user.role === 'admin'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!canWrite && (
            <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Akun Anda memiliki akses hanya-lihat. Hubungi admin untuk meminta peran bendahara atau admin.
            </div>
          )}
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'rab' && <BudgetRABPage />}
          {activePage === 'transaksi' && <TransactionsPage />}
          {activePage === 'iuran-sponsor' && <RevenueTrackerPage />}
          {activePage === 'laporan' && <ReportsPage />}
        </main>

        <footer className="no-print py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
          <p>KasPanitia · Sistem Manajemen Keuangan &amp; Akuntabilitas Panitia Kegiatan</p>
        </footer>
      </div>

      <TransactionModal />
      <ReceiptViewerModal />
      <ToastContainer />
    </div>
  );
};

const readStoredSession = (): AuthSession | null => {
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) return null;
    const session = JSON.parse(saved) as AuthSession;
    return typeof session.token === 'string' && session.user ? session : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const storedSession = readStoredSession();
    if (!storedSession) {
      setIsCheckingSession(false);
      return;
    }

    let isCurrent = true;
    apiRequest<{ user: AuthUser }>('/api/auth/me', storedSession.token)
      .then(({ user }) => {
        if (isCurrent) setSession({ ...storedSession, user });
      })
      .catch(error => {
        if (!isCurrent) return;
        localStorage.removeItem(AUTH_KEY);
        setSession(null);
        setAuthError(error instanceof Error ? error.message : 'Sesi login tidak berlaku.');
      })
      .finally(() => {
        if (isCurrent) setIsCheckingSession(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleAuthenticate = async (fullName: string, email: string, password: string, isRegistering: boolean) => {
    const nextSession = await apiRequest<AuthSession>(
      isRegistering ? '/api/auth/register' : '/api/auth/login',
      undefined,
      {
        method: 'POST',
        body: JSON.stringify(isRegistering ? { fullName, email, password } : { email, password }),
      }
    );
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextSession));
    setAuthError('');
    setSession(nextSession);
  };

  const handleLogout = async () => {
    if (!session) return;
    try {
      await apiRequest<void>('/api/auth/logout', session.token, { method: 'POST' });
    } catch (error) {
      setAuthError(error instanceof Error ? `Sesi lokal dihapus, tetapi server belum menerima logout: ${error.message}` : 'Logout server gagal.');
    } finally {
      localStorage.removeItem(AUTH_KEY);
      setSession(null);
    }
  };

  if (isCheckingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-sm text-white">Memeriksa sesi...</div>;
  }

  if (!session) {
    return <LoginScreen onAuthenticate={handleAuthenticate} initialError={authError} />;
  }

  return (
    <FinanceProvider accessToken={session.token} userRole={session.user.role}>
      <AppContent session={session} onLogout={() => void handleLogout()} />
    </FinanceProvider>
  );
}
