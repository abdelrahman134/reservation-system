'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffOption {
  _id: string;
  name: string;
}

interface ApartmentOption {
  _id: string;
  name: string;
}

export interface ReservationData {
  _id?: string;
  clientName: string;
  clientPhone: string;
  apartment: string;
  createdByStaff: string;
  startDate: string;
  endDate: string;
  pricePerDay: number;
  deposit: number;
  status?: string;
}

interface ReservationModalProps {
  initialData?: ReservationData | null;
  staffList: StaffOption[];
  apartments: ApartmentOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationModal({
  initialData,
  staffList,
  apartments,
  onClose,
  onSuccess,
}: ReservationModalProps) {
  const { t } = useLanguage();
  const isEdit = !!initialData?._id;

  const [formData, setFormData] = useState({
    clientName: initialData?.clientName || '',
    clientPhone: initialData?.clientPhone || '',
    apartment: initialData?.apartment || apartments[0]?._id || '',
    createdByStaff: initialData?.createdByStaff || staffList[0]?._id || '',
    startDate: initialData?.startDate
      ? format(new Date(initialData.startDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    endDate: initialData?.endDate
      ? format(new Date(initialData.endDate), 'yyyy-MM-dd')
      : format(new Date(Date.now() + 86400000 * 2), 'yyyy-MM-dd'),
    pricePerDay: initialData?.pricePerDay?.toString() || '100',
    deposit: initialData?.deposit?.toString() || '50',
    status: initialData?.status || 'confirmed',
  });

  const [errorAlert, setErrorAlert] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateLiveTotal = () => {
    const price = parseFloat(formData.pricePerDay) || 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const nights = Math.max(1, differenceInDays(end, start));
    return price * nights;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorAlert('');

    const payload = {
      clientName: formData.clientName.trim(),
      clientPhone: formData.clientPhone.trim(),
      apartment: formData.apartment,
      createdByStaff: formData.createdByStaff,
      startDate: formData.startDate,
      endDate: formData.endDate,
      pricePerDay: parseFloat(formData.pricePerDay) || 0,
      deposit: parseFloat(formData.deposit) || 0,
      status: formData.status,
    };

    try {
      const url = isEdit ? `/api/reservations/${initialData._id}` : '/api/reservations';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save reservation');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorAlert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold text-slate-900">
            {isEdit ? t('updateReservation') : t('newBooking')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {errorAlert && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorAlert}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('clientName')}
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Hassan Ahmed"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('clientPhone')}
              </label>
              <input
                type="tel"
                required
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="e.g. +201234567890"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('selectApartment')}
              </label>
              <select
                required
                value={formData.apartment}
                onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                {apartments.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('staffMember')}
              </label>
              <select
                required
                value={formData.createdByStaff}
                onChange={(e) => setFormData({ ...formData, createdByStaff: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('checkIn')}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('checkOut')}
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('pricePerDay')}
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('deposit')}
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('totalValue')} (Live)
              </label>
              <input
                type="text"
                readOnly
                value={`$${calculateLiveTotal()}`}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-extrabold text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? t('validatingAndSaving') : isEdit ? t('updateReservation') : t('confirmBooking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
