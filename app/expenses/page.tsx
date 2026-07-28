'use client';

import { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

interface StaffUser {
  _id: string;
  name: string;
}

interface ExpenseItem {
  _id: string;
  name: string;
  value: number;
  user: { _id: string; name: string };
  source: 'manual' | 'receiver-return';
  createdAt: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
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

      const [resExp, resStaff] = await Promise.all([
        fetch(`/api/expenses?${query.toString()}`).then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);
      setExpenses(resExp);
      setStaffList(resStaff);
      if (resStaff.length > 0 && !selectedStaff) setSelectedStaff(resStaff[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
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
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          value: parseFloat(valueInput) || 0,
          user: selectedStaff,
          source: 'manual',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record expense');
      }

      setNameInput('');
      setValueInput('');
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpensesSum = expenses.reduce((acc, e) => acc + e.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-rose-600" /> {t('expensesTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('expensesSubtitle')}</p>
        </div>
        <button
          onClick={() => {
            setNameInput('');
            setValueInput('');
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 rtl:space-x-reverse bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-rose-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addExpense')}</span>
        </button>
      </div>

      {/* KPI & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('totalExpenses')}
          </span>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-0.5">
            ${totalExpensesSum.toLocaleString()}
          </h3>
        </div>

        <DateRangeFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Expenses Table */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No expenses logged for selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                    Expense Description
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
                {expenses.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-4 font-bold text-rose-600">
                      ${item.value.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-medium">
                      {item.user?.name || 'Staff'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.source === 'receiver-return'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.source === 'receiver-return'
                          ? t('receiverReturnSource')
                          : t('manual')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{t('addExpense')}</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Expense Description
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Apartment maintenance repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 text-sm"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 text-sm font-bold text-rose-600"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 text-sm font-medium"
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
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? t('saving') : t('addExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
