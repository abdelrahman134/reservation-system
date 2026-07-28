'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCheck, TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

interface StaffInsightItem {
  staff: {
    _id: string;
    name: string;
  };
  totalRevenue: number;
  totalExpense: number;
  netCash: number;
  revenues: Array<{
    _id: string;
    name: string;
    value: number;
    source: string;
    createdAt: string;
  }>;
  expenses: Array<{
    _id: string;
    name: string;
    value: number;
    source: string;
    createdAt: string;
  }>;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<StaffInsightItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({});
  const { t } = useLanguage();

  const handleFilterChange = useCallback((filter: DateFilterValue) => {
    setDateFilter(filter);
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const query = new URLSearchParams();
      if (selectedStaffId !== 'all') query.append('staff', selectedStaffId);
      if (dateFilter.fromDate) query.append('fromDate', dateFilter.fromDate);
      if (dateFilter.toDate) query.append('toDate', dateFilter.toDate);

      const res = await fetch(`/api/insights?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch insights data');
      }

      setInsights(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Frontend error fetching /api/insights:', err);
      setErrorMsg(err.message || 'Error loading staff insights');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedStaffId, dateFilter.fromDate, dateFilter.toDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-purple-600" /> {t('insightsTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('insightsSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="py-2 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 shadow-sm"
          >
            <option value="all">{t('allStaff')}</option>
            {(insights || []).map((item) => (
              <option key={item.staff._id} value={item.staff._id}>
                {item.staff.name}
              </option>
            ))}
          </select>

          <DateRangeFilter onFilterChange={handleFilterChange} />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Staff Insights Cards */}
      <div className="space-y-4">
        {(!insights || insights.length === 0) ? (
          <div className="text-center py-12 text-slate-500 text-sm glass-card rounded-2xl">
            No staff financial records found.
          </div>
        ) : (
          insights.map((item) => {
            const isExpanded = expandedStaffId === item.staff._id;
            const isPositive = (item.netCash || 0) >= 0;
            const revList = item.revenues || [];
            const expList = item.expenses || [];

            return (
              <div key={item.staff._id} className="glass-card rounded-2xl p-6 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 font-bold text-lg flex items-center justify-center">
                      {item.staff?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.staff?.name || 'Staff Member'}</h3>
                      <span className="text-xs text-slate-500">{t('staffMember')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center sm:text-right rtl:sm:text-left">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {t('totalRevenue')}
                      </span>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">
                        +${(item.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {t('totalExpenses')}
                      </span>
                      <p className="text-sm font-bold text-rose-600 mt-0.5">
                        -${(item.totalExpense || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {t('earnedHandled')}
                      </span>
                      <p className={`text-base font-extrabold mt-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${(item.netCash || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expand Toggle */}
                <div className="pt-3 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedStaffId(isExpanded ? null : item.staff._id)}
                    className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Itemized Breakdown' : t('itemizedBreakdown')}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <span className="text-xs text-slate-400">
                    {revList.length + expList.length} entries on record
                  </span>
                </div>

                {/* Expandable Breakdown Table */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Revenue &amp; Expense Audit Trail
                    </h4>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {revList.map((r) => (
                        <div
                          key={r._id}
                          className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900">{r.name}</span>
                              <span className="ml-2 rtl:mr-2 text-[10px] uppercase font-bold text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-100">
                                {r.source}
                              </span>
                            </div>
                          </div>
                          <div className="text-right rtl:text-left">
                            <span className="font-bold text-emerald-600">+${(r.value || 0).toLocaleString()}</span>
                            <div className="text-[10px] text-slate-400">
                              {r.createdAt ? format(new Date(r.createdAt), 'MMM dd, HH:mm') : ''}
                            </div>
                          </div>
                        </div>
                      ))}

                      {expList.map((e) => (
                        <div
                          key={e._id}
                          className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                            <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900">{e.name}</span>
                              <span className="ml-2 rtl:mr-2 text-[10px] uppercase font-bold text-rose-700 px-1.5 py-0.5 rounded bg-rose-100">
                                {e.source}
                              </span>
                            </div>
                          </div>
                          <div className="text-right rtl:text-left">
                            <span className="font-bold text-rose-600">-${(e.value || 0).toLocaleString()}</span>
                            <div className="text-[10px] text-slate-400">
                              {e.createdAt ? format(new Date(e.createdAt), 'MMM dd, HH:mm') : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
