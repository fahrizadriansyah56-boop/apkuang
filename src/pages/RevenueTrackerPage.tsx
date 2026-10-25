import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CommitteeFee, Sponsorship } from '../types/finance';
import { formatRupiah, formatDateIndo, formatPercent, createWhatsAppReminderLink, parseRupiahInput } from '../utils/formatters';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  Plus,
  Search,
  CreditCard,
  FileCheck,
  Send,
  X,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';

export const RevenueTrackerPage: React.FC = () => {
  const {
    committeeFees,
    sponsorships,
    committeeInfo,
    addCommitteeFeeMember,
    updateCommitteeFee,
    recordFeePayment,
    deleteCommitteeFee,
    addSponsorship,
    updateSponsorship,
    recordSponsorPayment,
    deleteSponsorship,
    totalFeeTarget,
    totalFeeCollected,
    totalSponsorCommitted,
    totalSponsorReceived,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'iuran' | 'sponsor'>('iuran');

  // Iuran Search & Filter
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'semua' | 'lunas' | 'sebagian' | 'belum'>('semua');

  // Sponsor Search & Filter
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsorTierFilter, setSponsorTierFilter] = useState<string>('semua');

  // Member Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberTargetRaw, setMemberTargetRaw] = useState('150000');
  const [memberPhone, setMemberPhone] = useState('');

  // Quick Pay Modal for Iuran
  const [payingMember, setPayingMember] = useState<CommitteeFee | null>(null);
  const [payAmountRaw, setPayAmountRaw] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer BCA');

  // Sponsor Modal
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorTier, setSponsorTier] = useState<Sponsorship['tier']>('Gold');
  const [sponsorAmountRaw, setSponsorAmountRaw] = useState('');
  const [sponsorPic, setSponsorPic] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');
  const [sponsorTermsCount, setSponsorTermsCount] = useState('2');
  const [sponsorNotes, setSponsorNotes] = useState('');

  // Quick Sponsor Term Payment Modal
  const [payingSponsor, setPayingSponsor] = useState<{ sponsor: Sponsorship; termNumber: number; amount: number } | null>(null);

  // Deletion modals
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [deletingSponsorId, setDeletingSponsorId] = useState<string | null>(null);

  // Filtered Iuran
  const filteredFees = useMemo(() => {
    return committeeFees.filter(f => {
      const matchSearch =
        !feeSearch ||
        f.memberName.toLowerCase().includes(feeSearch.toLowerCase()) ||
        f.divisionOrRole.toLowerCase().includes(feeSearch.toLowerCase());
      const matchStatus = feeStatusFilter === 'semua' || f.status === feeStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [committeeFees, feeSearch, feeStatusFilter]);

  // Filtered Sponsors
  const filteredSponsors = useMemo(() => {
    return sponsorships.filter(s => {
      const matchSearch =
        !sponsorSearch ||
        s.sponsorName.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
        s.picContact.toLowerCase().includes(sponsorSearch.toLowerCase());
      const matchTier = sponsorTierFilter === 'semua' || s.tier === sponsorTierFilter;
      return matchSearch && matchTier;
    });
  }, [sponsorships, sponsorSearch, sponsorTierFilter]);

  // Submit Add Member
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    addCommitteeFeeMember({
      memberName: memberName.trim(),
      divisionOrRole: memberRole.trim() || 'Staff Panitia',
      targetAmount: parseRupiahInput(memberTargetRaw) || 150000,
      paidAmount: 0,
      status: 'belum',
      phone: memberPhone.trim(),
    });

    setIsMemberModalOpen(false);
    setMemberName('');
    setMemberRole('');
    setMemberPhone('');
  };

  // Submit Quick Pay Iuran
  const handleConfirmFeePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingMember || !payAmountRaw) return;

    const amount = parseRupiahInput(payAmountRaw);
    recordFeePayment(payingMember.id, amount, payMethod);
    setPayingMember(null);
  };

  // Submit Add Sponsor
  const handleSaveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim() || !sponsorAmountRaw) return;

    const committedAmount = parseRupiahInput(sponsorAmountRaw);
    const count = parseInt(sponsorTermsCount, 10) || 1;
    const termAmount = Math.round(committedAmount / count);

    const terms = Array.from({ length: count }, (_, idx) => ({
      termNumber: idx + 1,
      percentage: Math.round(100 / count),
      amount: termAmount,
      dueDate: new Date(Date.now() + (idx + 1) * 30 * 86400000).toISOString().split('T')[0],
      status: 'menunggu' as const,
    }));

    addSponsorship({
      sponsorName: sponsorName.trim(),
      tier: sponsorTier,
      committedAmount,
      receivedAmount: 0,
      terms,
      invoiceStatus: 'MoU Ditandatangani',
      picContact: sponsorPic.trim() || 'PIC Kemitraan',
      contactPhone: sponsorPhone.trim(),
      notes: sponsorNotes.trim(),
      mouDate: new Date().toISOString().split('T')[0],
    });

    setIsSponsorModalOpen(false);
    setSponsorName('');
    setSponsorAmountRaw('');
    setSponsorPic('');
    setSponsorPhone('');
    setSponsorNotes('');
  };

  // Confirm Sponsor Term Payment
  const handleConfirmSponsorTerm = () => {
    if (!payingSponsor) return;
    recordSponsorPayment(payingSponsor.sponsor.id, payingSponsor.termNumber, payingSponsor.amount);
    setPayingSponsor(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('iuran')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'iuran'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Iuran Wajib Panitia</span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {committeeFees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sponsor')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'sponsor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Sponsorship &amp; Donatur</span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {sponsorships.length}
            </span>
          </button>
        </div>

        <div>
          {activeTab === 'iuran' ? (
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Panitia</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSponsorModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mitra Sponsor</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: IURAN PANITIA */}
      {activeTab === 'iuran' && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Target Total Iuran</span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                {formatRupiah(totalFeeTarget)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {committeeFees.length} anggota panitia
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Iuran Terkumpul</span>
              <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
                {formatRupiah(totalFeeCollected)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Realisasi {formatPercent(totalFeeTarget > 0 ? (totalFeeCollected / totalFeeTarget) * 100 : 0)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Belum Terbayar (Piutang)</span>
              <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
                {formatRupiah(Math.max(0, totalFeeTarget - totalFeeCollected))}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {committeeFees.filter(f => f.status !== 'lunas').length} panitia belum lunas
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Status Kelunasan Anggota</span>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  {committeeFees.filter(f => f.status === 'lunas').length} dari {committeeFees.length} Lunas
                </span>
                <span className="font-mono text-emerald-600 font-bold">
                  {formatPercent(committeeFees.length > 0 ? (committeeFees.filter(f => f.status === 'lunas').length / committeeFees.length) * 100 : 0, 0)}
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${committeeFees.length > 0 ? (committeeFees.filter(f => f.status === 'lunas').length / committeeFees.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={feeSearch}
                onChange={e => setFeeSearch(e.target.value)}
                placeholder="Cari nama anggota atau divisi..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-slate-500">Status:</span>
              <select
                value={feeStatusFilter}
                onChange={e => setFeeStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="semua">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="sebagian">Sebagian (Kurang)</option>
                <option value="belum">Belum Bayar</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Anggota</th>
                    <th className="py-3 px-4">Jabatan / Divisi</th>
                    <th className="py-3 px-4 text-right">Target Iuran</th>
                    <th className="py-3 px-4 text-right">Terbayar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Tanggal &amp; Metode</th>
                    <th className="py-3 px-4 text-center">Aksi / Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredFees.map(fee => {
                    const remaining = fee.targetAmount - fee.paidAmount;
                    const waLink = createWhatsAppReminderLink(
                      fee.phone,
                      fee.memberName,
                      remaining,
                      committeeInfo.eventName
                    );

                    let statusBadge = (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Lunas</span>
                      </span>
                    );

                    if (fee.status === 'belum') {
                      statusBadge = (
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Belum Bayar</span>
                        </span>
                      );
                    } else if (fee.status === 'sebagian') {
                      statusBadge = (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Kurang {formatRupiah(remaining)}</span>
                        </span>
                      );
                    }

                    return (
                      <tr key={fee.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900">
                          {fee.memberName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {fee.divisionOrRole}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-700">
                          {formatRupiah(fee.targetAmount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                          {formatRupiah(fee.paidAmount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {statusBadge}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {fee.lastPaidDate ? (
                            <>
                              <span>{formatDateIndo(fee.lastPaidDate)}</span>
                              <span className="text-slate-400 block">{fee.paymentMethod || 'Transfer'}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {fee.status !== 'lunas' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayingMember(fee);
                                    setPayAmountRaw(remaining.toString());
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                                  title="Catat Pembayaran Iuran"
                                >
                                  Catat Bayar
                                </button>
                                {fee.phone && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                    title="Kirim Pengingat WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                )}
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeletingFeeId(fee.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPONSORSHIP & DONATUR */}
      {activeTab === 'sponsor' && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Komitmen Sponsor</span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                {formatRupiah(totalSponsorCommitted)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {sponsorships.length} mitra &amp; donatur
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Dana Sponsor Masuk (Cair)</span>
              <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
                {formatRupiah(totalSponsorReceived)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {formatPercent(totalSponsorCommitted > 0 ? (totalSponsorReceived / totalSponsorCommitted) * 100 : 0)} dari total kontrak
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Sisa Termin Belum Cair</span>
              <span className="text-xl font-bold font-mono text-amber-600 mt-1 block">
                {formatRupiah(Math.max(0, totalSponsorCommitted - totalSponsorReceived))}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Termin jatuh tempo terjadwal
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">Kelengkapan Administrasi</span>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">MoU &amp; Kuitansi Bermeterai</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Arsip resmi bendahara umum
              </span>
            </div>
          </div>

          {/* Sponsor Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sponsorSearch}
                onChange={e => setSponsorSearch(e.target.value)}
                placeholder="Cari nama perusahaan atau PIC..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-slate-500">Tier:</span>
              <select
                value={sponsorTierFilter}
                onChange={e => setSponsorTierFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="semua">Semua Tier</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Media Partner">Media Partner</option>
                <option value="Donatur Perorangan">Donatur Perorangan</option>
              </select>
            </div>
          </div>

          {/* Sponsorship Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSponsors.map(sponsor => {
              const remaining = sponsor.committedAmount - sponsor.receivedAmount;
              const percent = (sponsor.receivedAmount / (sponsor.committedAmount || 1)) * 100;

              return (
                <div
                  key={sponsor.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header: Title and Tier */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Paket: {sponsor.tier}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">
                          {sponsor.sponsorName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {sponsor.invoiceStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeletingSponsorId(sponsor.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus Sponsor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Amount */}
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Pencairan:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatRupiah(sponsor.receivedAmount)} / {formatRupiah(sponsor.committedAmount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Contact & Notes */}
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-400">PIC Mitra: </span>
                        <span className="font-medium text-slate-800">{sponsor.picContact}</span>
                        {sponsor.contactPhone && <span> ({sponsor.contactPhone})</span>}
                      </div>
                      {sponsor.notes && (
                        <div className="text-slate-500 text-[11px] italic">
                          Catatan: {sponsor.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Terms Tracker */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                      Jadwal Termin Pembayaran:
                    </span>
                    <div className="space-y-1.5">
                      {sponsor.terms.map(term => (
                        <div
                          key={term.termNumber}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/80 border border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              Termin {term.termNumber} ({term.percentage}%)
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Jatuh Tempo: {formatDateIndo(term.dueDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {formatRupiah(term.amount)}
                            </span>
                            {term.status === 'lunas' ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Lunas
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setPayingSponsor({
                                    sponsor,
                                    termNumber: term.termNumber,
                                    amount: term.amount,
                                  })
                                }
                                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                              >
                                Cairkan
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Add Committee Member */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Anggota Panitia (Iuran)
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Anggota <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Divisi Panitia
                </label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                  placeholder="Contoh: Staff Divisi Acara"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Kewajiban Iuran (Rp)
                </label>
                <input
                  type="text"
                  value={memberTargetRaw}
                  onChange={e => setMemberTargetRaw(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="150000"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp (Untuk Reminder Otomatis)
                </label>
                <input
                  type="text"
                  value={memberPhone}
                  onChange={e => setMemberPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Modal for Iuran */}
      {payingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Catat Setoran Iuran Panitia
              </h3>
              <button
                onClick={() => setPayingMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmFeePay} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                <div className="font-semibold text-slate-900 text-sm">{payingMember.memberName}</div>
                <div className="text-slate-500">{payingMember.divisionOrRole}</div>
                <div className="mt-2 text-slate-700">
                  Target: <span className="font-mono font-bold">{formatRupiah(payingMember.targetAmount)}</span> · Sudah Bayar: <span className="font-mono text-emerald-600 font-bold">{formatRupiah(payingMember.paidAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran Kali Ini (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={payAmountRaw}
                  onChange={e => setPayAmountRaw(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
                >
                  <option value="Transfer BCA">Transfer BCA Rekening Kas</option>
                  <option value="Transfer Mandiri">Transfer Mandiri Kas</option>
                  <option value="QRIS Kas Panitia">QRIS Kas Panitia</option>
                  <option value="Tunai / Cash">Tunai ke Bendahara</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                * Pembayaran ini akan secara otomatis dimasukkan ke buku transaksi kas masuk kepanitiaan.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Sponsor */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Mitra Sponsor / Donatur
              </h3>
              <button
                onClick={() => setIsSponsorModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Lembaga / Donatur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  placeholder="Contoh: PT Telekomunikasi Indonesia"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paket / Tier
                  </label>
                  <select
                    value={sponsorTier}
                    onChange={e => setSponsorTier(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
                  >
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Media Partner">Media Partner</option>
                    <option value="Donatur Perorangan">Donatur Perorangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Komitmen (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sponsorAmountRaw}
                    onChange={e => setSponsorAmountRaw(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="25000000"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berapa Termin Pencairan?
                  </label>
                  <select
                    value={sponsorTermsCount}
                    onChange={e => setSponsorTermsCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-800"
                  >
                    <option value="1">1 Termin (100% Sekaligus)</option>
                    <option value="2">2 Termin (50% - 50%)</option>
                    <option value="3">3 Termin (40% - 40% - 20%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIC Sponsor
                  </label>
                  <input
                    type="text"
                    value={sponsorPic}
                    onChange={e => setSponsorPic(e.target.value)}
                    placeholder="Nama PIC"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kontak / WhatsApp PIC
                </label>
                <input
                  type="text"
                  value={sponsorPhone}
                  onChange={e => setSponsorPhone(e.target.value)}
                  placeholder="08112345678"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Kesepakatan / Kontraprestasi
                </label>
                <textarea
                  rows={2}
                  value={sponsorNotes}
                  onChange={e => setSponsorNotes(e.target.value)}
                  placeholder="Logo di backdrop, booth eksklusif, adlips MC..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSponsorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Simpan Sponsor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation for Sponsor Term Payment */}
      <ConfirmationModal
        isOpen={payingSponsor !== null}
        title="Konfirmasi Pencairan Termin Sponsor"
        message={`Apakah Anda yakin dana termin ${payingSponsor?.termNumber} sebesar ${formatRupiah(payingSponsor?.amount || 0)} dari ${payingSponsor?.sponsor.sponsorName} telah resmi masuk rekening kas kepanitiaan? Transaksi ini akan otomatis dimasukkan ke buku kas masuk.`}
        confirmText="Ya, Catat Pencairan"
        isDangerous={false}
        onConfirm={handleConfirmSponsorTerm}
        onCancel={() => setPayingSponsor(null)}
      />

      {/* Delete Fee Confirmation */}
      <ConfirmationModal
        isOpen={deletingFeeId !== null}
        title="Hapus Data Iuran Anggota"
        message="Apakah Anda yakin ingin menghapus anggota ini dari daftar pelacakan iuran?"
        confirmText="Hapus Anggota"
        onConfirm={() => {
          if (deletingFeeId) deleteCommitteeFee(deletingFeeId);
          setDeletingFeeId(null);
        }}
        onCancel={() => setDeletingFeeId(null)}
      />

      {/* Delete Sponsor Confirmation */}
      <ConfirmationModal
        isOpen={deletingSponsorId !== null}
        title="Hapus Data Sponsorship"
        message="Apakah Anda yakin ingin menghapus data kemitraan sponsor ini?"
        confirmText="Hapus Sponsor"
        onConfirm={() => {
          if (deletingSponsorId) deleteSponsorship(deletingSponsorId);
          setDeletingSponsorId(null);
        }}
        onCancel={() => setDeletingSponsorId(null)}
      />
    </div>
  );
};
