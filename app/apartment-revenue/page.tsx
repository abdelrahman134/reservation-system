'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Building2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

interface ApartmentRevenueItem {
  _id: string;
  name: string;
  totalRevenue: number;
  reservationCount: number;
  reservations: Array<{
    _id: string;
    clientName: string;
    totalValue: number;
    startDate: string;
  }>;
}

export default function ApartmentRevenuePage() {
  const [data, setData] = useState<ApartmentRevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({});
  const { t } = useLanguage();

  const handleFilterChange = useCallback((filter: DateFilterValue) => {
    setDateFilter(filter);
  }, []);

  const fetchApartmentRevenue = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (dateFilter.fromDate) query.append('fromDate', dateFilter.fromDate);
      if (dateFilter.toDate) query.append('toDate', dateFilter.toDate);

      const res = await fetch(`/api/apartment-revenue?${query.toString()}`);
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartmentRevenue();
  }, [dateFilter.fromDate, dateFilter.toDate]);

  const chartColors = ['#0284c7', '#0d9488', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];
  const grandTotal = data.reduce((acc, a) => acc + a.totalRevenue, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-600" /> {t('aptRevenueTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('aptRevenueSubtitle')}</p>
        </div>

        <DateRangeFilter onFilterChange={handleFilterChange} />
      </div>

      {/* KPI Total Card */}
      <div className="glass-card p-6 rounded-2xl max-w-md">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Total Reservation Value
        </span>
        <h3 className="text-3xl font-extrabold text-amber-600 mt-2">
          ${grandTotal.toLocaleString()}
        </h3>
      </div>

      {/* Recharts Visualization */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t('apartmentPerformance')}</h3>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total Reservation Value']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t('detailedBreakdown')}</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                  {t('apartmentName')}
                </th>
                <th className="px-4 py-3.5">{t('reservationsCount')}</th>
                <th className="px-4 py-3.5 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
                  Total Reservation Value ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((apt) => (
                <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{apt.name}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{apt.reservationCount}</td>
                  <td className="px-4 py-4 font-bold text-amber-600">
                    ${apt.totalRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
