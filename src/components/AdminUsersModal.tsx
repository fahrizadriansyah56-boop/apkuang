import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AuthUser, UserRole } from '../types/auth';
import { apiRequest } from '../utils/api';

interface AdminUsersModalProps {
  isOpen: boolean;
  accessToken: string;
  currentUserId: string;
  onClose: () => void;
}

const roleNames: Record<UserRole, string> = {
  admin: 'Admin',
  treasurer: 'Bendahara',
  editor: 'Anggota (bisa mengubah)',
  viewer: 'Hanya lihat',
};

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  accessToken,
  currentUserId,
  onClose,
}) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ users: AuthUser[] }>('/api/admin/users', accessToken);
      setUsers(result.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat akun.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadUsers();
  }, [isOpen, accessToken]);

  const changeRole = async (user: AuthUser, role: UserRole) => {
    setError('');
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(user.id)}/role`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Gagal mengubah peran.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Kelola Pengguna</h2>
            <p className="mt-0.5 text-xs text-slate-500">Pengguna yang mendaftar dapat mengubah data bersama.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
          {error && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          {loading && <p className="text-sm text-slate-500">Memuat pengguna...</p>}
          {!loading && users.length === 0 && <p className="text-sm text-slate-500">Belum ada pengguna.</p>}
          {users.map(user => (
            <div key={user.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{user.fullName}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <p className="text-[11px] text-slate-400">{user.id === currentUserId ? 'Akun Anda · ' : ''}{roleNames[user.role]}</p>
              </div>
              <select
                value={user.role}
                disabled={user.id === currentUserId || loading}
                onChange={event => void changeRole(user, event.target.value as UserRole)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Peran ${user.email}`}
              >
                {Object.entries(roleNames).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
