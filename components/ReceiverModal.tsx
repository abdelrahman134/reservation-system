'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffUser {
  _id: string;
  name: string;
}

interface ReceiverModalProps {
  reservationId: string;
  clientName: string;
  staffList: StaffUser[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiverModal({
  reservationId,
  clientName,
  staffList,
  onClose,
  onSuccess,
}: ReceiverModalProps) {
  const { t } = useLanguage();
  const [selectedStaff, setSelectedStaff] = useState<string>(staffList[0]?._id || '');
  const [returnInsurance, setReturnInsurance] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsLoadingExisting(true);
    fetch(`/api/receivers?reservation=${reservationId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((existing) => {
        if (existing && existing._id) {
          setIsEditMode(true);
          if (existing.staffUser?._id) setSelectedStaff(existing.staffUser._id);
          else if (typeof existing.staffUser === 'string') setSelectedStaff(existing.staffUser);

          if (existing.returnInsurance !== undefined) {
            setReturnInsurance(existing.returnInsurance.toString());
          }
        }
      })
      .catch((err) => console.error('Failed to load existing receiver return:', err))
      .finally(() => setIsLoadingExisting(false));
  }, [reservationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/receivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation: reservationId,
          staffUser: selectedStaff,
          returnInsurance: parseFloat(returnInsurance) || 0,
        }),
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record key return handoff');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording receiver');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <RotateCcw className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-bold text-slate-900">
              {isEditMode ? 'Update Receiver Return' : t('receiverPopupTitle')}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoadingExisting ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{t('clientName')}:</span>
              <span className="font-bold text-purple-900">{clientName}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('receivingStaff')}
              </label>
              <select
                required
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              >
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('returnInsurance')}
              </label>
              <input
                type="number"
                min="0"
                required
                value={returnInsurance}
                onChange={(e) => setReturnInsurance(e.target.value)}
                placeholder="100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm font-bold text-purple-700"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Submitting logs an Expense entry for returned insurance.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2 border-t">
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
                className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? t('saving') : isEditMode ? 'Update Return' : t('recordReceiver')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
