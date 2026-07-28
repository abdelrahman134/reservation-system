'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

interface StaffUser {
  _id: string;
  name: string;
}

interface BrokerItem {
  _id: string;
  name: string;
  defaultPercentage: number;
  totalReservations: number;
  totalCommissionEarned: number;
  totalPayouts: number;
  outstandingBalance: number;
  reservations: Array<{
    _id: string;
    clientName: string;
    startDate: string;
    totalValue: number;
    brokerCommissionAmount: number;
  }>;
}

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<BrokerItem[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({});
  const [expandedBrokerId, setExpandedBrokerId] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleFilterChange = useCallback((filter: DateFilterValue) => {
    setDateFilter(filter);
  }, []);

  // Add / Edit Broker Modal State
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerItem | null>(null);
  const [brokerName, setBrokerName] = useState('');
  const [defaultPercentage, setDefaultPercentage] = useState('15');
  const [brokerError, setBrokerError] = useState('');
  const [isSubmittingBroker, setIsSubmittingBroker] = useState(false);

  // Record Payout Modal State
  const [payoutBroker, setPayoutBroker] = useState<BrokerItem | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutStaff, setPayoutStaff] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (dateFilter.fromDate) query.append('fromDate', dateFilter.fromDate);
      if (dateFilter.toDate) query.append('toDate', dateFilter.toDate);

      const [resBrokers, resStaff] = await Promise.all([
        fetch(`/api/brokers?${query.toString()}`).then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);

      setBrokers(Array.isArray(resBrokers) ? resBrokers : []);
      setStaffList(Array.isArray(resStaff) ? resStaff : []);
      if (Array.isArray(resStaff) && resStaff.length > 0 && !payoutStaff) {
        setPayoutStaff(resStaff[0]._id);
      }
    } catch (err) {
      console.error(err);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [dateFilter.fromDate, dateFilter.toDate]);

  const openAddBrokerModal = () => {
    setEditingBroker(null);
    setBrokerName('');
    setDefaultPercentage('15');
    setBrokerError('');
    setIsBrokerModalOpen(true);
  };

  const openEditBrokerModal = (broker: BrokerItem) => {
    setEditingBroker(broker);
    setBrokerName(broker.name);
    setDefaultPercentage(broker.defaultPercentage.toString());
    setBrokerError('');
    setIsBrokerModalOpen(true);
  };

  const handleBrokerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerName.trim()) return;

    setIsSubmittingBroker(true);
    setBrokerError('');

    try {
      const url = editingBroker ? `/api/brokers/${editingBroker._id}` : '/api/brokers';
      const method = editingBroker ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brokerName.trim(),
          defaultPercentage: parseFloat(defaultPercentage) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save broker');
      }

      setIsBrokerModalOpen(false);
      setSuccessToast(editingBroker ? 'Broker updated!' : 'New Broker created!');
      setTimeout(() => setSuccessToast(''), 4000);
      fetchInitialData();
    } catch (err: any) {
      setBrokerError(err.message);
    } finally {
      setIsSubmittingBroker(false);
    }
  };

  const handleDeleteBroker = async (id: string) => {
    if (!confirm('Soft-delete this broker?')) return;
    try {
      const res = await fetch(`/api/brokers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessToast('Broker soft-deleted!');
        setTimeout(() => setSuccessToast(''), 4000);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPayoutModal = (broker: BrokerItem) => {
    setPayoutBroker(broker);
    setPayoutAmount(broker.outstandingBalance > 0 ? broker.outstandingBalance.toString() : '');
    if (staffList.length > 0) setPayoutStaff(staffList[0]._id);
    setPayoutError('');
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutBroker || !payoutAmount || !payoutStaff) return;

    setIsSubmittingPayout(true);
    setPayoutError('');

    try {
      const val = parseFloat(payoutAmount) || 0;
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Broker Payout — ${payoutBroker.name}`,
          value: val,
          user: payoutStaff,
          source: 'broker-payout',
          broker: payoutBroker._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record broker payout');
      }

      setPayoutBroker(null);
      setSuccessToast(`Recorded $${val} payout to ${payoutBroker.name}!`);
      setTimeout(() => setSuccessToast(''), 4000);
      fetchInitialData();
    } catch (err: any) {
      setPayoutError(err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const grandTotalCommissions = brokers.reduce((acc, b) => acc + b.totalCommissionEarned, 0);
  const grandTotalPayouts = brokers.reduce((acc, b) => acc + b.totalPayouts, 0);
  const grandTotalOutstanding = brokers.reduce((acc, b) => acc + b.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-amber-600" /> {t('brokersTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('brokersSubtitle')}</p>
        </div>

        <button
          onClick={openAddBrokerModal}
          className="inline-flex items-center justify-center space-x-2 rtl:space-x-reverse bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addBroker')}</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-r-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* KPI & Date Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Brokers
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{brokers.length}</h3>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t('totalCommissionEarned')}
          </span>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            ${grandTotalCommissions.toLocaleString()}
          </h3>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t('totalPayouts')}
          </span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">
            ${grandTotalPayouts.toLocaleString()}
          </h3>
        </div>

        <div className="glass-card p-5 rounded-2xl border-2 border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            {t('outstandingBalance')}
          </span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            ${grandTotalOutstanding.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Filter Broker Metrics by Date
        </span>
        <DateRangeFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Brokers Table */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : brokers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {t('noBrokersFound')}
          </div>
        ) : (
          <div className="space-y-4">
            {brokers.map((broker) => {
              const isExpanded = expandedBrokerId === broker._id;

              return (
                <div
                  key={broker._id}
                  className="glass-card rounded-2xl p-5 border border-slate-100 transition-all hover:border-amber-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{broker.name}</h3>
                        <span className="text-xs text-slate-500">
                          {t('defaultPercentage')}: {broker.defaultPercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 sm:gap-5 text-center sm:text-right rtl:sm:text-left">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Reservations
                        </span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {broker.totalReservations}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Earned
                        </span>
                        <p className="text-xs font-bold text-amber-600 mt-0.5">
                          ${broker.totalCommissionEarned.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Paid Out
                        </span>
                        <p className="text-xs font-bold text-rose-600 mt-0.5">
                          ${broker.totalPayouts.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Balance
                        </span>
                        <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                          ${broker.outstandingBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedBrokerId(isExpanded ? null : broker._id)}
                      className="inline-flex items-center space-x-1 rtl:space-x-reverse text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Reservations' : `${t('reservationsBrought')} (${broker.reservations.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => openPayoutModal(broker)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                      >
                        {t('recordPayout')}
                      </button>

                      <button
                        onClick={() => openEditBrokerModal(broker)}
                        title={t('edit')}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBroker(broker._id)}
                        title={t('delete')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Reservation Breakdown */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Attributed Reservations (Selected Period)
                      </h4>

                      {broker.reservations.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No reservations brought for this period.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto">
                          {broker.reservations.map((r) => (
                            <div
                              key={r._id}
                              className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{r.clientName}</span>
                                <span className="text-[10px] text-slate-400 ml-2 rtl:mr-2">
                                  {format(new Date(r.startDate), 'MMM dd, yyyy')}
                                </span>
                              </div>

                              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <span className="text-slate-600">Total: ${r.totalValue}</span>
                                <span className="font-bold text-amber-600">
                                  Commission: ${r.brokerCommissionAmount}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Broker Modal */}
      {isBrokerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">
              {editingBroker ? t('editBroker') : t('addNewBroker')}
            </h3>

            {brokerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{brokerError}</span>
              </div>
            )}

            <form onSubmit={handleBrokerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('brokerName')}
                </label>
                <input
                  type="text"
                  required
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  placeholder="e.g. Al-Aqqar Real Estate Agency"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('defaultPercentage')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={defaultPercentage}
                  onChange={(e) => setDefaultPercentage(e.target.value)}
                  placeholder="15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm font-bold text-amber-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrokerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBroker}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmittingBroker ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payout Modal */}
      {payoutBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">
              {t('recordBrokerPayout')} — {payoutBroker.name}
            </h3>

            {payoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{payoutError}</span>
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('payoutAmount')}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-extrabold text-emerald-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Current Outstanding Balance: ${payoutBroker.outstandingBalance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('staffMember')} (Paying Staff)
                </label>
                <select
                  required
                  value={payoutStaff}
                  onChange={(e) => setPayoutStaff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                >
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutBroker(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmittingPayout ? t('saving') : t('recordPayout')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
