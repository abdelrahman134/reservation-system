'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  Grid,
  ListFilter,
  KeyRound,
  RotateCcw,
  Phone,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DeliveryModal from '@/components/DeliveryModal';
import ReceiverModal from '@/components/ReceiverModal';

interface Apartment {
  _id: string;
  name: string;
}

interface StaffUser {
  _id: string;
  name: string;
}

interface Reservation {
  _id: string;
  clientName: string;
  clientPhone: string;
  apartment: { _id: string; name: string };
  createdByStaff: { _id: string; name: string };
  startDate: string;
  endDate: string;
  pricePerDay: number;
  deposit: number;
  totalValue: number;
  status: string;
}

export default function CalendarPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'gantt'>('month');
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  // Quick Action Handoff Modals
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deliveryTarget, setDeliveryTarget] = useState<Reservation | null>(null);
  const [receiverTarget, setReceiverTarget] = useState<Reservation | null>(null);

  const fetchData = async () => {
    try {
      const [apRes, usRes, resRes] = await Promise.all([
        fetch('/api/apartments', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/users', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/reservations', { cache: 'no-store' }).then((r) => r.json()),
      ]);

      setApartments(Array.isArray(apRes) ? apRes : []);
      setStaffList(Array.isArray(usRes) ? usRes : []);
      setReservations(Array.isArray(resRes) ? resRes : []);
    } catch (err) {
      console.error(err);
      setApartments([]);
      setStaffList([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar Day Generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });
  const daysInMonthOnly = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const safeReservations = Array.isArray(reservations) ? reservations : [];

  // Helper to find reservation for a given apartment on a given day
  const getReservationForDay = (aptId: string, day: Date) => {
    return safeReservations.find((r) => {
      if (!r || r.status === 'cancelled') return false;
      if (aptId !== 'all' && r.apartment?._id !== aptId) return false;
      if (!r.startDate || !r.endDate) return false;
      const start = parseISO(r.startDate);
      const end = parseISO(r.endDate);
      return isWithinInterval(day, { start, end }) || isSameDay(day, start);
    });
  };

  const handleCellClick = (day: Date, aptId?: string) => {
    const existing = aptId
      ? safeReservations.find((r) => {
          if (!r || r.status === 'cancelled') return false;
          if (r.apartment?._id !== aptId) return false;
          if (!r.startDate || !r.endDate) return false;
          const start = parseISO(r.startDate);
          const end = parseISO(r.endDate);
          return isWithinInterval(day, { start, end }) || isSameDay(day, start);
        })
      : null;

    if (existing) {
      setSelectedReservation(existing);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const safeApartments = Array.isArray(apartments) ? apartments : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-blue-600" /> {t('calendarTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('calendarSubtitle')}</p>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* View Mode Toggle */}
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{t('monthGrid')}</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'gantt'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{t('allApartmentsGantt')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {t('today')}
          </button>
        </div>

        {/* Apartment Selector Filter */}
        {viewMode === 'month' && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedApartmentId}
              onChange={(e) => setSelectedApartmentId(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="all">{t('allApartmentsView')}</option>
              {safeApartments.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {apt.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: Monthly Grid View */}
      {viewMode === 'month' && (
        <div className="glass-card rounded-2xl p-6 overflow-hidden">
          <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div>{language === 'ar' ? 'أحد' : 'Sun'}</div>
            <div>{language === 'ar' ? 'إثنين' : 'Mon'}</div>
            <div>{language === 'ar' ? 'ثلاثاء' : 'Tue'}</div>
            <div>{language === 'ar' ? 'أربعاء' : 'Wed'}</div>
            <div>{language === 'ar' ? 'خميس' : 'Thu'}</div>
            <div>{language === 'ar' ? 'جمعة' : 'Fri'}</div>
            <div>{language === 'ar' ? 'سبت' : 'Sat'}</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const reservation = getReservationForDay(selectedApartmentId, day);

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(day, selectedApartmentId)}
                  className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    !isCurrentMonth
                      ? 'bg-slate-50/50 border-slate-100 text-slate-300'
                      : isToday
                      ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center'
                          : isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {reservation && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReservation(reservation);
                      }}
                      className="mt-1 p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-medium shadow-sm hover:brightness-110 transition-all truncate"
                    >
                      <div className="font-semibold truncate">{reservation.clientName}</div>
                      <div className="text-[10px] opacity-90 truncate">
                        {reservation.apartment?.name} &bull; ${reservation.totalValue}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Gantt Chart View for All Apartments */}
      {viewMode === 'gantt' && (
        <div className="glass-card rounded-2xl p-6 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[160px_repeat(31,1fr)] border-b border-slate-200 pb-3 mb-3 text-center">
              <div className="text-left rtl:text-right font-bold text-xs text-slate-500 uppercase">
                {t('propertyUnit')}
              </div>
              {daysInMonthOnly.map((d, i) => (
                <div key={i} className="text-[11px] font-semibold text-slate-500">
                  <div>{format(d, 'd')}</div>
                  <div className="text-[9px] text-slate-400">{format(d, 'eee')[0]}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {safeApartments.map((apt) => (
                <div
                  key={apt._id}
                  className="grid grid-cols-[160px_repeat(31,1fr)] items-center py-2 hover:bg-slate-50/80 rounded-xl transition-colors"
                >
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2 px-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{apt.name}</span>
                  </div>

                  {daysInMonthOnly.map((d, i) => {
                    const res = getReservationForDay(apt._id, d);
                    const isStart = res && res.startDate && isSameDay(parseISO(res.startDate), d);

                    return (
                      <div
                        key={i}
                        onClick={() => handleCellClick(d, apt._id)}
                        className={`h-8 border-r rtl:border-l border-slate-100 flex items-center justify-center cursor-pointer transition-all ${
                          res
                            ? 'bg-blue-600 text-white font-semibold text-[10px]'
                            : 'hover:bg-blue-50'
                        } ${isStart ? 'rounded-l-lg rtl:rounded-r-lg pl-1' : ''}`}
                      >
                        {isStart && <span className="truncate">{res.clientName}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details Drawer & Quick Handoff Actions */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-bold text-slate-900">{t('reservationDetails')}</h3>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('clientName')}</span>
                <p className="font-bold text-slate-900">{selectedReservation.clientName}</p>
                <a
                  href={`tel:${selectedReservation.clientPhone}`}
                  className="inline-flex items-center space-x-1 rtl:space-x-reverse text-blue-600 text-xs font-semibold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedReservation.clientPhone}</span>
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('apartmentName')}</span>
                <p className="font-bold text-slate-900">{selectedReservation.apartment?.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{t('checkIn')}</span>
                  <p className="font-bold text-slate-900">
                    {selectedReservation.startDate ? format(parseISO(selectedReservation.startDate), 'MMM dd, yyyy') : ''}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{t('checkOut')}</span>
                  <p className="font-bold text-slate-900">
                    {selectedReservation.endDate ? format(parseISO(selectedReservation.endDate), 'MMM dd, yyyy') : ''}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase">{t('totalValue')}</span>
                <span className="text-lg font-extrabold text-emerald-600">
                  ${selectedReservation.totalValue?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Handoff Actions */}
            <div className="pt-2 flex items-center justify-between border-t gap-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => {
                    setDeliveryTarget(selectedReservation);
                    setSelectedReservation(null);
                  }}
                  className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t('delivery')}</span>
                </button>
                <button
                  onClick={() => {
                    setReceiverTarget(selectedReservation);
                    setSelectedReservation(null);
                  }}
                  className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('receiver')}</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedReservation(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Handoff Popup */}
      {deliveryTarget && (
        <DeliveryModal
          reservationId={deliveryTarget._id}
          clientName={deliveryTarget.clientName}
          totalValue={deliveryTarget.totalValue}
          staffList={staffList}
          onClose={() => setDeliveryTarget(null)}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Receiver Return Handoff Popup */}
      {receiverTarget && (
        <ReceiverModal
          reservationId={receiverTarget._id}
          clientName={receiverTarget.clientName}
          staffList={staffList}
          onClose={() => setReceiverTarget(null)}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  );
}
