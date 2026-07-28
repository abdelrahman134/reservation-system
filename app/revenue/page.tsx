'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

interface StaffUser {
  _id: string;
  name: string;
}

interface RevenueItem {
  _id: string;
  name: string;
  value: number;
  user: { _id: string; name: string };
  source: 'manual' | 'deposit' | 'delivery';
  createdAt: string;
}

export default function RevenuePage() {
  const router = useRouter();
  const [revenues, setRevenues] = useState<RevenueItem[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({});
  const { t } = useLanguage();

  const handleFilterChange = useCallback((filter: DateFilterValue) => {
    setDateFilter(filter);
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (dateFilter.fromDate) query.append('fromDate', dateFilter.fromDate);
      if (dateFilter.toDate) query.append('toDate', dateFilter.toDate);

      const [resRev, resStaff] = await Promise.all([
        fetch(`/api/revenue?${query.toString()}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/users', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setRevenues(Array.isArray(resRev) ? resRev : []);
      setStaffList(Array.isArray(resStaff) ? resStaff : []);
      if (Array.isArray(resStaff) && resStaff.length > 0 && !selectedStaff) setSelectedStaff(resStaff[0]._id);
    } catch (err) {
      console.error(err);
      setRevenues([]);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [dateFilter.fromDate, dateFilter.toDate]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !valueInput || !selectedStaff) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          value: parseFloat(valueInput) || 0,
          user: selectedStaff,
          source: 'manual',
        }),
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record revenue entry');
      }

      setNameInput('');
      setValueInput('');
      setIsModalOpen(false);
      router.refresh();
      fetchInitialData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeRevenues = Array.isArray(revenues) ? revenues : [];
  const totalRevenueSum = safeRevenues.reduce((acc, r) => acc + (r.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" /> {t('revenueLogsTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('revenueLogsSubtitle')}</p>
        </div>
        <button
          onClick={() => {
            setNameInput('');
            setValueInput('');
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addRevenue')}</span>
        </button>
      </div>

      {/* KPI & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('totalRevenue')}
          </span>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-0.5">
            ${totalRevenueSum.toLocaleString()}
          </h3>
        </div>

        <DateRangeFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Revenue Table */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : safeRevenues.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No revenue entries logged for selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                    Revenue Description
                  </th>
                  <th className="px-4 py-3.5">{t('totalValue')}</th>
                  <th className="px-4 py-3.5">{t('staffMember')}</th>
                  <th className="px-4 py-3.5">{t('source')}</th>
                  <th className="px-4 py-3.5 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeRevenues.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-4 font-bold text-emerald-600">
                      ${(item.value || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-medium">
                      {item.user?.name || 'Staff'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.source === 'delivery'
                            ? 'bg-blue-100 text-blue-700'
                            : item.source === 'deposit'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.source === 'delivery'
                          ? t('deliverySource')
                          : item.source === 'deposit'
                          ? t('depositSource')
                          : t('manual')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Revenue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('addRevenue')}</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Revenue Description
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Extra cleaning fee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('totalValue')}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {t('staffMember')}
                </label>
                <select
                  required
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? t('saving') : t('addRevenue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
