'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  CalendarDays,
  Receipt,
  Wallet,
  UserCheck,
  BarChart3,
  TrendingDown,
  Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface DashboardData {
  totalStaff: number;
  totalApartments: number;
  totalReservations: number;
  totalRevenue: number;
  totalExpenses: number;
  netCash: number;
  recentReservations: Array<{
    _id: string;
    clientName: string;
    clientPhone: string;
    apartment: { name: string };
    createdByStaff: { name: string };
    startDate: string;
    endDate: string;
    totalValue: number;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('dashboardTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('dashboardSubtitle')}</p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Link
            href="/reservations"
            className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('newBooking')}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('netCash')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-xl font-bold ${data && data.netCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${data?.netCash.toLocaleString() || '0'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Rev - Exp</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('totalRevenue')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900">
              ${data?.totalRevenue.toLocaleString() || '0'}
            </h3>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">+ Handled</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('totalExpenses')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900">
              ${data?.totalExpenses.toLocaleString() || '0'}
            </h3>
            <p className="text-[10px] text-rose-600 mt-0.5 font-medium">- Paid</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('reservations')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900">
              {data?.totalReservations || 0}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('confirmedBookings')}</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('totalStaff')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900">
              {data?.totalStaff || 0}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('usersTitle')}</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('apartments')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900">
              {data?.totalApartments || 0}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('activeProperties')}</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/insights"
          className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:shadow-md hover:border-purple-400 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{t('insights')}</h4>
              <p className="text-[11px] text-slate-500">{t('earnedHandled')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
        </Link>

        <Link
          href="/calendar"
          className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:shadow-md hover:border-blue-400 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{t('calendar')}</h4>
              <p className="text-[11px] text-slate-500">{t('calendarSubtitle')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
        </Link>

        <Link
          href="/expenses"
          className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:shadow-md hover:border-rose-400 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{t('expenses')}</h4>
              <p className="text-[11px] text-slate-500">{t('totalExpenses')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
        </Link>

        <Link
          href="/apartment-revenue"
          className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:shadow-md hover:border-amber-400 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{t('apartmentRevenue')}</h4>
              <p className="text-[11px] text-slate-500">{t('aptRevenueSubtitle')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Reservations Feed */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('recentReservations')}</h3>
            <p className="text-xs text-slate-500">{t('latestActivity')}</p>
          </div>
          <Link
            href="/reservations"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 rtl:space-x-reverse"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!data?.recentReservations || data.recentReservations.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No reservations created yet. Click &quot;New Reservation&quot; to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                    {t('clientName')}
                  </th>
                  <th className="px-4 py-3">{t('clientPhone')}</th>
                  <th className="px-4 py-3">{t('apartmentName')}</th>
                  <th className="px-4 py-3">{t('staffMember')}</th>
                  <th className="px-4 py-3">{t('totalValue')}</th>
                  <th className="px-4 py-3 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
                    {t('status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentReservations.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {res.clientName}
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={`tel:${res.clientPhone}`}
                        className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-blue-600 hover:underline text-xs font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{res.clientPhone}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {res.apartment?.name || 'Apartment'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {res.createdByStaff?.name || 'Staff'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-600">
                      ${res.totalValue?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          res.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : res.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {t(res.status as any) || res.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
