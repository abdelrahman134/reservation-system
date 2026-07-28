'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck2,
  Plus,
  Phone,
  KeyRound,
  RotateCcw,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DeliveryModal from '@/components/DeliveryModal';
import ReceiverModal from '@/components/ReceiverModal';
import ReservationModal, { ReservationData } from '@/components/ReservationModal';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

interface StaffOption {
  _id: string;
  name: string;
}

interface ApartmentOption {
  _id: string;
  name: string;
}

interface ReservationItem {
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
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [apartments, setApartments] = useState<ApartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // Filters
  const [filterApartment, setFilterApartment] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({});

  const handleFilterChange = useCallback((filter: DateFilterValue) => {
    setDateFilter(filter);
  }, []);

  // Reservation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationData | null>(null);

  // Delivery & Receiver Modal Handoff States
  const [deliveryTarget, setDeliveryTarget] = useState<ReservationItem | null>(null);
  const [receiverTarget, setReceiverTarget] = useState<ReservationItem | null>(null);
  const [successToast, setSuccessToast] = useState('');

  const fetchInitialData = async () => {
    try {
      const [resUsers, resApartments] = await Promise.all([
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/apartments').then((r) => r.json()),
      ]);
      setStaffList(resUsers);
      setApartments(resApartments);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterApartment) query.append('apartment', filterApartment);
      if (filterStaff) query.append('user', filterStaff);
      if (filterStatus) query.append('status', filterStatus);
      if (dateFilter.fromDate) query.append('fromDate', dateFilter.fromDate);
      if (dateFilter.toDate) query.append('toDate', dateFilter.toDate);

      const res = await fetch(`/api/reservations?${query.toString()}`);
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [filterApartment, filterStaff, filterStatus, dateFilter.fromDate, dateFilter.toDate]);

  const openNewReservationModal = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (res: ReservationItem) => {
    setEditingReservation({
      _id: res._id,
      clientName: res.clientName,
      clientPhone: res.clientPhone,
      apartment: res.apartment?._id || '',
      createdByStaff: res.createdByStaff?._id || '',
      startDate: res.startDate,
      endDate: res.endDate,
      pricePerDay: res.pricePerDay,
      deposit: res.deposit,
      status: res.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Soft-delete this reservation? This will soft-delete associated deposit, delivery, and return insurance entries to preserve data integrity.')) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessToast('Reservation and linked financial entries soft-deleted!');
        setTimeout(() => setSuccessToast(''), 4000);
        fetchReservations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.clientName.toLowerCase().includes(q) ||
      r.clientPhone.toLowerCase().includes(q) ||
      r.apartment?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarCheck2 className="w-8 h-8 text-indigo-600" /> {t('reservationsTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('reservationsSubtitle')}</p>
        </div>
        <button
          onClick={openNewReservationModal}
          className="inline-flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newBooking')}</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-r-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 rtl:pr-9 rtl:pl-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterApartment}
            onChange={(e) => setFilterApartment(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="">{t('allApartments')}</option>
            {apartments.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="">{t('allStaff')}</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>

        <DateRangeFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Reservations Table */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {t('noMatchingReservations')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">
                    {t('clientName')}
                  </th>
                  <th className="px-4 py-3.5">{t('clientPhone')}</th>
                  <th className="px-4 py-3.5">{t('apartmentName')}</th>
                  <th className="px-4 py-3.5">التواريخ</th>
                  <th className="px-4 py-3.5">{t('pricePerDay')}</th>
                  <th className="px-4 py-3.5">{t('totalValue')}</th>
                  <th className="px-4 py-3.5">{t('status')}</th>
                  <th className="px-4 py-3.5 text-right rtl:text-left rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
                    Key Handoff Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {res.clientName}
                    </td>
                    <td className="px-4 py-4">
                      <a
                        href={`tel:${res.clientPhone}`}
                        className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-blue-600 hover:underline font-medium text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                        title={t('callClient')}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{res.clientPhone}</span>
                      </a>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {res.apartment?.name || 'Apartment'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-xs">
                      {format(new Date(res.startDate), 'MMM dd')} &rarr;{' '}
                      {format(new Date(res.endDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      ${res.pricePerDay}
                    </td>
                    <td className="px-4 py-4 font-extrabold text-emerald-600">
                      ${res.totalValue?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
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
                    <td className="px-4 py-4 text-right rtl:text-left space-x-2 rtl:space-x-reverse whitespace-nowrap">
                      <button
                        onClick={() => setDeliveryTarget(res)}
                        className="inline-flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{t('delivery')}</span>
                      </button>
                      <button
                        onClick={() => setReceiverTarget(res)}
                        className="inline-flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('receiver')}</span>
                      </button>
                      <button
                        onClick={() => openEditModal(res)}
                        title="Edit Reservation"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(res._id)}
                        title="Delete Reservation"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reservation Reusable Modal */}
      {isModalOpen && (
        <ReservationModal
          initialData={editingReservation}
          staffList={staffList}
          apartments={apartments}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setSuccessToast('Reservation saved successfully!');
            setTimeout(() => setSuccessToast(''), 4000);
            fetchReservations();
          }}
        />
      )}

      {/* Delivery Handoff Popup */}
      {deliveryTarget && (
        <DeliveryModal
          reservationId={deliveryTarget._id}
          clientName={deliveryTarget.clientName}
          totalValue={deliveryTarget.totalValue}
          staffList={staffList}
          onClose={() => setDeliveryTarget(null)}
          onSuccess={() => {
            setSuccessToast(t('deliverySuccess'));
            setTimeout(() => setSuccessToast(''), 4000);
            fetchReservations();
          }}
        />
      )}

      {/* Receiver Return Handoff Popup */}
      {receiverTarget && (
        <ReceiverModal
          reservationId={receiverTarget._id}
          clientName={receiverTarget.clientName}
          staffList={staffList}
          onClose={() => setReceiverTarget(null)}
          onSuccess={() => {
            setSuccessToast(t('receiverSuccess'));
            setTimeout(() => setSuccessToast(''), 4000);
            fetchReservations();
          }}
        />
      )}
    </div>
  );
}
